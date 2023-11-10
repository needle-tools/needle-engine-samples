import { Behaviour } from "@needle-tools/engine";

import { Character } from "./Character";

export enum CharacterModuleType {
    none = "none",

    physics = "physics",
    input = "input",
    camera = "camera",

    generic = "generic",
}

export enum CharacterRole {
    local = 1 << 0,
    remote = 1 << 1,
    all = local | remote,
}

/** Modules solve singular areas of character logic */
export abstract class CharacterModule extends Behaviour {
    abstract get Type(): CharacterModuleType;
    get AllowedRoles() { return CharacterRole.local; }

    protected character!: Character;
    protected get frameState() { return this.character.frameState; }
    protected get state() { return this.character.state; }

    protected _isInitialized: boolean = false;
    get isInitialized() { return this._isInitialized; }
    initialize(character: Character) {
        this.character = character;
        this._isInitialized = true;
    }

    /** When this module was created on the fly and requires extra setup steps*/
    onDynamicallyConstructed() { }

    /** update events */
    moduleEarlyUpdate() { }
    moduleUpdate() { }
    moduleLateUpdate() { }
    moduleOnBeforeRender() { }
}
