import { Behaviour, Gizmos, Rigidbody, delayForFrames, destroy, instantiate, isDestroyed, serializable } from "@needle-tools/engine";
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

    update(): void {
        if (!this.prefabs?.length) return;
        if (this.context.time.frame % 20 === 0) {
            if (Math.random() > .5) {
                const wp = this.worldPosition;
                wp.x += Math.random() * 12 - 6;
                wp.y += Math.random() * 3;
                wp.z += Math.random() * 6;
                const rs = Math.random() * 2 + .5;
                const prefab = this.prefabs[Math.floor(Math.random() * this.prefabs.length)];
                const newInstance = instantiate(prefab, {
                    parent: this.scene,
                    position: wp.clone(),
                    scale: new Vector3(rs, rs, rs),
                    keepWorldPosition: true,
                });
                newInstance.visible = true;

                setTimeout(() => {
                    newInstance.destroy();
                }, 3000);

                delayForFrames(1).then(() => {
                    const rb = newInstance.getComponentInChildren(Rigidbody);
                    rb?.setAngularVelocity(Math.random(), Math.random(), Math.random());
                    rb?.applyImpulse({ x: 0, y: rb.gameObject.scale.x * 5 + Math.random() * 5, z: 0 });
                    if (rb) {
                        rb.gravityScale = .07;
                    }
                });
            }
        }
    }


}