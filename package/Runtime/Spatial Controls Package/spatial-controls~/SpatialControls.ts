import { Behaviour, serializable } from "@needle-tools/engine";
import { Action, ControlMode, KeyCode, PointerButton, SpatialControls as SpatialControlsLib } from "spatial-controls";
import { Vector3 } from "three";

// Using https://www.npmjs.com/package/spatial-controls

export class SpatialControls extends Behaviour {

    @serializable()
    rotationSensitivity: number = 2;
    @serializable()
    rotationDamping: number = .01;
    @serializable()
    translationSensitivity: number = .25;
    @serializable()
    translationDamping: number = .1;
    @serializable()
    minZoom: number = 0.1;
    @serializable()
    maxZoom: number = 10;
    @serializable()
    zoomDamping: number = .1;

    private controls?: SpatialControlsLib;

    onEnable(): void {
        if (this.context.mainCamera) {
            if (!this.controls) {
                const { position, quaternion } = this.context.mainCamera;
                const domElement = this.context.domElement;
                domElement.contentEditable = "true";
                this.controls = new SpatialControlsLib(position, quaternion, domElement);

                // Initialize forward vector
                this.controls.target.copy(this.forward);
                this.controls.update(this.context.time.time);
                // Otherwise you can set a look at point too:
                // this.controls.lookAt(0,0,0);

                // console.log("SUB")
                // this.context.domElement.addEventListener("keydown", (e) => {
                //     console.log("KEY", e.code);
                // });
        
            }

            // console.log(this);
            const settings = this.controls.settings;
            console.log(settings)
            // settings.general.mode = ControlMode.THIRD_PERSON;
            // settings.rotation.sensitivity = 2.2;
            // settings.rotation.damping = 0.05;
            // settings.translation.sensitivity = 0.25;
            // settings.translation.damping = 0.1;
            // settings.zoom.setRange(0.25, 3.0);
            // settings.zoom.damping = 0.1;
            settings.general.mode = ControlMode.FIRST_PERSON;
            settings.rotation.sensitivityX = this.rotationSensitivity;
            settings.rotation.sensitivityY = this.rotationSensitivity;

            // settings.translation.damping = -1
            settings.keyBindings.actions.set(KeyCode.KEY_W, Action.MOVE_FORWARD);

            // const keyBindings = settings.keyBindings;
            // keyBindings.delete(KeyCode.KEY_X);
            // keyBindings.set(KeyCode.KEY_V, Action.MOVE_DOWN);
            // const pointerBindings = settings.pointerBindings;
            // pointerBindings.delete(PointerButton.MAIN);
            // pointerBindings.set(PointerButton.SECONDARY, Action.ROTATE);
            // settings.rotation.damping = this.rotationDamping;
            // settings.translation.sensitivity = this.translationSensitivity;
            // settings.translation.damping = this.translationDamping;
            // settings.zoom.setRange(this.minZoom, this.maxZoom);
            // settings.zoom.damping = this.zoomDamping;
        }
    }

    onBeforeRender(): void {
        if (this.controls) {
            this.controls.update(this.context.time.time);
        }
    }
}