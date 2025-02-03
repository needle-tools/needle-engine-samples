import { Behaviour, Renderer } from '@needle-tools/engine';
import { BackSide } from 'three';

export class SetBackfaceCulling extends Behaviour {

    awake() {
        const renderer = this.gameObject.getComponent(Renderer);
        if (renderer?.sharedMaterials) {
            for (const mat of renderer.sharedMaterials) {
                if (mat) {
                    mat.side = BackSide;
                }
            }
        }
    }


}