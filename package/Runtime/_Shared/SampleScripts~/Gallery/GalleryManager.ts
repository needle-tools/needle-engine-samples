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
    }

    focusNext() {
        this.selectedPOIIndex = (this.selectedPOIIndex + 1) % this.pois.length;
        this.pois[this.selectedPOIIndex]?.focus();
    }

    focusPrevious() {
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