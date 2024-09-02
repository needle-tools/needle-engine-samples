import { Behaviour, findObjectOfType, OrbitControls, serializable } from "@needle-tools/engine"
import { Object3D } from "three";
import { GalleryManager } from "./GalleryManager";

/** Point of Interest that can be focused and asked for next and previous POI */
export class GalleryPOI extends Behaviour {
    @serializable(Object3D)
    cameraView?: Object3D;

    @serializable()
    title: string = "";

    private galleryManager?: GalleryManager

    //@nonSerialized
    initialize(manager: GalleryManager) {
        this.galleryManager = manager;
    }

    private previousOrbitControls?: OrbitControls;
    focus() {
        this.galleryManager?.poiFocused(this);

        if (!this.cameraView) return;
        let orbitControls = this.previousOrbitControls;
        orbitControls ??= findObjectOfType(OrbitControls)!;
        orbitControls?.setCameraAndLookTarget(this.cameraView);
        this.previousOrbitControls = orbitControls;
    }

    focusNext() { this.galleryManager?.focusNext(); }
    focusPrevious() { this.galleryManager?.focusPrevious(); }
}