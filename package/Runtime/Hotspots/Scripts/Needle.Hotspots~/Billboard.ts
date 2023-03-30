import { Behaviour } from "@needle-tools/engine";
import { Vector3 } from "three";

export class Billboard extends Behaviour {

    private dir = new Vector3();
    update() {
        const cam = this.context.mainCamera;
        if(cam)
        {
            cam.getWorldDirection(this.dir);
            this.dir.y = 0;
            this.dir.normalize();
            this.gameObject.transform.lookAt(this.dir.add(this.gameObject.transform.position));
        }
    }
}