// START MARKER Auto Reset
import { ActionBuilder, BehaviorExtension, BehaviorModel, Behaviour, Collider, GameObject, Rigidbody, TriggerBuilder, USDObject, USDZExporter, UsdzBehaviour, serializeable } from "@needle-tools/engine";
import type { USDZExporterContext } from "@needle-tools/engine";
import { Matrix4, Vector3 } from "three";

export class StartPosition extends Behaviour {

    //@nonSerialized
    startPosition?: Vector3;
    //@nonSerialized
    startMatrix?: Matrix4;

    start() {
        this.updateStartPosition();
        const usdzExporter = GameObject.findObjectOfType(USDZExporter);
        if (usdzExporter) {
            usdzExporter.addEventListener("before-export", () => {
                this.resetToStart();
            });
        }
    }

    updateStartPosition(){
        this.gameObject.updateMatrix();
        this.startPosition = this.gameObject.position.clone();
        this.startMatrix = this.gameObject.matrix.clone();
    }

    resetToStart() {
        if (!this.startPosition) return;
        const rb = GameObject.getComponent(this.gameObject, Rigidbody);
        rb?.teleport(this.startPosition);
    }
}

/** Reset to start position when object is exiting the collider */
export class AutoReset extends StartPosition implements UsdzBehaviour {

    @serializeable(Collider)
    worldCollider?: Collider;

    start(){
        super.start();
        if(!this.worldCollider) console.warn("Missing collider to reset", this);
    }
    
    onTriggerExit(col) {
        if(col === this.worldCollider){
            this.resetToStart();
        }
    }
    createBehaviours(ext: BehaviorExtension, model, context: USDZExporterContext) {
        if (model.uuid !== this.gameObject.uuid) return;
        if (!this.startPosition || !this.startMatrix) return;

        // construct an empty prim that we can use to reposition the model
        // its world position needs to match the intended world position of the model
        const empty = USDObject.createEmpty();
        if (this.gameObject.parent)
            // convert startMatrix to worldspace with the parent matrix
            empty.matrix = this.gameObject.parent.matrixWorld.clone().multiply(this.startMatrix);
        else
            // startMatrix is already in world space
            empty.matrix = this.startMatrix;
            
        context.document.add(empty);

        const resetAfterTime = new BehaviorModel("_reset_" + this.name + "_afterTime",
                    TriggerBuilder.sceneStartTrigger(),
                    ActionBuilder.sequence(
                        ActionBuilder.waitAction(Math.random() * 4 + 1),
                        ActionBuilder.sequence(
                            ActionBuilder.transformAction(this.gameObject, empty, 0, "absolute", "none"),
                            ActionBuilder.waitAction(5),
                        ).makeLooping(),
                    )
                ).makeExclusive(true);

        ext.addBehavior(resetAfterTime);
    }
}
// END MARKER Auto Reset
