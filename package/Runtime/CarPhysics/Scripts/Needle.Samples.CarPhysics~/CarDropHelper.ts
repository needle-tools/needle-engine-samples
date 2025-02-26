import { Behaviour, DropListener, serializable, DropListenerOnDropArguments, findObjectOfType, getBoundingBox, AxesHelper } from "@needle-tools/engine";
import { CarPhysics } from "./CarPhysics";
import { CarWheel } from "./CarWheel";
import { CarSelection } from "./CarSelection";
import { CarController } from "./CarController";
import { Object3D } from "three";



export class CarDropHelper extends Behaviour {

    @serializable(DropListener)
    dropListener: DropListener | null = null;

    onEnable(): void {
        this.dropListener?.onDropped.addEventListener(this.onDropped);
    }
    onDisable(): void {
        this.dropListener?.onDropped.removeEventListener(this.onDropped);
    }

    private onDropped = (evt: DropListenerOnDropArguments) => {

        let object = evt.object;

        // try to find the correct rotation
        // if the object X is longer than Z, rotate it to face forward
        // it's potentially now rotated by 180 degrees but not sure how we can automatically determine that without wheels
        const bounds = getBoundingBox(evt.object as Object3D);
        const lengthX = bounds.max.x - bounds.min.x;
        const lengthZ = bounds.max.z - bounds.min.z;
        if(lengthX > lengthZ) {
            const parent = evt.object.parent;
            const obj = new Object3D();
            obj.matrix.copy(evt.object.matrix);
            obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);
            obj.add(evt.object);
            evt.object.matrix.identity();
            evt.object.matrix.decompose(evt.object.position, evt.object.quaternion, evt.object.scale);
            evt.object.rotateY(Math.PI / 2);
            parent?.add(obj);
            object = obj;
        }

        object.position.y += 1;
        object.addComponent(CarPhysics);

        const ctrl = object.addComponent(CarController);
        const sel = findObjectOfType(CarSelection);
        sel?.selectCar(ctrl);
    }

}
