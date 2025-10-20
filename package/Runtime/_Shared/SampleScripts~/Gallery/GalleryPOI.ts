import { Behaviour, findObjectOfType, getParam, OrbitControls, serializable, setParamWithoutReload } from "@needle-tools/engine"
import { Object3D } from "three";
import { GalleryManager } from "./GalleryManager";

/** Point of Interest that can be focused and asked for next and previous POI */
export class GalleryPOI extends Behaviour {
    @serializable(Object3D)
    cameraView?: Object3D;

    @serializable()
    title: string = "";

    private galleryManager?: GalleryManager;
    private slug: string = "";

    //@nonSerialized
    initialize(manager: GalleryManager) {
        this.galleryManager = manager;
    }

    start() {
        this.slug = toSlug(this.title);
        if (getParam("poi") === this.slug) {
            this.focus();
        }
    }

    private previousOrbitControls?: OrbitControls;
    focus() {
        setParamWithoutReload("poi", this.slug);
        this.galleryManager?.poiFocused(this);
        if (!this.cameraView) return;
        this.previousOrbitControls ??= findObjectOfType(OrbitControls)!;
        this.previousOrbitControls?.setCameraAndLookTarget(this.cameraView);
    }

    focusNext() { this.galleryManager?.focusNext(this); }
    focusPrevious() { this.galleryManager?.focusPrevious(this); }
}


function toSlug(name: string) {
    return name.trim().toLowerCase().replace(/ /g, "-");
}