import { Behaviour, Camera } from "@needle-tools/engine";
import { PerspectiveCamera } from "three";

// Documentation → https://docs.needle.tools/scripting

export class CameraLayer extends Behaviour {
    
    private cam: Camera | null = null;

    onEnable() {
        // getting the Camera component from the same GameObject
        this.cam = this.gameObject.getComponent(Camera);
        if (!this.cam) {
            console.warn("CameraLayer requires a Camera component");
            this.enabled = false;
        }
    }

    onAfterRender(): void {
        if (!this.cam) return;
        // we remember the current background as we want to turn it off for the layer
        const currentBackground = this.scene.background;
        // we don't want automatic color clear anymore here
        this.context.renderer.autoClearColor = false;
        // if this is a Perspective Cam, update the aspect
        if (this.cam.cam instanceof PerspectiveCamera) {
            this.context.updateAspect(this.cam.cam);
        }
        // clear background, render, and restore the background
        this.scene.background = null;
        this.context.renderer.render(this.scene, this.cam.cam);
        this.scene.background = currentBackground;
    }
}