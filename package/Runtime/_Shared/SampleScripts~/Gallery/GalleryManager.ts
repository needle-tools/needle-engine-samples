import { Behaviour, EventList, FileReference, getTempVector, serializable } from "@needle-tools/engine";
import { Object3D, Vector3 } from "three";
import { GalleryUI, GalleryUIItem } from "./GalleryUI";
import { GalleryPOI } from "./GalleryPOI";

/** Hidden POIs are moved to Ignore Raycast, which the camera then stops rendering: unlike visible = false this
 * leaves every component enabled, and default raycasts skip the layer, so nothing hidden can be grabbed. */
const hiddenLayer = 2;

export class GalleryManager extends Behaviour {

    /* POIs */
    @serializable(GalleryPOI)
    pois: GalleryPOI[] = [];

    /* Gallery Menu */
    @serializable(GalleryUI)
    galleryUI?: GalleryUI;

    @serializable()
    categoryName: string = "";

    @serializable(FileReference)
    icon?: FileReference;

    /* Selection */
    @serializable()
    arrowKeysNavigation: boolean = true;

    /** Hide all POIs but the focused one. The POI being left stays visible until the camera has arrived at the new one. Uses the Ignore Raycast layer, which the camera stops rendering. */
    @serializable()
    hideInactivePOIs: boolean = false;

    private selectedPOIIndex: number = 0;
    private hasFocused = false;
    private hidePending = false;
    private hidePendingSince = 0;
    private stillFrames = 0;
    private lastCameraPosition = new Vector3();
    private readonly layersBeforeHiding = new WeakMap<Object3D, number>();
    private focusListeners: Array<(poi: GalleryPOI, index: number) => void> = [];

    //@nonSerialized
    get selectedIndex() { return this.selectedPOIIndex; }

    /** Calls back with the POI and its index whenever a POI of this manager is focused. Returns a function that removes the listener. */
    //@nonSerialized
    addFocusListener(listener: (poi: GalleryPOI, index: number) => void) {
        this.focusListeners.push(listener);
        return () => { this.focusListeners = this.focusListeners.filter(x => x !== listener); };
    }

    awake(): void {
        this.populateGalleryUI(this.pois);
        this.pois.forEach(x => x.initialize(this));
    }

    start(): void {
        // a POI focused from the url has already set this up
        if (this.hideInactivePOIs && !this.hasFocused) this.showOnly(this.pois[this.selectedPOIIndex]);
    }

    private populateGalleryUI(pois: GalleryPOI[]) {
        if (!this.galleryUI) return;

        const category = this.galleryUI?.categories.find(x => x.title === this.categoryName);
        if (category) {
            pois.forEach(x => {
                const item = new GalleryUIItem();
                item.name = x.title;
                item.icon = this.icon;
                item.click = new EventList();
                item.click.addEventListener(() => {
                    x.focus()
                });
                category.items.push(item);
            });
        }
    }

    poiFocused(poi: GalleryPOI) {
        const index = this.pois.indexOf(poi);
        if (index == -1) return;

        this.selectedPOIIndex = index;
        this.hasFocused = true;
        if (this.hideInactivePOIs) {
            this.setHidden(poi, false);
            this.hidePending = true;
            this.hidePendingSince = this.context.time.time;
            this.stillFrames = 0;
        }
        this.focusListeners.forEach(x => x(poi, index));
    }

    focusNext(poi?:GalleryPOI) {
        if(poi) this.selectedPOIIndex = this.pois.indexOf(poi);
        this.selectedPOIIndex = (this.selectedPOIIndex + 1) % this.pois.length;
        this.pois[this.selectedPOIIndex]?.focus();
    }

    focusPrevious(poi?:GalleryPOI) {
        if(poi) this.selectedPOIIndex = this.pois.indexOf(poi);
        this.selectedPOIIndex = (this.selectedPOIIndex - 1 + this.pois.length) % this.pois.length;
        this.pois[this.selectedPOIIndex]?.focus();
    }

    update(): void {
        if (this.arrowKeysNavigation) {
            const input = this.context.input;
            if (input.isKeyDown("ArrowRight")) {
                this.focusNext();
            }
            else if (input.isKeyDown("ArrowLeft")) {
                this.focusPrevious();
            }
        }
        if (this.hidePending) this.hideOnceCameraArrived();
    }

    private hideOnceCameraArrived() {
        const camera = this.context.mainCamera;
        if (!camera) return;
        const position = camera.getWorldPosition(getTempVector());
        this.stillFrames = position.distanceToSquared(this.lastCameraPosition) < 1e-8 ? this.stillFrames + 1 : 0;
        this.lastCameraPosition.copy(position);
        // arrived means the camera stopped easing in; the timeout covers a camera that is moved right away
        const elapsed = this.context.time.time - this.hidePendingSince;
        if ((this.stillFrames < 5 || elapsed < 0.2) && elapsed < 3) return;
        this.hidePending = false;
        this.showOnly(this.pois[this.selectedPOIIndex]);
    }

    private showOnly(poi?: GalleryPOI) {
        // every time rather than once: a camera that is re-enabled gets its culling mask back
        this.context.mainCamera?.layers.disable(hiddenLayer);
        for (const x of this.pois) this.setHidden(x, x !== poi);
    }

    private setHidden(poi: GalleryPOI, hidden: boolean) {
        poi.gameObject.traverse(obj => {
            const before = this.layersBeforeHiding.get(obj);
            if (hidden && before === undefined) {
                this.layersBeforeHiding.set(obj, obj.layers.mask);
                obj.layers.set(hiddenLayer);
            }
            else if (!hidden && before !== undefined) {
                obj.layers.mask = before;
                this.layersBeforeHiding.delete(obj);
            }
        });
    }
}