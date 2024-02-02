import { Behaviour, Gizmos, Mathf, Rigidbody, delayForFrames, destroy, getTempVector, instantiate, isDestroyed, serializable } from "@needle-tools/engine";
import { Object3D, Vector3 } from "three";


export class BowTargetSpawner extends Behaviour {

    @serializable(Object3D)
    prefabs?: Object3D[];

    onEnable(): void {
        if (!this.prefabs?.length) {
            console.warn("BowTargetSpawner start: no prefab set");
            this.enabled = false;
            return;
        }
        this.prefabs.forEach(p => p.visible = false);
    }

    private readonly _instances = new Array<{ instance: Object3D, scale: number }>()

    update(): void {
        if (!this.prefabs?.length) return;

        const scaleVec = getTempVector();
        for (let i = this._instances.length - 1; i >= 0; i--) {
            const inst = this._instances[i];
            if (isDestroyed(inst.instance)) {
                this._instances.splice(i, 1);
            }
            else {
                scaleVec.setScalar(inst.scale);
                inst.instance.scale.lerp(scaleVec, this.context.time.deltaTime);
            }
        }

        if (this.context.time.frame % 20 === 0) {
            if (Math.random() > .5) {
                const wp = this.worldPosition;
                wp.x += Math.random() * 12 - 6;
                wp.y += Math.random() * 3;
                wp.z += Math.random() * 6;
                const rs = Math.random() * 3 + .5;
                const prefab = this.prefabs[Math.floor(Math.random() * this.prefabs.length)];
                const newInstance = instantiate(prefab, {
                    parent: this.scene,
                    position: wp.clone(),
                    scale: new Vector3(.01,.01,.01),
                    keepWorldPosition: true,
                });
                newInstance.visible = true;
                this._instances.push({ instance: newInstance, scale: rs });

                setTimeout(() => {
                    newInstance.destroy();
                }, 7000);

                delayForFrames(1).then(() => {
                    const rb = newInstance.getComponentInChildren(Rigidbody);
                    if (rb) {
                        rb.gravityScale = .2 + Math.random() * .3
                        rb.mass = 2;
                        rb.autoMass = false;
                    }
                    rb?.setAngularVelocity(Mathf.random(-2, 2), Mathf.random(-2, 2), Mathf.random(-2, 2));
                    rb?.applyImpulse({ x: 0, y: 5 + Math.random() * 12, z: 0 });
                });
            }
        }
    }


}