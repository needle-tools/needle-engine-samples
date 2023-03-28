import {  Behaviour, Button, Canvas, CanvasGroup, GameObject, InstantiateOptions, Mathf, serializable, Text } from "@needle-tools/engine";
import { IPointerClickHandler, IPointerEnterHandler, IPointerExitHandler } from "@needle-tools/engine/src/engine-components/ui/PointerEvents";
import { getWorldPosition, getWorldQuaternion, getWorldScale, setWorldQuaternion } from "@needle-tools/engine/src/engine/engine_three_utils";
import { Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

export class Hotspot extends Behaviour {

    @serializable()
    titleText: string = "Title";

    @serializable()
    contentText: string = "Content";

    @serializable()
    viewAngle: number = 40;

    /* @serializable(RGBAColor)
    color: RGBAColor = new RGBAColor(1, 1, 1, 1); */

    private instance: GameObject | null = null;
    private hotspot?: HotspotBehaviour | null | undefined;

    // TODO figure out why onEnable doesn't work here
    start() {
        // instantiate a hotspot here
        const options = new InstantiateOptions();
        options.parent = this.gameObject;
        this.instance = GameObject.instantiate(HotspotManager.Instance.hotspotTemplate.gameObject, options);
        this.hotspot = this.instance?.getComponent(HotspotBehaviour);
        if (this.hotspot) {
            GameObject.setActive(this.hotspot.gameObject, false);
            GameObject.setActive(this.hotspot.gameObject, true);
            this.hotspot.init(this);

            HotspotManager.Instance.registerHotspot(this.hotspot);
        }
    }

    destroy() {
        // destroy the hotspot here
        if (this.instance) {
            GameObject.destroy(this.instance);
            this.instance = null;
            this.hotspot = null;
        }
    }
}

export class HotspotBehaviour extends Behaviour implements IPointerClickHandler {
    
    @serializable(Text)
    label?: Text;

    @serializable(Text)
    content?: Text;

    @serializable(GameObject)
    shift?: GameObject;

    @serializable()
    zOffset!: number;

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
        {
            this.label.text = hotspot.titleText;
            console.log(this.label.raycastTarget);
            this.label.raycastTarget = true;
        }
        if (this.content)
            this.content.text = hotspot.contentText;

        this.button = this.gameObject.getComponentInChildren(Button);
    }
    
    onPointerClick() {
        this.selected = !this.selected;
        this.contentFadeTimestamp = this.context.time.time;

        if(this.selected)
            HotspotManager.Instance.onSelect(this);

        if (this.canvas)
            this.canvas.renderOnTop = this.selected
    }

    deselect() {
        if(this.selected) {
            this.contentFadeTimestamp = this.context.time.time;
            this.selected = false;
        }
    }

    onBeforeRender(frame: XRFrame | null): void {
        
        if(this.hotspot == null)
            return;

        // TODO use the XR camera (e.g. left eye) when we're in XR and have a frame
        const cam = this.context.mainCamera;

        if(cam == null)
            return;

        // use camera rotation directly
        const camRotation = getWorldQuaternion(cam);
        setWorldQuaternion(this.gameObject, camRotation);
        
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
        const worldPosition = getWorldPosition(this.gameObject);
        const inCameraSpace = cam.worldToLocal(worldPosition);
        const distance = inCameraSpace.z * cameraScale.x;
        const scale = -0.06 * distance / parentScale.x * cameraScale.x; // scale factor is heuristic, could also be exposed
        this.gameObject.scale.set(scale, scale, scale);

        // shift towards camera a bit
        const vectorTowardsCameraInGameObjectSpace = this.gameObject.worldToLocal(cam.position.clone()).normalize().multiplyScalar(this.zOffset);
        if (this.shift) 
            this.shift.position.set(vectorTowardsCameraInGameObjectSpace.x, vectorTowardsCameraInGameObjectSpace.y, vectorTowardsCameraInGameObjectSpace.z);

        // handle visiblity angle
        const camFwd = cam.getWorldDirection(new Vector3());
        const hotspotFwd = this.hotspot!.gameObject.getWorldDirection(new Vector3());
        hotspotFwd.negate(); //invert the vector
        
        const angle = Mathf.toDegrees(camFwd.angleTo(hotspotFwd));

        const newIsVisible = angle < this.hotspot.viewAngle;
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
            this.contentCanvasGroup.alpha = Math.min(angleAlpha, stateAlpha);
        
        if (this.headerCanvasGroup)
            this.headerCanvasGroup.alpha = angleAlpha;
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
            if (h !== hotspot)
                h.deselect();
        }
    }
}
