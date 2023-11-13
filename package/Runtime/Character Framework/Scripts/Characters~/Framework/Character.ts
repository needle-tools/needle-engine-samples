import { Behaviour, EventList, PlayerState } from "@needle-tools/engine";

import { CharacterModule, CharacterRole } from "./CharacterModule";
import { CharacterState } from "./CharacterState";

/** Base definition of an Character which has modules that define its capabilities. 
 *  These modules communciate via a state object that holds values */
export abstract class Character extends Behaviour {
    /** Modules that define the character's input, view and motor */
    private _modules!: Set<CharacterModule>;

    /** shared object that modules read from and write into to expose API
        frame state in oppose to state is delated on the beginning of every frame */
    private _frameState!: CharacterState;
    get frameState(): CharacterState { return this._frameState; }

    private _state!: CharacterState;
    get state(): CharacterState { return this._state; }

    private _isInitialized: boolean = false;
    get isInitialized() { return this._isInitialized; }

    //@nonSerialized
    onRoleChanged!: EventList;

    playerState?: PlayerState | null = null;
    get isLocalPlayer(): boolean { return this.playerState?.isLocalPlayer ?? true; }
    get isNetworking(): boolean { return this.context.connection.isInRoom; }

    /** Waits for owner, otherwise initializes right away */
    protected startInitialization(findModules: boolean = true) {
        if (this.isNetworking && this.playerState && !this.playerState.owner) {
            this.playerState.onFirstOwnerChangeEvent.addEventListener(() => {
                this.initialize(findModules);
            });
        }
        else {
            this.initialize(findModules);
        }
    }

    /** Initialize the character and modules. */
    protected initialize(findModules: boolean = true) {
        if (findModules) {
            this.addAllModules();
        }

        this._modules.forEach(module => {
            if (!module.isInitialized)
                module.initialize(this);
        });
        this._isInitialized = true;

        this.roleChanged(this.isLocalPlayer);

        //TEMP: REMOVE ME LATER
        console.log("Forcing unlocked framerate, remove me later!")
        this.context.targetFrameRate = undefined;

        //TEMP: REMOVE ME LATER
        console.log("Forcing whole character into ignore raycast layer")
        this.gameObject.layers.set(2);
        this.gameObject.traverse(x => x.layers.set(2));
    }

    protected roleChanged(isLocalPlayer: boolean) {
        this.onRoleChanged?.invoke(isLocalPlayer);
    }

    addAllModules() {
        this.gameObject.getComponentsInChildren(CharacterModule).forEach(x => this.addModule(x));
    }

    ensureModule<Base extends CharacterModule>(type: { new(): Base }): Base {
        let module = this.gameObject.getComponentInChildren(type);
        if (!module) {
            module = this.gameObject.addNewComponent(type)!;
            module.onDynamicallyConstructed();
        }
        return module;
    }

    addModule(module: CharacterModule) {
        this._modules.add(module);
    }

    removeModule(module: CharacterModule) {
        this._modules.delete(module);
    }

    // --- Object API ---

    awake() {
        this._modules = new Set();
        this._state = {};
        this._frameState = {};
        this.onRoleChanged = new EventList();
        this.playerState = this.gameObject.getComponent(PlayerState)!;
    }

    start() {
        this.startInitialization(true);
    }

    private allegableForUpdate(module: CharacterModule): boolean {
        return module.isInitialized && 0 != (module.AllowedRoles & (this.isLocalPlayer ? CharacterRole.local : CharacterRole.remote));
    }

    earlyUpdate(): void {
        // clear frame state
        this._frameState = {};

        this._modules.forEach(module => { if (this.allegableForUpdate(module)) { module.moduleEarlyUpdate(); } });
    }
    update(): void {
        this._modules.forEach(module => { if (this.allegableForUpdate(module)) { module.moduleUpdate(); } });
    }
    lateUpdate(): void {
        this._modules.forEach(module => { if (this.allegableForUpdate(module)) { module.moduleLateUpdate(); } });
    }
    onBeforeRender(): void {
        this._modules.forEach(module => { if (this.allegableForUpdate(module)) { module.moduleOnBeforeRender(); } });
    }
}