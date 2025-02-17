import { ActionBuilder, BehaviorModel, Behaviour, PlayAnimationOnClick, TriggerBuilder, serializable } from "@needle-tools/engine";
import { UsdzBehaviour } from "@needle-tools/engine";
import { USDObject } from "@needle-tools/engine";
import { AnimationExtension } from "@needle-tools/engine";
import { BehaviorExtension } from "@needle-tools/engine";
import { USDZExporterContext } from "@needle-tools/engine";
import { Animator } from "@needle-tools/engine";
import { Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

export class PlayAnimationOnProximity extends Behaviour implements UsdzBehaviour {

    @serializable(Animator)
    target: Animator;

    @serializable()
    getCloseClip: string = "";

    // @serializable()
    // getFarClip: string = "";

    @serializable()
    distance: number = 0.5;

    private lastDistance: number | undefined = undefined;
    update() {
        const cameraDistance = this.gameObject.worldPosition.distanceTo(this.context.mainCameraComponent!.worldPosition);
        if (this.lastDistance !== undefined) {
            // play once when we pass the threshold
            if (cameraDistance < this.distance && this.lastDistance >= this.distance) {
                this.target.play(this.getCloseClip);
            }
        }
        this.lastDistance = cameraDistance;
    }

    createBehaviours(ext: BehaviorExtension, model, _context: USDZExporterContext) {
        if (model.uuid === this.gameObject.uuid) {
            
            const targetObj = this.target ? this.target.gameObject : this.gameObject;

            const animationExt = _context.extensions.find(ext => ext instanceof AnimationExtension);
            if (!animationExt) {
                console.warn("No AnimationExtension found", _context.extensions);
                return;
            }

            let animationAction: any;

            const registered = PlayAnimationOnClick.getAndRegisterAnimationSequences(animationExt, targetObj, this.getCloseClip);
            if (!registered) {
                console.warn("No animation sequence found for " + this.getCloseClip, registered);
                return;
            }
            else {
                //@ts-ignore
                animationAction = PlayAnimationOnClick.getActionForSequences(targetObj, registered.animationSequence, registered.animationLoopAfterSequence, registered.randomTimeOffset);
            }

            ext.addBehavior(new BehaviorModel("PlayAnimationOnProximity_" + this.gameObject.name,
                TriggerBuilder.proximityToCameraTrigger(this.gameObject, this.distance),
                animationAction,
            ));

            /*
            if (this.getFarClip) {
                // add an empty object that is parented to the target object
                // and offset towards the camera
                const centered = USDObject.createEmpty();
                centered.name = "centered";
                const offset = USDObject.createEmpty();
                offset.name = "offset";
                offset.transform = { position: new Vector3(0, 0, -this.distance), quaternion: null, scale: null };
                centered.add(offset);
                model.add(centered);

                const registered = PlayAnimationOnClick.getAndRegisterAnimationSequences(animationExt, targetObj, this.getCloseClip);



                ext.addBehavior(new BehaviorModel("PlayAnimationOnProximity_" + this.gameObject.name + "_far", 
                    TriggerBuilder.proximityToCameraTrigger(offset, this.distance),
                    
                )
            }
            */

            return;
        }
    }
}