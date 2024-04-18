import { Animator, AudioSource, Behaviour, EventList, Gizmos, ParticleSystem,getParam, getTempVector, serializable, setWorldPosition } from "@needle-tools/engine";

import { Object3D, Vector3 } from "three";
import { Target } from "./Target";

const debug = getParam("debugfps");

export class Gun extends Behaviour {

    // ---- GunEffects ----

    @serializable(AudioSource)
    fireSound?: AudioSource;

    @serializable(ParticleSystem)
    muzzleFlash?: ParticleSystem;

    @serializable(ParticleSystem)
    ejectShell?: ParticleSystem;

    @serializable(ParticleSystem)
    impactEffect?: ParticleSystem;

    @serializable()
    impactOffset: number = 0.3;

    // ---- GunStats ----

    @serializable()
    fireRate: number = 0.1;

    // ---- GunReferences 

    @serializable(Object3D)
    raycastReference?: Object3D;

    // ---- GunAnimation ----

    @serializable(Animator)
    gunAnimator?: Animator;

    @serializable()
    fireAnimation: string = "Fire";

    // ---- reporting events ----

    @serializable(EventList)
    onHitTarget!: EventList;

    static onHitTarget: EventList = new EventList();

    @serializable(EventList)
    onMiss!: EventList;

    static onMiss: EventList = new EventList();

    protected fireTimeStamp = -999; // big value that the user can shoot at time 0

    fireWithMiss() {
        this.fire(true, false);
    }

    fireIgnoreMiss() {
        this.fire(true, true);
    }

    fire(applyFireRate: boolean = true, ignoreMiss: boolean = false) {
        const t = this.context.time.time;
        if (applyFireRate && t < this.fireTimeStamp + this.fireRate) // fire rate
            return;
        this.fireTimeStamp = t; // save the time of a successful fire
        const hit = this.firePhysically(ignoreMiss);
        if (ignoreMiss && !hit) return; // abort miss
        this.fireVisually(hit);
    }

    fireVisually(hitPoint: Vector3 | null) {
        // fire anim
        this.gunAnimator?.play(this.fireAnimation);
        // particles
        this.muzzleFlash?.play();
        this.ejectShell?.play();
        // audio
        this.fireSound?.stop();
        this.fireSound?.play();

        // Setup hit particle effect: 
        if (this.impactEffect && hitPoint) {
            setWorldPosition(this.impactEffect.gameObject, hitPoint);

            // play the effect
            this.impactEffect.stop();
            this.impactEffect.play();
        }
    }

    // perform raycast and reports hit/miss
    firePhysically(ignoreMiss: boolean = false): Vector3 | null {
        const physics = this.context.physics;

        const raycastRef = this.raycastReference;
        if (!raycastRef) return null;

        const origin = raycastRef.getWorldPosition(getTempVector());
        const direction = raycastRef.getWorldDirection(getTempVector());

        const hit = physics.engine?.raycast(origin, direction);
        if (hit) {
            if (debug) {
                Gizmos.DrawWireSphere(hit.point, 0.1, 0xff0000, .1);
            }
            // Test if the gun hit a target:
            const target = hit.collider.gameObject.getComponentInParent(Target);
            if (target) {
                if (!target.isShot) {
                    // only perform hit once
                    target.performHit();
                    this.onHitTarget?.invoke(this, target);
                    Gun.onHitTarget?.invoke(this, target);
                    return hit.point;
                }
            }
            if (!ignoreMiss) {
                return hit.point;
            }
        }

        if (!ignoreMiss) { // miss            
            this.onMiss?.invoke(this);
            Gun.onMiss?.invoke(this);
        }

        return null;
    }
}