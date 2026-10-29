import { Behaviour, findObjectOfType, getParam, ImageReference, OrbitControls, serializable, setParamWithoutReload } from "@needle-tools/engine"
import { Object3D } from "three";
import { GalleryManager } from "./GalleryManager";

/** Point of Interest that can be focused and asked for next and previous POI */
export class GalleryPOI extends Behaviour {
    // @type UnityEngine.GameObject
    @serializable(Object3D)
    cameraView?: Object3D;

    @serializable()
    title: string = "";

    /** Box the camera look target is clamped to while this POI is focused (world position and scale, like OrbitControls.targetBounds). Leave empty to keep the bounds set on the OrbitControls. */
    @serializable(Object3D)
    targetBounds?: Object3D;

    /** What a visitor can do here. Shown when the GalleryNavigation panel is expanded. */
    @serializable()
    description: string = "";

    /** Features this POI shows off, listed as tags under the description. */
    @serializable()
    features: string[] = [];

    /** Image of this POI for the preview view of the gallery menu. Rendered with Render POI Previews on the GalleryManager. */
    @serializable(ImageReference)
    previewImage?: ImageReference;

    private galleryManager?: GalleryManager;

    /** Name of this POI in the poi url parameter. */
    //@nonSerialized
    get slug() { return toSlug(this.title); }

    //@nonSerialized
    initialize(manager: GalleryManager) {
        this.galleryManager = manager;
    }

    start() {
        // the manager may have focused this POI from the url before it was active
        if (getParam("poi") === this.slug && this.galleryManager?.focusedPOI !== this) {
            this.focus();
        }
    }

    private previousOrbitControls?: OrbitControls;
    focus() {
        setParamWithoutReload("poi", this.slug);
        this.applyFocus();
    }

    /** Focus without writing the POI to the url. */
    //@nonSerialized
    applyFocus() {
        this.galleryManager?.poiFocused(this);
        this.previousOrbitControls ??= findObjectOfType(OrbitControls)!;
        if (this.previousOrbitControls) applyTargetBounds(this.previousOrbitControls, this.targetBounds);
        if (!this.cameraView) return;
        this.previousOrbitControls?.setCameraAndLookTarget(this.cameraView, this.galleryManager?.deactivateInactivePOIs ?? false);
    }

    focusNext() { this.galleryManager?.focusNext(this); }
    focusPrevious() { this.galleryManager?.focusPrevious(this); }
}


/** Bounds a POI put on the controls, and the scene's own bounds to restore once a POI without bounds is focused. */
const poiBounds = new WeakMap<OrbitControls, { applied: Object3D, scene: Object3D | null }>();

function applyTargetBounds(controls: OrbitControls, bounds: Object3D | undefined) {
    const current = poiBounds.get(controls);
    if (bounds) {
        poiBounds.set(controls, { applied: bounds, scene: current ? current.scene : controls.targetBounds });
        controls.targetBounds = bounds;
    }
    else if (current) {
        // leave bounds alone that something else changed in the meantime
        if (controls.targetBounds === current.applied) controls.targetBounds = current.scene;
        poiBounds.delete(controls);
    }
}

function toSlug(name: string) {
    return name.trim().toLowerCase().replace(/ /g, "-");
}