import { Behaviour, GameObject, IPointerClickHandler, Renderer, WebXRPlaneTracking, serializable } from "@needle-tools/engine";
import { Material, MeshBasicMaterial } from "three";

// Documentation → https://docs.needle.tools/scripting

export class RevealWorldBehind extends Behaviour implements IPointerClickHandler {
    
    // on hover, we show outlines
    // on click, we toggle between
    // - random color (default material)
    // - occluder (reveals passthrough behind)
    // - transparent (reveals passthrough behind)

    @serializable(Material)
    materials: Material[] = [];

    private renderer: Renderer | null = null;

    start() {

        // Quest Browser 27.2+ (June 2023) ships with experimental support for "semanticLabel" on XRPlanes
        // Needs to have "WebXR Experimental Settings" turned on in chrome://flags
        // See also https://immersive-web.github.io/real-world-meshing/#mesh
        const tracker = GameObject.findObjectOfType(WebXRPlaneTracking);
        if (tracker) {
            const planes = tracker.trackedPlanes;
            for (const plane of planes) {
                //@ts-ignore
                if (plane.mesh === this.gameObject) {
                    const data = plane.xrPlane;
                    //@ts-ignore
                    console.log("this plane is part of a ", data.semanticLabel);
                }
            }
        }

        this.renderer = this.gameObject.getComponent(Renderer);
        // append our current material to the list
        if (this.renderer) {
            this.materials.push(this.renderer.sharedMaterial);
            this.materials.push(this.blockerMaterial());
            this.materials.push(this.wireframeMaterial());
        }
    }

    onPointerClick() {
        if (!this.renderer) return;

        const material = this.renderer.sharedMaterial;
        const index = this.materials.indexOf(material);
        const nextIndex = (index + 1) % this.materials.length;

        const newMat = this.materials[nextIndex];
        this.renderer.sharedMaterial = newMat;
        if ("_renderOrder" in newMat) {
            this.renderer.renderOrder = [newMat._renderOrder];
        }
        else {
            this.renderer.renderOrder = [0];
        }
    }

    private blockerMaterial() {
        const material = new MeshBasicMaterial();
        material.colorWrite = false;
        material.depthWrite = true;
        material.alphaTest = 0.5;
        material.opacity = 1;
        material["_renderOrder"] = -100;
        return material;
    }

    private wireframeMaterial() {
        const material = new MeshBasicMaterial();
        material.colorWrite = true;
        material.depthWrite = false;
        material.alphaTest = 0.5;
        material.opacity = 1;
        material.wireframe = true;
        return material;
    }
}