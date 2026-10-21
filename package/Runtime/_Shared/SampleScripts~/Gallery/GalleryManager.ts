import { Behaviour, EventList, FileReference, serializable } from "@needle-tools/engine";
import { GalleryUI, GalleryUIItem } from "./GalleryUI";
import { GalleryPOI } from "./GalleryPOI";

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

    private selectedPOIIndex: number = 0;
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
    }
}