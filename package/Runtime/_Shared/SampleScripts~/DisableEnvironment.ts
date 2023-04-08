import { Behaviour } from "@needle-tools/engine";

import { Texture } from "three";

export class DisableEnvironmentLight extends Behaviour {

    private _previousEnvironmentTexture: Texture | undefined = undefined;

    onEnable(): void {
        this._previousEnvironmentTexture = this.context.scene.environment;
        this.context.scene.environment = null;
    }

    onDisable(): void {
        this.context.scene.environment = this._previousEnvironmentTexture;
    }
}