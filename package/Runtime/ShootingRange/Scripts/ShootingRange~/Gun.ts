import { Animator, AudioSource, Behaviour, EventList, GameObject, Gizmos, ParticleSystem, Watch, WebXR, getParam, isMobileDevice, serializable, setWorldPosition, setWorldQuaternion } from "@needle-tools/engine";

import { Object3D, Quaternion, Vector2, Vector3 } from "three";
import { Target } from "./Target";


const debug = getParam("debugfps");

class GunEffects {

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
}

class GunStats {

    @serializable()
    fireRate: number = 0.1;
}

class GunReferences {

    // refrences - physics
    @serializable(Object3D)
    raycastReference?: Object3D;

    @serializable()
    scaleInVR: number = 0.1;
}

class GunAnimation {

    @serializable(Animator)
    gunAnimator?: Animator;

    @serializable()
    fireAnimation: string = "Fire";
}


export enum GunInputEnum {
    Left = 0,
    Solo = 0,
    Right = 2,
}

// gathers input, performs raycast, controls effects and handles hitting a target
export class Gun extends Behaviour {

    @serializable(GunEffects)
    effects!: GunEffects;

    @serializable(GunStats)
    stats!: GunStats;

    @serializable(GunReferences)
    references!: GunReferences;

    @serializable(GunAnimation)
    animation!: GunAnimation;

    @serializable()
    vrHideControllers: boolean = true;

    @serializable()
    vrHideHands: boolean = true;

    @serializable()
    enableOnlyRightWeaponOnMobile: boolean = true;

    @serializable()
    enableMobileInput: boolean = true;

    @serializable()
    enableDesktopInput: boolean = true;

    // input
    @serializable()
    gunInput: GunInputEnum = 0;

    // reporting events 
    @serializable(EventList)
    onHitTarget!: EventList;

    @serializable(EventList)
    onMiss!: EventList;

    private lastPosition = new Vector3(0, 0, 0);
    private currentPosition = new Vector3(0, 0, 0);

    private characterGunPosition = new Vector3(0, 0, 0);
    private characterGunRotation = new Quaternion(0, 0, 0, 1);

    // raycast
    private raycastWorldDirection = new Vector3();
    private raycastWorldOrigin = new Vector3();
    private isVR: boolean = false;

    private parentOnStart?: Object3D;
    private webXR?: WebXR;

    awake() {
        this.gameObject.getWorldPosition(this.lastPosition);
        this.gameObject.getWorldPosition(this.currentPosition);

        this.characterGunPosition.copy(this.gameObject.position);
        this.characterGunRotation.copy(this.gameObject.quaternion);

        this.parentOnStart = this.gameObject.parent!;

        this.webXR = GameObject.findObjectOfType(WebXR)!;
    }

    update(): void {
        if (this.webXR && this.isVR !== this.webXR.IsInVR) {
            this.isVR = this.webXR.IsInVR;
            this.onVRChanged(this.isVR);
        }
    }
    onBeforeRender(): void {

        if (this.references.raycastReference) {

            this.references.raycastReference.getWorldPosition(this.raycastWorldOrigin);
            this.references.raycastReference.getWorldDirection(this.raycastWorldDirection);
        }

        let wPos = new Vector3();
        this.gameObject.getWorldPosition(wPos);

        if (this.webXR) {

            const isLeftHand = this.gunInput == GunInputEnum.Left;
            const controller = isLeftHand ? this.webXR.LeftController : this.webXR.RightController;

            if (this.isVR && controller != null) {

                controller.controller.getWorldPosition(this.gameObject.position);
                this.gameObject.quaternion.copy(controller.rayRotation);
                
                this.gameObject.rotateY(Math.PI); // ugly, but FWD is inverted
                
                if(controller.hand.visible) {
                    this.gameObject.rotateZ(Math.PI); 
                }

                if (controller.isUsingHands) {
                    const negate = isLeftHand ? 1 : -1;
                    this.gameObject.rotateZ(Math.PI * 0.5 * negate);
                }

                if (controller.selectionDown) {
                    this.fire();
                }
            }
        }
    }

    onVRChanged(isVR: boolean) {

        if (!this.webXR)
            return;

        this.gameObject.parent?.remove(this.gameObject);
        if (isVR) //enter VR
        {
            this.webXR.Controllers.forEach(c => {

                c.showRaycastLine = false;

                if (this.vrHideControllers)
                    c.controllerModel.visible = false;

                if (this.vrHideHands)
                    c.handPointerModel.visible = false;
            });

            this.context.scene.add(this.gameObject);
            const s = this.references.scaleInVR;
            this.gameObject.scale.set(s, s, s);
        }
        else //exit VR
        {
            this.parentOnStart?.add(this.gameObject);
            this.gameObject.position.copy(this.characterGunPosition);
            this.gameObject.quaternion.copy(this.characterGunRotation);
            this.gameObject.scale.set(1, 1, 1);
        }
    }

    // subrscribe to input events
    onEnable() {
        if (this.enableDesktopInput) {
            window.addEventListener('click', this.onMouseClick);
        }
        if (this.enableMobileInput) {
            window.addEventListener('touchend', this.onTouchEnd);
        }
    }

    onDisable() {
        if (this.enableDesktopInput) {
            window.removeEventListener('click', this.onMouseClick);
        }
        if (this.enableMobileInput) {
            window.removeEventListener('touchend', this.onTouchEnd);
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

        console.log("touch end", event);
        if (dist < 15) {
            this.fire();
            console.log("tap finger");
        }
        if (event.touches.length <= 0) { // last finger 
            this.fire(true, true);
            console.log("last finger");
        }
    }

    private onMouseClick = (event: MouseEvent) => {
        if(isMobileDevice()) return; // ignore desktop input on mobile

        if (event.button != this.gunInput) // if not the correct mouse button, abort
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
        if (applyFireRate && t < this.fireTimeStamp + this.stats.fireRate) // fire rate
            return;
        this.fireTimeStamp = t; // save the time of a successful fire
        const hit = this.firePhysically(ignoreMiss);
        if(ignoreMiss && !hit) return; // abort miss
        this.fireVisually(hit);
    }

    fireVisually(hitPoint: Vector3 | null) {
        // fire anim
        this.animation.gunAnimator?.play(this.animation.fireAnimation);
        // particles
        this.effects.muzzleFlash?.play();
        this.effects.ejectShell?.play();
        // audio
        this.effects.fireSound?.stop();
        this.effects.fireSound?.play();

        // Setup hit particle effect: 
        if (this.effects.impactEffect && this.raycastWorldOrigin && hitPoint) {
            setWorldPosition(this.effects.impactEffect.gameObject, hitPoint);

            // play the effect
            this.effects.impactEffect.stop();
            this.effects.impactEffect.play();
        }
    }

    // perform raycast and reports hit/miss
    firePhysically(ignoreMiss: boolean = false): Vector3 | null {
        if (!this.raycastWorldOrigin)
            return null;

        const physics = this.context.physics;

        const hit = physics.raycastPhysicsFast(this.raycastWorldOrigin, this.raycastWorldDirection);
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
                    return hit.point;
                }
                return hit.point;
            }
        }

        if (!ignoreMiss) { // miss            
            this.onMiss?.invoke(this);
        }

        return null;
    }
}