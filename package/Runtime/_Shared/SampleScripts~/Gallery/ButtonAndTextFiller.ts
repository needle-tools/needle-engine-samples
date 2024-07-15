import { Behaviour, Button, EventList, FileReference, Gizmos, Text, findObjectOfType, getTempVector, serializable } from "@needle-tools/engine";
import { GalleryUI, GalleryUIItem } from "./GalleryUI";

class ButtonAndTextFillerElement {
    @serializable(Button)
    button?: Button;

    @serializable(Text)
    label?: Text;
}

export class ButtonAndTextFiller extends Behaviour {
    @serializable(GalleryUI)
    galleryUI?: GalleryUI;

    @serializable()
    categoryName: string = "";

    @serializable(FileReference)
    icon?: FileReference;

    @serializable(ButtonAndTextFillerElement)
    data: ButtonAndTextFillerElement[] = [];


    awake(): void {
        this.galleryUI ??= findObjectOfType(GalleryUI)!;

        const category = this.galleryUI?.categories.find(x => x.title === this.categoryName);
        if (category) {
            this.data.forEach(x => {
                const item = new GalleryUIItem();
                item.name = x.label?.text || "";
                item.icon = this.icon;
                item.click = new EventList();
                item.click?.addEventListener(() => { x.button?.onClick?.invoke(); });
                category.items.push(item);
            });
        }
    }
}