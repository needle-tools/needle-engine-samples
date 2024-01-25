import { AssetReference, Behaviour, Gizmos, NEPointerEvent, NeedleXRController, NeedleXREventArgs, NeedleXRSession, Rigidbody, delay, delayForFrames, serializable } from "@needle-tools/engine";
import { Vector3 } from "three";



export class ArrowShooting extends Behaviour {


    @serializable(AssetReference)
    arrowPrefab?: AssetReference;

    awake(): void {
        if (this.arrowPrefab?.asset) {
            this.arrowPrefab.asset.visible = false;
        }
    }

    onEnterXR(_args: NeedleXREventArgs): void {
        this.arrowPrefab?.loadAssetAsync();
        this.context.input.addEventListener("pointerup", this.onInput);
    }
    onLeaveXR(_args: NeedleXREventArgs): void {
        this.context.input.removeEventListener("pointerup", this.onInput);
    }

    protected onInput = (evt: NEPointerEvent) => {
        if (evt.origin instanceof NeedleXRController) {
            const ctrl = evt.origin;
            const other = NeedleXRSession.active?.controllers.find(c => c !== ctrl);
            if (ctrl && other) {
                const point = ctrl.rayWorldPosition;
                const dir = other.rayWorldPosition.clone().sub(point);
                this.shoot(point, dir);
                Gizmos.DrawArrow(point, dir.clone().add(point), 0xff0000, 1);
            }
        }
    }

    /**
     * shoot an arrow
     * @param from position to shoot from
     * @param vec direction to shoot (not normalized)
     */
    private async shoot(from: Vector3, vec: Vector3) {
        if (!this.arrowPrefab) return;
        const instance = await this.arrowPrefab.instantiate({ parent: this.context.scene });
        const force = Math.pow(vec.length() + .5, 2);
        const dir = vec.clone().normalize();
        if (instance) {
            instance.visible = true;
            instance.position.copy(from);
            instance.lookAt(dir.clone().add(from));
            const rb = instance.getOrAddComponent(Rigidbody);
            rb.isKinematic = false;
            rb.autoMass = false;
            rb.mass = .05;
            await delayForFrames(1);
            rb.applyImpulse(dir.multiplyScalar(force), true);
        }
    }
}