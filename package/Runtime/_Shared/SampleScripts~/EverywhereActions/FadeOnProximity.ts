import { ActionBuilder, BehaviorModel, Behaviour, GameObject, TriggerBuilder, getWorldScale, serializable } from "@needle-tools/engine";
import { UsdzBehaviour } from "@needle-tools/engine";
import { USDObject } from "@needle-tools/engine";
import { Matrix4, MeshStandardMaterial, Object3D, Vector3 } from "three";
import { DeviceUtilities } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

export class FadeOnProximity extends Behaviour implements UsdzBehaviour {

    @serializable(GameObject)
    target: GameObject;

    @serializable()
    distance: number = 0.5;

    @serializable()
    fadeDuration: number = 1;
    
    @serializable()
    targetState: boolean = true;

    @serializable()
    hideOnStart: boolean = true;
    

    start() {
        if (this.hideOnStart && !DeviceUtilities.isiOS()) this.target.scale.set(0, 0, 0);
    }

    private tempVector: Vector3 = new Vector3();
    update() {
        this.tempVector.copy(this.context.mainCameraComponent!.worldPosition);
        const distance = this.tempVector.sub(this.worldPosition).length();
        if (distance < this.distance) {
            /*
            let anim = this.target.getComponent(TRSAnimatable);
            if (this.targetState) {
                if (anim) anim.playAt(1);
                else this.target.scale.set(1, 1, 1);
            }
            else {
                if (anim) anim.playAt(0);
                else this.target.scale.set(0, 0, 0);
            }
            */
            this.enabled = false;
        }
    }

    createBehaviours(ext, model, _context) {
        if (model.uuid === this.gameObject.uuid) {
            
            const targetObj = this.target ? this.target : this.gameObject;

            
            if (this.hideOnStart) {
                ext.addBehavior(new BehaviorModel("SetActiveOnProximity_active_" + this.gameObject.name,
                    TriggerBuilder.sceneStartTrigger(),
                    ActionBuilder.fadeAction(targetObj, 0, !this.targetState)
                ));
            }

  /*           const fadeAction = ActionBuilder.fadeAction(targetObj, this.fadeDuration, this.targetState);
            fadeAction.multiplePerformOperation = "ignore"; */

            ext.addBehavior(new BehaviorModel("SetActiveOnProximity_" + this.gameObject.name,
                TriggerBuilder.proximityToCameraTrigger(this.gameObject, this.distance),
                ActionBuilder.fadeAction(targetObj, this.fadeDuration, this.targetState)
            ));

            /* Not yet working. Also, has a pretty big performance impact it seems (?)

            // Construct ring of spheres around object, and pass them also into a new proximity trigger (can have multiple affectedObjects)
            // 6 spheres for a ring (one plane) with 2x the radius
            // 3 above, 3 below
            // == 12 spheres in total.
            const wrap = USDObject.createEmptyParent(model);
            const triggerRoot = USDObject.createEmpty();
            
            // TODO scale with inverse of parent scale

            const targets: USDObject[] = [];
            const scale = getWorldScale(this.gameObject);
            // sampling of points on a sphere
            // for loop to add points with distance this.distance + this.distance * 2 at random positions
            for (let i = 0; i < 13; i++) {
                const randomPoint = USDObject.createEmpty();
                randomPoint.geometry = model.geometry;
                randomPoint.material = new MeshStandardMaterial({color: 0xff0000});
                randomPoint.material.transparent = true;
                randomPoint.material.opacity = 0.2;
                const v = new Vector3();
                v.setFromSphericalCoords(i == 0 ? 0 : this.distance * 3, Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI);
                randomPoint.matrix.makeTranslation(v.x, v.y, v.z);
                const s = this.distance * 2 * (i > 0 ? 2 : 1) / scale.x;
                randomPoint.matrix.multiply(new Matrix4().makeScale(s, s ,s));
                triggerRoot.add(randomPoint);
                
                if (i > 0)
                    targets.push(randomPoint);
            }

            // fade back out
            ext.addBehavior(new BehaviorModel("SetActiveOnProximity_2_" + this.gameObject.name,
                TriggerBuilder.proximityToCameraTrigger(targets, this.distance * 2),
                ActionBuilder.fadeAction(targetObj, this.fadeDuration, !this.targetState)
            ));

            wrap.add(triggerRoot);

            */
        }
    }
}