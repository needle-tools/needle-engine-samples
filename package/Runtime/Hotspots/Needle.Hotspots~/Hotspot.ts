import { Animator, Behaviour, GameObject, InstantiateOptions, RGBAColor, serializeable, Text, WebXR } from "@needle-tools/engine";
import { IPointerClickHandler, IPointerEnterHandler, IPointerExitHandler } from "@needle-tools/engine/src/engine-components/ui/PointerEvents";
import { getWorldPosition, getWorldQuaternion, getWorldScale, setWorldQuaternion } from "@needle-tools/engine/src/engine/engine_three_utils";
import { Quaternion, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

export class Hotspot extends Behaviour {

    @serializeable
    text: string = "Hotspot";

    @serializeable
    content: string = "Content";

    @serializeable(RGBAColor)
    color: RGBAColor = new RGBAColor(1, 1, 1, 1);

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

export class HotspotBehaviour extends Behaviour implements IPointerEnterHandler, IPointerExitHandler, IPointerClickHandler {
    
    @serializeable(Text)
    label?: Text;
    @serializeable(Text)
    content?: Text;
    @serializeable(GameObject)
    shift?: GameObject;

    private animator: Animator;

    start() {
        this.animator = this.gameObject.getComponent(Animator)!;
    }
    
    init(hotspot: Hotspot) {
        if (this.label)
            this.label.text = hotspot.text;
        if (this.content)
            this.content.text = hotspot.content;
    }

    onPointerEnter() {
        this.animator?.SetBool("Hovered", true);
    }

    onPointerExit() {
        this.animator?.SetBool("Hovered", false);
    }

    onPointerClick() {
        this.animator?.SetTrigger("Click");
    }

    onBeforeRender(frame: XRFrame | null): void {

        // TODO use the XR camera (e.g. left eye) when we're in XR and have a frame

        if (this.context.mainCamera) {
            // use camera rotation directly
            const camRotation = getWorldQuaternion(this.context.mainCamera);
            setWorldQuaternion(this.gameObject, camRotation);
            
            if (frame) {
                // TODO prevent roll in XR
                // calculate global up vector and (0,1,0) and create the quaternion rotation between them, 
                // then apply it to the hotspot to compensate for roll
                // three has Quaternion.setFromUnitVectors
            }

            // scale by distance to camera
            const parentScale = getWorldScale(this.gameObject.parent!);
            const cameraScale = getWorldScale(this.context.mainCamera);
            console.log(cameraScale)
            const worldPosition = getWorldPosition(this.gameObject);
            const inCameraSpace = this.context.mainCamera.worldToLocal(worldPosition);
            const distance = inCameraSpace.z * cameraScale.x;
            const scale = -0.06 * distance / parentScale.x * cameraScale.x; // scale factor is heuristic, could also be exposed
            this.gameObject.scale.set(scale, scale, scale);

            // shift towards camera a bit
            const vectorTowardsCameraInGameObjectSpace = this.gameObject.worldToLocal(this.context.mainCamera.position.clone()).normalize();
            if (this.shift) 
                this.shift.position.set(vectorTowardsCameraInGameObjectSpace.x, vectorTowardsCameraInGameObjectSpace.y, vectorTowardsCameraInGameObjectSpace.z);
        }
    }
}

export class HotspotManager extends Behaviour {
    @serializeable(HotspotBehaviour)
    hotspotTemplate: HotspotBehaviour;

    static Instance: HotspotManager;

    awake() {
        HotspotManager.Instance = this;
        this.hotspotTemplate.gameObject.removeFromParent();
        GameObject.setActive(this.hotspotTemplate.gameObject, false);
    }
}
