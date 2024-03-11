import { 
    IPointerEventHandler, IPointerDownHandler,
    IPointerUpHandler, IPointerEnterHandler, 
    IPointerExitHandler, IPointerClickHandler, GameObject 
} from "@needle-tools/engine";

import { Behaviour, serializable } from "@needle-tools/engine";

export class UIEventRealy extends Behaviour implements IPointerEventHandler {

    @serializable(GameObject)
    targets: GameObject[] = [];

    start(){
        console.log("start");
        console.log(this);
    }

    onPointerEnter(args) {
        console.log("On Pointer Enter");
        this.targets.forEach(target => {
            const eventTarget = target as IPointerEnterHandler;
            if (eventTarget && eventTarget.onPointerEnter) {
                eventTarget.onPointerEnter(args);
            }
        });
    }
    onPointerExit(args) {
        console.log("On Pointer Exit");

        this.targets.forEach(target => {
            const eventTarget = target as IPointerExitHandler;
            if (eventTarget && eventTarget.onPointerExit) {
                eventTarget.onPointerExit(args);
            }
        });
    }
    onPointerClick(args) {
        console.log("On Pointer Click");
        this.targets.forEach(target => {
            const eventTarget = target as IPointerClickHandler;
            if (eventTarget && eventTarget.onPointerClick) {
                eventTarget.onPointerClick(args);
            }
        });
    }
    onPointerUp(args) {
        console.log("On Pointer Up");
        this.targets.forEach(target => {
            const eventTarget = target as IPointerUpHandler;
            if (eventTarget && eventTarget.onPointerUp) {
                eventTarget.onPointerUp(args);
            }
        });
    }
    onPointerDown(args) {
        console.log("On Pointer Down");
        this.targets.forEach(target => {
            const eventTarget = target as IPointerDownHandler;
            if (eventTarget && eventTarget.onPointerDown) {
                eventTarget.onPointerDown(args);
            }
        });
    }
}