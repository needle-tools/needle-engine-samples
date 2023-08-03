import { Animator, AnimatorControllerParameterType, Parameter, Behaviour, IPointerClickHandler, Mathf, serializable, Text, GameObject } from "@needle-tools/engine";
import { SyncedAnimator } from "../SyncedAnimator";

export class SyncedAnimatorControls_RandomValue extends Behaviour implements IPointerClickHandler {

    @serializable(Animator)
    animator?: Animator;

    @serializable(SyncedAnimator)
    syncAnimator?: SyncedAnimator;

    @serializable()
    animParam: string = "";

    @serializable(Text)
    valueLabel?: Text;

    parameter!: Parameter;

    awake(): void {
        const params = this.animator?.runtimeAnimatorController?.model?.parameters;
        if(!params) return;
        this.parameter = params.find(p => p.name === this.animParam)!;
    }

    onPointerClick(_) {
        if(!this.syncAnimator) return;
        if(!this.parameter) return;

        const type = this.parameter.type;
        if(type == AnimatorControllerParameterType.Float) {
            this.animator?.setFloat(this.animParam, Mathf.random() * 1.5);
        }
        if(type == AnimatorControllerParameterType.Int) {
            this.animator?.setInteger(this.animParam, Math.round(Mathf.random() * 1.5));
        }
        if(type == AnimatorControllerParameterType.Bool || type == AnimatorControllerParameterType.Trigger) {
            this.animator?.setBool(this.animParam, !this.parameter.value);
        }
    }

    update() {
        if(!this.parameter) return;
        if(!this.valueLabel) return;

        var text = "";
        if(this.parameter.type == AnimatorControllerParameterType.Float || this.parameter.type == AnimatorControllerParameterType.Int) {
            text = (this.parameter.value as number).toFixed(3);
        }
        else {
            text = `${(this.parameter.value as boolean)}`;
        }

        this.valueLabel.text = text;
    }
}

export class SyncedAnimatorControls_PlayAnim extends Behaviour implements IPointerClickHandler {

    @serializable(Animator)
    animator?: Animator;

    @serializable(SyncedAnimator)
    syncAnimator?: SyncedAnimator;

    @serializable()
    animName: string = "";

    onPointerClick(_) {
        if(!this.animator) return;
        if(!this.syncAnimator) return;

        this.animator.play(this.animName);
    }
}