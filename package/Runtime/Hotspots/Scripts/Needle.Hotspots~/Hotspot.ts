import { Behaviour, Button, Canvas, CanvasGroup, EventList, GameObject, getTempVector, getWorldPosition, Gizmos, InstantiateOptions, Mathf, OrbitControls, serializable, Text } from "@needle-tools/engine";
import { Object3D, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

export class HotspotBehaviour extends Behaviour {

    @serializable()
    viewAngle: number = 40;

    @serializable()
    maxDistance: number = 150;

    // OPTIONAL forward shifting
    // @serializable(GameObject)
    // shift?: GameObject;

    // @serializable()
    // zOffset!: number;

    @serializable()
    contentFadeDuration!: number;

    @serializable()
    hotspotFadeDuration!: number;

    @serializable(Canvas)
    canvas?: Canvas;

    @serializable(CanvasGroup)
    contentCanvasGroup?: CanvasGroup;

    @serializable(CanvasGroup)
    headerCanvasGroup?: CanvasGroup;

    @serializable(Object3D)
    viewPoint: Object3D | null = null;

    @serializable(EventList)
    onActivate: EventList = new EventList();

    private selected: boolean = false;
    private contentFadeTimestamp: number = -999;
    private isVisible: boolean = false;
    private hotspotFadeTimestamp: number = -999;
    private button?: Button | null = null;

    private startForward: Vector3 = new Vector3();
    private viewStartPoint?: Vector3;

    onEnable(): void {
        this.startForward.copy(this.gameObject.worldForward);
        if (this.viewPoint) {
            this.viewStartPoint = getWorldPosition(this.viewPoint as any).clone() as any;
        }

        this.button = this.headerCanvasGroup?.gameObject.getComponentInChildren(Button);
        this.button?.onClick?.addEventListener(this.onButtonClicked);
        HotspotManager.Instance.registerHotspot(this);

    }
    onDisable(): void {
        this.button?.onClick?.removeEventListener(this.onButtonClicked);
        HotspotManager.Instance.unregisterHotspot(this);
    }

    onButtonClicked = () => {
        if (this.selected) {
            this.deselect();
        }
        else {
            this.select();
        }
    }

    select() {
        if (!this.selected) {
            this.selected = true;
            this.contentFadeTimestamp = this.context.time.time;
            HotspotManager.Instance?.onSelect(this);
            this.onActivate?.invoke();
            if (this.viewPoint) {
                const orbit = this.context.mainCamera.getComponent(OrbitControls);
                if (orbit) {
                    orbit.setCameraTargetPosition(this.viewStartPoint as any);
                    orbit.setLookTargetPosition(this.gameObject as any);
                }
            }
        }
    }

    deselect() {
        if (this.selected) {
            this.contentFadeTimestamp = this.context.time.time;
            this.selected = false;
        }
    }

    onBeforeRender(frame: XRFrame | null): void {
        const cam = this.context.mainCamera;
        if (cam == null) return;

        // use camera rotation directly
        if (this.context.isInXR) {
            const lookFrom = cam.worldPosition;
            // check if we're on a screen (not immersive) - then we should aim to render camera plane aligned
            //@ts-ignore
            const arSessionOnAScreen = this.context.xrSession.interactionMode === "screen-space";
            if (arSessionOnAScreen) {
                const forwardPoint = lookFrom.sub(this.forward);
                this.gameObject.lookAt(forwardPoint);
            }
            else {
                this.gameObject.lookAt(lookFrom);
            }
        } else {
            const camRotation = cam.worldQuaternion;
            this.gameObject.worldQuaternion = camRotation;
        }

        if (frame) {
            // TODO prevent roll in XR
            // calculate global up vector and (0,1,0) and create the quaternion rotation between them, 
            // then apply it to the hotspot to compensate for roll
            // three has Quaternion.setFromUnitVectors
        }

        const distanceToHotspot = cam.worldPosition.distanceTo(this.gameObject.worldPosition);

        let newIsVisible = true;
        if (distanceToHotspot > this.maxDistance) {
            newIsVisible = false;
        }
        else {

            // scale by distance to camera
            const parentScale = this.gameObject.parent!.worldScale;
            const cameraScale = cam.worldScale;
            /* console.log(cameraScale) */
            const worldPosition = this.gameObject.worldPosition;
            const inCameraSpace = getTempVector(worldPosition);
            cam.worldToLocal(inCameraSpace);
            const distance = -1 * inCameraSpace.z * cameraScale.x;

            // from a certain point, FOV doesn't appear larger anymore
            // (e.g. in a VR headset the size of hotspots should be the same no matter
            // 70° or 90° or 150° field of view since that is behind me)
            // May look nicer with some limiting function that is not linear
            // TODO we may want hotspots to become a bit smaller the further away they are, feels "too big" in VR
            // Keep constant screensize independent of fov
            // @ts-ignore
            const clampedFov = Mathf.clamp(cam.fov, 0, 70);
            const multiplier = 0.25 * Math.tan(clampedFov * Mathf.Deg2Rad / 2);

            const scale = multiplier * distance / parentScale.x; // scale factor is heuristic, could also be exposed
            this.gameObject.scale.set(scale, scale, scale);

            // OPTIONAL shift towards camera a bit
            // const vectorTowardsCameraInGameObjectSpace = this.gameObject.worldToLocal(HotspotBehaviour._tempVector1.copy(cam.position)).normalize().multiplyScalar(this.zOffset);
            // if (this.shift) 
            //     this.shift.position.set(vectorTowardsCameraInGameObjectSpace.x, vectorTowardsCameraInGameObjectSpace.y, vectorTowardsCameraInGameObjectSpace.z);

            // handle visiblity angle
            const hotspotFwd = this.startForward;

            const hotspotPos = this.worldPosition;
            const camPos = cam.worldPosition;
            const dirToCam = getTempVector(camPos).sub(hotspotPos).normalize() as any as Vector3;
            const angle = Mathf.toDegrees(hotspotFwd.angleTo(dirToCam));

            newIsVisible = angle < this.viewAngle;
        }

        if (!this.selected && newIsVisible != this.isVisible) {
            this.hotspotFadeTimestamp = this.context.time.time;
            //     if (this.button) this.button.enabled = newIsVisible;

            //     // if (!newIsVisible && this.selected) {
            //     //     this.selected = false;
            //     //     this.contentFadeTimestamp = this.context.time.time;
            //     // }
        }

        this.isVisible = newIsVisible;
        this.applyFade();
    }

    private applyFade() {
        const goal1 = this.selected || this.isVisible ? 1 : 0;
        const t1 = Mathf.clamp01((this.context.time.time - this.hotspotFadeTimestamp) / this.hotspotFadeDuration);
        const angleAlpha = Mathf.lerp(1 - goal1, goal1, t1);

        const goal2 = this.selected ? 1 : 0;
        const t2 = Mathf.clamp01((this.context.time.time - this.contentFadeTimestamp) / this.contentFadeDuration);
        const stateAlpha = Mathf.lerp(1 - goal2, goal2, t2);

        if (this.contentCanvasGroup) {
            this.contentCanvasGroup.alpha = Math.min(angleAlpha, stateAlpha);
            this.contentCanvasGroup.interactable = this.isVisible || this.selected;
            this.contentCanvasGroup.blocksRaycasts = this.isVisible || this.selected;
        }

        if (this.headerCanvasGroup) {
            this.headerCanvasGroup.alpha = angleAlpha;
            this.headerCanvasGroup.interactable = this.isVisible || this.selected;
            this.headerCanvasGroup.blocksRaycasts = this.isVisible || this.selected;
        }
    }
}

export class HotspotManager extends Behaviour {

    static Instance: HotspotManager;

    @serializable()
    forceSingleActive: boolean = true;

    private readonly activeHotspots: HotspotBehaviour[] = [];

    constructor() {
        super();
        HotspotManager.Instance = this;
    }

    registerHotspot(hotspot: HotspotBehaviour) {
        // add to active hotspots only if it's not already there
        if (this.activeHotspots.indexOf(hotspot) === -1)
            this.activeHotspots.push(hotspot);
    }
    unregisterHotspot(hotspot: HotspotBehaviour) {
        const index = this.activeHotspots.indexOf(hotspot);
        if (index !== -1) this.activeHotspots.splice(index, 1);
    }

    onSelect(hotspot: HotspotBehaviour) {
        if (!this.forceSingleActive)
            return;

        for (const h of this.activeHotspots) {
            if (h !== hotspot && h)
                h.deselect();
        }
    }
}
