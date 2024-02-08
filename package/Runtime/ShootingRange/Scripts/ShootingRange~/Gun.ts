import { Animator, AudioSource, Behaviour, EventList, GameObject, Gizmos, NeedleXREventArgs, NeedleXRSession, ParticleSystem, Watch, WebXR, getParam, getTempVector, isMobileDevice, serializable, setWorldPosition, setWorldQuaternion } from "@needle-tools/engine";

import { Object3D, Quaternion, Vector2, Vector3 } from "three";
import { Target } from "./Target";


const debug = getParam("debugfps");


// gathers input, performs raycast, controls effects and handles hitting a target
export class Gun extends Behaviour {

    @serializable()
    enableMobileInput: boolean = true;

    @serializable()
    enableDesktopInput: boolean = true;

    //@nonSerialized
    @serializable()
    vrSide: XRHandedness | "any" = "any";

    @serializable()
    fireRate: number = 0.1;

    @serializable(Object3D)
    raycastReference?: Object3D;

    @serializable(Animator)
    gunAnimator?: Animator;

    @serializable()
    fireAnimation: string = "Fire";

    @serializable(AudioSource)
    fireSound?: AudioSource;

    @serializable(ParticleSystem)
    muzzleFlash?: ParticleSystem;

    @serializable(ParticleSystem)
    ejectShell?: ParticleSystem;

    @serializable(ParticleSystem)
    impactEffect?: ParticleSystem;

    // --------------------

    // reporting events 
    static onHitTarget: EventList = new EventList();
    static onMiss: EventList = new EventList();

    onUpdateXR(args: NeedleXREventArgs): void {
        args.xr.controllers.forEach(c => {
            if (c.getButton("primary")?.isDown === true) {
                if (c.side == this.vrSide || this.vrSide === "any") {
                    this.fire();
                }
            }
        });
    }
    
   // subrscribe to input events
    onEnable() {
        const inputElem = this.context.domElement;
        if (this.enableDesktopInput) {
            inputElem.addEventListener('click', this.onMouseClick);
        }
        if (this.enableMobileInput) {
            inputElem.addEventListener('touchend', this.onTouchEnd);
        }
    }

    onDisable() {
        const inputElem = this.context.domElement;
        if (this.enableDesktopInput) {
            inputElem.removeEventListener('click', this.onMouseClick);
        }
        if (this.enableMobileInput) {
            inputElem.removeEventListener('touchend', this.onTouchEnd);
        }
    }

    private _lastTouchEndPoint = new Vector2();
    private onTouchEnd = (event: TouchEvent) => {
        const ended = event.changedTouches[0];
        const x = ended.clientX;
        const y = ended.clientY;
        const dx = x - this._lastTouchEndPoint.x;
        const dy = y - this._lastTouchEndPoint.y;
        this._lastTouchEndPoint.set(x, y);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 15) {
            this.fire();
        }
        if (event.touches.length <= 0) { // last finger 
            this.fire(true, true);
        }
    }

    private onMouseClick = (event: MouseEvent) => {
        if (!document.pointerLockElement && event.target !== this.context.renderer.domElement) return;
        if (isMobileDevice()) return; // ignore desktop input on mobile

        if (event.button !== 0) // if not the LMB or primary, abort
            return;
        this.fire();
    }

    private fireTimeStamp = -999; // big value that the user can shoot at time 0

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
        if(ignoreMiss && !hit) return; // abort miss
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
        if (!this.raycastReference)
            return null;

        const physics = this.context.physics;
        const shootRef = this.raycastReference;

        const hit = physics.engine?.raycast(shootRef.getWorldPosition(getTempVector()), shootRef.getWorldDirection(getTempVector()));
        if (debug) {
            const from = shootRef.getWorldPosition(getTempVector());
            const to = hit ? hit.point : from.add(shootRef.getWorldDirection(getTempVector()).multiplyScalar(10));
            Gizmos.DrawLine(from, to, 0xff0000, .25, false);
        }
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
                    Gun.onHitTarget?.invoke(this, target);
                    return hit.point;
                }
            }
            if(!ignoreMiss) {
                return hit.point;
            }
        }

        if (!ignoreMiss) { // miss            
            Gun.onMiss?.invoke(this);
        }

        return null;
    }
}