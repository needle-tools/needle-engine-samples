import { Behaviour, DepthOfField, GameObject, Mathf, OrbitControls, Volume, serializable } from "@needle-tools/engine";
import { getWorldPosition } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

export class DepthOfFieldController extends Behaviour {
    
    @serializable()
    apertureMultiplier: number = 2;

    @serializable()
    focalLength: number = 0.001;

    @serializable()
    focusDistanceCutoff: number = 25;

    private volume : Volume | null = null;
    private orbit?: OrbitControls;
    private dofEffect: DepthOfField | undefined = undefined;

    onEnable(): void {
        this.volume = GameObject.findObjectOfType(Volume);
        this.dofEffect = this.volume?.sharedProfile?.components?.find(c => c.typeName === "DepthOfField") as DepthOfField;
        this.orbit = GameObject.findObjectOfType(OrbitControls)!;
    }

    onBeforeRender() {
        const distance = this.orbit?.controls?.target.distanceTo(getWorldPosition(this.orbit.gameObject)) ?? 0;
        if (this.dofEffect) {
            this.dofEffect.focusDistance.value = distance;
            this.dofEffect.focalLength.value = this.focalLength;
            let invLerp = Mathf.inverseLerp(0, this.focusDistanceCutoff, distance);
            invLerp = Mathf.clamp01(invLerp);
            this.dofEffect.aperture.value = Mathf.lerp(this.apertureMultiplier, 32, invLerp);
            const threshold = this.focusDistanceCutoff;
            if (distance > threshold && this.dofEffect.active) {
                this.dofEffect.active = false;
                //this.volume?.scheduleRecreate();
            }
            else if (distance < threshold && !this.dofEffect.active) {
                this.dofEffect.active = true;
                //this.volume?.scheduleRecreate();
            }            
        }
    }
}