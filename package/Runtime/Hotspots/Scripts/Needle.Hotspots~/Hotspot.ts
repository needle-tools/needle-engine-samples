import {  Behaviour, Button, Canvas, CanvasGroup, GameObject, Gizmos, InstantiateOptions, Mathf, serializable, showBalloonMessage, Text } from "@needle-tools/engine";
import { IPointerClickHandler, IPointerEnterHandler, IPointerExitHandler } from "@needle-tools/engine";
import { getWorldPosition, getWorldQuaternion, getWorldScale, setWorldQuaternion } from "@needle-tools/engine";
import { Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

export class Hotspot extends Behaviour {

    @serializable()
    titleText: string = "Title";

    @serializable()
    contentText: string = "Content";

    @serializable()
    viewAngle: number = 40;

    private instance: GameObject | null = null;
    private hotspot?: HotspotBehaviour | null | undefined;

    // TODO figure out why onEnable doesn't work here
    start() {
        // instantiate a hotspot here
        const options = new InstantiateOptions();
        options.parent = this.gameObject;
        this.instance = GameObject.instantiate(HotspotManager.Instance.hotspotTemplate.gameObject, options);
        this.instance.removeFromParent();
        this.gameObject.add(this.instance);
        this.hotspot = this.instance?.getComponent(HotspotBehaviour);
        if (this.hotspot) {
            GameObject.setActive(this.hotspot.gameObject, true);
            this.hotspot.init(this);
            HotspotManager.Instance.registerHotspot(this.hotspot);
        }
    }

    destroy() {
        if (!this.instance) return;

        GameObject.destroy(this.instance);
        this.instance = null;
        this.hotspot = null;
    }
}

export class HotspotBehaviour extends Behaviour implements IPointerClickHandler {
    
    @serializable(Text)
    label?: Text;

    @serializable(Text)
    content?: Text;

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

    private selected: boolean = false;
    private hotspot?: Hotspot;
    private contentFadeTimestamp: number = -999;
    private isVisible: boolean = false;
    private hotspotFadeTimestamp: number = -999;

    private button?: Button | null = null;

    init(hotspot: Hotspot) {
        this.hotspot = hotspot;
        if (this.label)
            this.label.text = hotspot.titleText;
        if (this.content)
            this.content.text = hotspot.contentText;

        this.button = this.gameObject.getComponentInChildren(Button);
    }
    
    onPointerClick() {
        this.selected = !this.selected;
        this.contentFadeTimestamp = this.context.time.time;

        if(this.selected && HotspotManager.Instance)
            HotspotManager.Instance.onSelect(this);
    }

    deselect() {
        if(this.selected) {
            this.contentFadeTimestamp = this.context.time.time;
            this.selected = false;
        }
    }

    private static _tempVector1 = new Vector3();
    private static _tempVector2 = new Vector3();

    onBeforeRender(frame: XRFrame | null): void {
        
        if (!this.hotspot) return;
        if (!this.gameObject.parent) return;

        const cam = this.context.mainCamera;
        if(cam == null) return;

        // use camera rotation directly
        if (this.context.isInXR) {
            const lookFrom = getWorldPosition(cam);
            this.gameObject.lookAt(lookFrom);
            // check if we're on a screen (not immersive) - then we should aim to render camera plane aligned
            const arSessionOnAScreen = this.context.xrSession.interactionMode === "screen-space";
            if (arSessionOnAScreen) {
                const forwardPoint = lookFrom.sub(this.forward);
                this.gameObject.lookAt(forwardPoint);
            }
        } else {
            const camRotation = getWorldQuaternion(cam);
            setWorldQuaternion(this.gameObject, camRotation);
        }

        if (frame) {
            // TODO prevent roll in XR
            // calculate global up vector and (0,1,0) and create the quaternion rotation between them, 
            // then apply it to the hotspot to compensate for roll
            // three has Quaternion.setFromUnitVectors
        }

        // scale by distance to camera
        const parentScale = getWorldScale(this.gameObject.parent!);
        const cameraScale = getWorldScale(cam);
        /* console.log(cameraScale) */
        const worldPosition = getWorldPosition(this.gameObject).clone();
        const inCameraSpace = worldPosition.clone();
        cam.worldToLocal(inCameraSpace);
        const distance = -1 * inCameraSpace.z * cameraScale.x;

        // from a certain point, FOV doesn't appear larger anymore
        // (e.g. in a VR headset the size of hotspots should be the same no matter
        // 70° or 90° or 150° field of view since that is behind me)
        // May look nicer with some limiting function that is not linear
        // TODO we may want hotspots to become a bit smaller the further away they are, feels "too big" in VR
        // Keep constant screensize independent of fov
        const clampedFov = Mathf.clamp(cam.fov, 0, 70);
        const multiplier = 0.25 * Math.tan(clampedFov * Mathf.Deg2Rad / 2);

        const scale = multiplier * distance / parentScale.x; // scale factor is heuristic, could also be exposed
        this.gameObject.scale.set(scale, scale, scale);

        // OPTIONAL shift towards camera a bit
        // const vectorTowardsCameraInGameObjectSpace = this.gameObject.worldToLocal(HotspotBehaviour._tempVector1.copy(cam.position)).normalize().multiplyScalar(this.zOffset);
        // if (this.shift) 
        //     this.shift.position.set(vectorTowardsCameraInGameObjectSpace.x, vectorTowardsCameraInGameObjectSpace.y, vectorTowardsCameraInGameObjectSpace.z);
        
        // handle visiblity angle
        const camFwd = cam.getWorldDirection(HotspotBehaviour._tempVector1);
        const hotspotFwd = this.hotspot!.gameObject.getWorldDirection(HotspotBehaviour._tempVector2);
        hotspotFwd.negate();
        
        const angle = Mathf.toDegrees(camFwd.angleTo(hotspotFwd));
        // this.label.text = angle.toFixed(1) + " deg";

        const newIsVisible = angle < this.hotspot.viewAngle ;
        if (newIsVisible != this.isVisible) 
        {
            this.hotspotFadeTimestamp = this.context.time.time;
            if(this.button)
                this.button.enabled = newIsVisible;

            if(!newIsVisible && this.selected)
            {
                this.selected = false;
                this.contentFadeTimestamp = this.context.time.time;
            }
        }

        this.isVisible = newIsVisible;
        

        this.applyFade();
    }

    applyFade() 
    {
        const goal1 = this.isVisible ? 1 : 0;
        const t1 = Mathf.clamp01((this.context.time.time - this.hotspotFadeTimestamp) / this.hotspotFadeDuration);
        const angleAlpha = Mathf.lerp(1 - goal1, goal1, t1);

        const goal2 = this.selected ? 1 : 0;
        const t2 = Mathf.clamp01((this.context.time.time - this.contentFadeTimestamp) / this.contentFadeDuration);
        const stateAlpha = Mathf.lerp(1 - goal2, goal2, t2);

        if (this.contentCanvasGroup) 
        {
            this.contentCanvasGroup.alpha = Math.min(angleAlpha, stateAlpha);
            this.contentCanvasGroup.interactable = this.selected;
        }
        
        if (this.headerCanvasGroup)
        {
            this.headerCanvasGroup.alpha = angleAlpha;
            this.headerCanvasGroup.interactable = this.isVisible;
        }
    }
}

export class HotspotManager extends Behaviour {
    @serializable(HotspotBehaviour)
    hotspotTemplate!: HotspotBehaviour;

    @serializable()
    forceSingleActive: boolean = true;

    static Instance: HotspotManager;

    private activeHotspots: HotspotBehaviour[] = [];

    awake() 
    {
        HotspotManager.Instance = this;
        this.hotspotTemplate.gameObject.position.set(0, 0, 0);
        this.hotspotTemplate.gameObject.scale.set(1, 1, 1);
        this.hotspotTemplate.gameObject.quaternion.identity();
        this.hotspotTemplate.gameObject.removeFromParent();
        GameObject.setActive(this.hotspotTemplate.gameObject, false);
    }

    registerHotspot(hotspot: HotspotBehaviour) 
    {
        // add to active hotspots only if it's not already there
        if (this.activeHotspots.indexOf(hotspot) === -1)
            this.activeHotspots.push(hotspot);
    }

    onSelect(hotspot: HotspotBehaviour) 
    {
        if (!this.forceSingleActive) 
            return;

        for (const h of this.activeHotspots) 
        {
            if (h !== hotspot && h)
                h.deselect();
        }
    }
}
