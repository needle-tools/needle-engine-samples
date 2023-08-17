import { Animator, AnimatorControllerParameterType, Behaviour, Parameter, prefix, registerBinaryType, getParam, RoomEvents, State } from "@needle-tools/engine";
import { SyncedAnimator_Model } from "./SyncedAnimator_Model";
import { Builder } from "flatbuffers";

// TODO: during runtime, animator model / controller can't be changed
// TODO: correcting the state machine if it gets out of sync
// TODO: order of params has to be the same on all clients and can't chagne during runtime

const debug = getParam("debugsyncanimator");

export const SyncedAnimatorIdentifier = "SANI"; // :)
registerBinaryType(SyncedAnimatorIdentifier, SyncedAnimator_Model.getRootAsSyncedAnimator_Model);

export class SyncedAnimator extends Behaviour {
    // mandatory component on the object
    private animator!: Animator;

    // used for serialization and deserialization. Needed to use SyncedAnimator_Model API.
    private builder!: Builder;

    // guid under which SyncedAnimator_Model will be stored in the server.
    private syncedAnimGuid: string = "";

    // live parameters that Animator uses
    private localParameters: Parameter[] = [];

    // live state from the animator
    private currentState: State | undefined;

    // state dicated by remote
    private remoteState: State | null | undefined;

    // when drivenByAnimator is false and you use the SyncedAnimator API, this marks the state to be synced before animator update.
    /* private manualParameterChanges: boolean = false;
    private manualStateChanges: boolean = false; */

    awake() {
        // differentiate between guids in order to save both owner AND anim state
        this.syncedAnimGuid = `${this.guid}`;
    }

    start(): void {
        this.animator = this.gameObject.getComponent(Animator)!;
        this.localParameters = this.animator?.runtimeAnimatorController?.model?.parameters!;

        this.builder = new Builder(1);

        this.enabled = this.localParameters !== undefined;
        if (this.enabled) {
            if (this.context.connection.isConnected) {
                this.onStateRecieved();
            }
        }
        else
            console.warn("SyncAnimator has to be on an object with an Animator componenet");
    }

    // register to room events
    private onModelRecievedFn: Function | null = null;
    private onStateRecievedFn: Function | null = null;
    onEnable() {
        this.onModelRecievedFn = this.context.connection.beginListenBinary(SyncedAnimatorIdentifier, this.modelRecieved.bind(this));
        this.onStateRecievedFn = this.context.connection.beginListen(RoomEvents.RoomStateSent, this.onStateRecieved.bind(this));
    }

    onDestroy() {
        this.context.connection.stopListenBinary(SyncedAnimatorIdentifier, this.onModelRecievedFn);
        this.context.connection.stopListen(RoomEvents.RoomStateSent, this.onStateRecievedFn);
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

        syncedAnimator.checkForChanges();
        syncedAnimator.applyChanges();
        syncedAnimator.dispatchChanges();
    }

    /**
     * Reads state of animator and if it's dirty it sends an update.
     * drivenByAnimator has to be true.
     */
    private checkForChanges() {
        if (!this.enabled) return;
        if (!this.animator) return;

        const state = this.animator.runtimeAnimatorController?.activeState;
        if (this.currentState !== state) {
            if (debug) console.log(`Local state: ${this.currentState?.name} --> ${state?.name}`);
            this.currentState = this.animator.runtimeAnimatorController?.findState(state?.name!)!;
        }
    }

    /**
     * Parameters and state can fight with each other. 
     * This applies state corrections after reading parameters and not after reciving data from the server. 
     */
    private applyChanges() {
        if (this.remoteState && this.remoteState !== this.currentState) {
            this.animator.runtimeAnimatorController?.play(this.remoteState.hash);
            this.remoteState = null;
        }
    }

    /**
     * If any explicit SetParamaters / Play calls were issued through the SyncedAnimator and
     * drivenByAnimator is false, this will send the changes to the server.
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

        // create values
        this.builder.clear();
        var guid = this.builder.createString(this.syncedAnimGuid);
        var data = SyncedAnimator_Model.createValuesVector(this.builder, this.tempValues);

        // add values
        SyncedAnimator_Model.startSyncedAnimator_Model(this.builder);
        SyncedAnimator_Model.addGuid(this.builder, guid);
        SyncedAnimator_Model.addDontSave(this.builder, false);
        SyncedAnimator_Model.addValues(this.builder, data);
        SyncedAnimator_Model.addState(this.builder, state?.hash || 0);
        const endPos = SyncedAnimator_Model.endSyncedAnimator_Model(this.builder);
        this.builder.finish(endPos, SyncedAnimatorIdentifier);

        // send
        const payload = this.builder.asUint8Array();
        if (debug) console.log(`${this.context.time.time.toFixed(2)} SyncAnimator: --> ${payload.length} bytes`);
        net.sendBinary(payload);
    }

    /** 
     * Called when a model is recieved from the server.
     * It drives the animator based on the provided model.
    */
    private modelRecieved(data: SyncedAnimator_Model) {
        if (!this.animator) return;
        if (data.guid() !== this.syncedAnimGuid) return; //payload for another synced animator

        if (debug) console.log(`${this.context.time.time.toFixed(2)} SyncAnimator: <-- ${data.bb?.bytes().length} bytes`);

        for (let i = 0; i < data.valuesLength(); i++) {
            const p = this.localParameters[i];
            const newValue = data.values(i);
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

        const newStateHash = data.state();
        if (newStateHash !== 0) {
            const newState = this.animator.runtimeAnimatorController?.findState(newStateHash);
            this.remoteState = newState;
            if (debug) console.log(`${this.context.time.time.toFixed(2)} Remote state: ${this.currentState?.name} --> ${newState?.name}`);
        }
    }

    /**
     * Replicate state from the server.
     * This is crucial when you join a room full of player
     * and the replicated player are fetching their state to match the animation.
     */
    private onStateRecieved() {
        const model = this.context.connection.tryGetState(this.guid) as unknown as SyncedAnimator_Model;
        if (model) this.modelRecieved(model);
    }
}