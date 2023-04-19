import { Animator, AudioSource, Behaviour, GameObject, Mathf, Renderer, WaitForFrames, serializable } from "@needle-tools/engine";
import { WaitForSeconds } from "@needle-tools/engine";
import { Color, Material, MathUtils } from "three";

// Target: contains effects and hide/show logic
// Gun is searching for Target when it hits an object
export class Target extends Behaviour {

    @serializable(Animator)
    animator?: Animator;

    @serializable()
    animBoolName: string = "IsShot";

    @serializable()
    resetTimeout: number = 7;

    @serializable()
    effectDuration: number = 0.5;

    @serializable(Renderer)
    visuals?: Renderer[];

    @serializable(AudioSource)
    hitAudio?: AudioSource;

    private deadEyesRenderer: Renderer | undefined;
    private effectMaterial?: Material;
    private effectColor: Color = new Color(0, 0, 0);

    awake(): void {
        this.setShot(true);
        this.startCoroutine(this.targetRoutine());
        this.chooseRandomVisual();
    }

    isShot: boolean = false;

    performHit() {
        this.setShot(true);
        this.startCoroutine(this.hitEffect());
    }

    *hitEffect() {

        if (!this.effectMaterial)
            return;

        this.hitAudio?.play();

        const time = this.context.time;
        const start = time.time;

        const origCol = this.effectMaterial["color"];

        let t = 0;
        while (t < 1) {
            yield WaitForFrames(1);

            const s = Math.abs(t - .5);
            this.effectColor.setHSL(t, s, (s + .2));

            this.effectMaterial["color"] = this.effectColor;

            t = (time.time - start) / this.effectDuration;
        }

        this.effectMaterial["color"] = origCol;
    }

    /** make the target pop up. Auto hide pop down again after a while if it wasnt hit */
    private *targetRoutine() {
        while (this.enabled) {
            const timeoutDelay = Mathf.lerp(this.resetTimeout * .5, this.resetTimeout, Math.random());
            yield WaitForSeconds(timeoutDelay);
            if (Math.random() > .5) // give the target a chance to not pop up
                this.setShot(false);
            yield WaitForSeconds(timeoutDelay);
            this.animator?.setBool(this.animBoolName, true);
        }
    }

    setShot(newState: boolean) {
        this.isShot = newState;
        this.animator?.setBool(this.animBoolName, this.isShot);

        if (this.deadEyesRenderer) this.deadEyesRenderer.enabled = newState;
        setTimeout(() => {
            if (this.deadEyesRenderer)
                this.deadEyesRenderer.enabled = false;
        }, 3000);
    }

    private chooseRandomVisual() {
        if (!this.visuals) return;
        for (const v of this.visuals) v.gameObject.visible = false;

        const i = MathUtils.randInt(0, this.visuals.length - 1);
        const v = this.visuals[i];
        v.gameObject.visible = true;

        // clone the material to apply a color effect per target
        this.effectMaterial = v.sharedMaterial = v.sharedMaterial.clone();

        // assuming the first child is the dead eyes
        if (v.gameObject.children.length > 0)
            this.deadEyesRenderer = GameObject.getComponent(v.gameObject.children[0], Renderer)!;

        if (this.deadEyesRenderer) this.deadEyesRenderer.enabled = false;
    }
}
