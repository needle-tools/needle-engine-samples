import { Behaviour, GameObject, IPointerClickHandler, Mathf, PointerEventData, Rigidbody } from "@needle-tools/engine";


export class ClickToSplit extends Behaviour implements IPointerClickHandler {

    onPointerEnter() {
        this.context.input.setCursorPointer();
    }
    onPointerExit() {
        this.context.input.setCursorNormal();
    }

    onPointerClick(args: PointerEventData) {
        if (args.used) return;
        args.use();
        if (this.gameObject.scale.x > .8) {
            const cl1 = GameObject.instantiate(this.gameObject);
            const cl2 = GameObject.instantiate(this.gameObject);
            cl1?.scale.multiplyScalar(0.5);
            cl2?.scale.multiplyScalar(0.5);
            const rb1 = cl1?.getComponent(Rigidbody);
            const rb2 = cl2?.getComponent(Rigidbody);
            rb1?.setVelocity(this.random(), this.random(), this.random());
            rb2?.setVelocity(this.random(), this.random(), this.random());
        }
        this.gameObject.destroy();
    }

    private random(){
        const min = -.2;
        const max = .2;
        return Math.random() * (max - min) + min;
    }

}