 // START MARKER disable environment light
import { Behaviour } from "@needle-tools/engine";
import { Texture } from "three";

export class DisableEnvironmentLight extends Behaviour {

    private _previousEnvironmentTexture: Texture | null = null;

    onEnable(): void {
        this._previousEnvironmentTexture = this.context.scene.environment;
        this.context.scene.environment = null;
    }

    onDisable(): void {
        this.context.scene.environment = this._previousEnvironmentTexture;
    }
}
// END MARKER disable environment light