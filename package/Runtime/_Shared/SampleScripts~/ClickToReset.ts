import { ActionBuilder, BehaviorExtension, BehaviorModel, Behaviour, GameObject, PointerEventData, TriggerBuilder, USDObject, USDWriter, USDZExporterContext, UsdzBehaviour, serializable } from "@needle-tools/engine";
import { Matrix4, Object3D } from "three";

// Documentation → https://docs.needle.tools/scripting

export class ClickToReset extends Behaviour implements UsdzBehaviour {
    
    /** All children in "target" will be reset to their start position on click. */
    @serializable(GameObject)
    target?: GameObject;

    private objectToMatrix = new Map<Object3D, Matrix4>();

    start() {
        this.target?.traverse((child) => {
            this.objectToMatrix.set(child, child.matrix.clone());
        });
    }

    onPointerClick(_args: PointerEventData) {
        for (const [object, matrix] of this.objectToMatrix) {
            object.matrix.copy(matrix);
            object.matrix.decompose(object.position, object.quaternion, object.scale);
            object.matrixWorldNeedsUpdate = true;
        }
    }

    createBehaviours(ext: BehaviorExtension, model: USDObject, context: USDZExporterContext) {
        if (model.uuid !== this.gameObject.uuid) return;
        if (!this.target) return;

        const group = ActionBuilder.parallel();
        for (const [object, matrix] of this.objectToMatrix) {
            const empty = USDObject.createEmpty();
            empty.matrix = matrix;
            if (object.parent) empty.matrix.premultiply(object.parent.matrixWorld);
            context.document.add(empty);
            group.addAction(ActionBuilder.transformAction(object, empty, 0, "absolute", "none"));
        }

        const behavior = new BehaviorModel("click_to_reset", 
            TriggerBuilder.tapTrigger(this.gameObject),
            group,
        );
        ext.addBehavior(behavior);

        const empty = USDObject.createEmpty();
        empty.name = "InputTarget";
        empty.displayName = undefined;
        empty.type = "RealityKitComponent";
        empty.onSerialize = (writer: USDWriter) => {
            writer.appendLine("bool allowsDirectInput = 1");
            writer.appendLine("bool allowsIndirectInput = 1");
            writer.appendLine('uniform token info:id = "RealityKit.InputTarget"');
        };
        model.add(empty);

        const empty2 = USDObject.createEmpty();
        empty2.name = "HoverEffect";
        empty2.displayName = undefined;
        empty2.type = "RealityKitComponent";
        empty2.onSerialize = (writer: USDWriter) => {
            writer.appendLine('uniform token info:id = "RealityKit.HoverEffect"');
        };
        model.add(empty2);

        /*
        def RealityKitComponent "InputTarget"
        {
            bool allowsDirectInput = 1
            bool allowsIndirectInput = 1
            uniform token info:id = "RealityKit.InputTarget"
        }
        */
    }
}