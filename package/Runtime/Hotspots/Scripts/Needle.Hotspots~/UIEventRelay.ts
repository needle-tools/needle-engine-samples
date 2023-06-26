import { 
    IPointerEventHandler, IPointerDownHandler,
    IPointerUpHandler, IPointerEnterHandler, 
    IPointerExitHandler, IPointerClickHandler 
} from "@needle-tools/engine";

import { Behaviour, serializable, Text } from "@needle-tools/engine";
import { Object3D } from "three";

export class UIEventRealy extends Behaviour implements IPointerEventHandler {

    @serializable(Object3D)
    targets: Object3D[] = [];

    start(){
        console.log("start");
        console.log(this);
    }

    onPointerEnter() {
        console.log("On Pointer Enter");
        this.targets.forEach(target => {
            if(target as IPointerEnterHandler) {
                target.onPointerEnter();
            }
        });
    }
    onPointerExit() {
        console.log("On Pointer Exit");

        this.targets.forEach(target => {
            if(target as IPointerExitHandler) {
                target.onPointerExit();
            }
        });
    }
    onPointerClick() {
        console.log("On Pointer Click");
        this.targets.forEach(target => {
            if(target as IPointerClickHandler) {
                target.onPointerClick();
            }
        });
    }
    onPointerUp() {
        console.log("On Pointer Up");
        this.targets.forEach(target => {
            if(target as IPointerUpHandler) {
                target.onPointerUp();
            }
        });
    }
    onPointerDown() {
        console.log("On Pointer Down");
        this.targets.forEach(target => {
            if(target as IPointerDownHandler) {
                target.onPointerDown();
            }
        });
    }
}