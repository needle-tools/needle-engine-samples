import { Animator, AnimatorControllerParameterType, Behaviour, Parameter, prefix, getParam, State, AnimatorController } from "@needle-tools/engine";

const debug = getParam("debugsyncanimator");

export class SyncedAnimator extends Behaviour {    
    /** 
     * Unique guid that is consistent over the network
     * By default, the guid of this component is set, that works if the object is in the scene or from a sync instantiated prefab.
     * If not, you have to set this manually.
     * */ 
    private syncedAnimGuid: string | null = null;
    // @nonSerialized
    set SyncedAnimGuid(value: string) { 
        this.syncedAnimGuid = value;
        this.registerNetMessage();
    }
    // @nonSerialized
    get SyncedAnimGuid(): string | null { return this.syncedAnimGuid; }

    // live state from the animator
    private get currentState() {
        return this.animator?.runtimeAnimatorController?.activeState!;
    }

    // live parameters that Animator uses
    private localParameters: Parameter[] = [];
    
        // state dicated by remote
    private remoteState: State | null | undefined;
    
    // animator instance that is synchronized
    private animator!: Animator;
    private currentController: AnimatorController | null | undefined = null;
    
    start(): void {
        // default value is set if not specified
        this.SyncedAnimGuid ??= `${this.guid}`;
        this.enabled = this.localParameters !== undefined;

        if (!this.enabled) {
            console.warn("SyncAnimator has to be on an object with an Animator componenet");
        }
    }

    /**
     * Update interal list parameter list
     */
    private onControllerChanged() {
        this.animator = this.gameObject.getComponent(Animator)!;
        this.currentController = this.animator?.runtimeAnimatorController;
        this.localParameters = this.currentController?.model?.parameters!;
    }

    // register to room events
    private onModelRecievedFn: Function | null = null;

    private registerNetMessage() { 
        // unregister
        if(this.onModelRecievedFn) { 
            this.context.connection.stopListen(this.syncedAnimGuid!, this.onModelRecievedFn);
        }
        // register
        this.onModelRecievedFn = this.context.connection.beginListen(this.syncedAnimGuid!, this.modelRecieved.bind(this));
    }

    onDestroy() {
        if(this.onModelRecievedFn) {
            this.context.connection.stopListen(this.syncedAnimGuid!, this.onModelRecievedFn);
        }
    }

    // property used in Prefixed onBeforeRender to exclude SyncedAnimator's onBeforeRender call.
    private isSyncAnim = true;

    // Hook into the animator and call dispatchAllChanges right before updating the animator
    // Removing all race conditions that can occur in oppose to calling this just from OnBeforeRender
    // Which could lead to loosing information
    @prefix(Animator)
    onBeforeRender() {
        // Temp workaround - onBeforeRender is called on SyncAnimator as well as a normal event, the prefix attribute doesn't disable that
        // On Animator the isSyncAnim is not defined so we know that this is the call we want to handle
        if (this.isSyncAnim !== undefined) return;

        
        const syncedAnimator = this.gameObject.getComponent(SyncedAnimator);
        if (!syncedAnimator || !syncedAnimator.enabled) return;

        // update
        syncedAnimator.syncedAnimatorUpdate();
        syncedAnimator.applyRemoteState();
        syncedAnimator.dispatchChanges();
    }

    private syncedAnimatorUpdate() {
        // check if the controller has changed
        if (this.currentController !== this.animator?.runtimeAnimatorController) {
            this.onControllerChanged();
        }
    }

    /**
     * Parameters and state can fight with each other. 
     * This applies state corrections after reading parameters and not after reciving data from the server. 
     */
    private applyRemoteState() {
        // apply remote state if needed
        // parameters are applied right on reciving and state is applied a frame later here
        if (this.remoteState && this.remoteState !== this.currentState) {
            this.animator.runtimeAnimatorController?.play(this.remoteState.hash);
            this.remoteState = null;
        }
    }

    /**
     * Any API calls that are issued to the Animator mark it as dirty. Sync is performed based on that.
     */
    private dispatchChanges() {
        if (!this.animator.parametersAreDirty && !this.animator.isDirty) return;

        // disacrd the state information if the user haven't changed the state. Otherwise the state machine has to choose between a parameter and a direct play call. 
        this.createAndSndModel(this.localParameters, this.animator.isDirty ? this.currentState : undefined);
    }

    private tempValues: number[] = []
    /**
     * Creates and send the data model over network
     * @param params list of parameters to be synced
     * @param state current state to be synced
     */
    private createAndSndModel(params: Parameter[], state: State | undefined) {
        const net = this.context.connection;
        if (!net.isInRoom) return;

        // convert values to numbers
        this.tempValues.length = params.length;
        for (let i = 0; i < params.length; i++) {
            const p = params[i];
            var value = 0;
            switch (p.type) {
                case AnimatorControllerParameterType.Trigger:
                case AnimatorControllerParameterType.Bool:
                    value = (p.value as boolean) ? 1 : 0;
                    break;
                case AnimatorControllerParameterType.Float:
                case AnimatorControllerParameterType.Int:
                    value = p.value as number;
                    break;
            }

            this.tempValues[i] = value;
        }

        const data = {
            guid: this.syncedAnimGuid,
            values: this.tempValues,
            state: state?.hash || 0
        } as SyncedAnimator_Model;

        // send
        if (debug) console.log(`${this.context.time.time.toFixed(2)} SyncAnimator outgoing message`);
        net.send(this.guid, data);
    }

    /** 
     * Called when a model is recieved from the server.
     * It drives the animator based on the provided model.
    */
    private modelRecieved(data: SyncedAnimator_Model) {
        if (!this.animator) return;
        if (debug) console.log(`${this.context.time.time.toFixed(2)} SyncAnimator incoming message`);

        for (let i = 0; i < data.values.length; i++) {
            const p = this.localParameters[i];
            const newValue = data.values[i];
            var newParsedValue: number | boolean | string | null = null;

            switch (p.type) {
                case AnimatorControllerParameterType.Trigger:
                case AnimatorControllerParameterType.Bool:
                    newParsedValue = newValue == 1;
                    break;
                case AnimatorControllerParameterType.Float:
                case AnimatorControllerParameterType.Int:
                    newParsedValue = newValue as number || 0;
                    break;
            }

            if (newParsedValue !== p.value) {
                if (debug) console.log(`Remote parameter: ${p.name} | ${p.value} --> ${newParsedValue}`);
                p.value = newParsedValue;
            }
        }

        const newStateHash = data.state;
        if (newStateHash !== 0) {
            const newState = this.animator.runtimeAnimatorController?.findState(newStateHash);
            this.remoteState = newState;
            if (debug) console.log(`${this.context.time.time.toFixed(2)} Remote state: ${this.currentState?.name} --> ${newState?.name}`);
        }
    }
}

class SyncedAnimator_Model 
{
    guid: string = "";
    values: number[] = [];
    state: number = 0;
}