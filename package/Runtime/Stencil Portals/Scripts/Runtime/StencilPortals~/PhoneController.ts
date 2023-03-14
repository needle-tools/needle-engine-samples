import { IPointerClickHandler } from "@needle-tools/engine/src/engine-components/ui/PointerEvents";
import { Animator, Behaviour, serializable } from "@needle-tools/engine/src/needle-engine";

export class PhoneControoler extends Behaviour implements IPointerClickHandler{

    @serializable(Animator)
    animator?: Animator;

    onPointerClick() {
        this.shake();
    }

    shake() {
        if (this.animator) {
            this.animator.setTrigger("shake");
        }
    }
}