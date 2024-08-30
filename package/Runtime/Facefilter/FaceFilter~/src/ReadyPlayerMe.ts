import { AssetReference, Behaviour, findObjectOfType } from "@needle-tools/engine";
import { NeedleFilterTrackingManager } from "./FaceFilter";



export class ReadyPlayerMeFacefilterSupport extends Behaviour {


    onEnable(): void {
        window.addEventListener("dragover", this.onDragOver);
        window.addEventListener("drop", this.onDrop);
        window.addEventListener("paste", this.onPaste);
    }
    onDisable(): void {
        window.removeEventListener("dragover", this.onDragOver);
        window.removeEventListener("drop", this.onDrop);
        window.removeEventListener("paste", this.onPaste);
    }

    private onDragOver = (evt) => {
        evt.preventDefault();
        evt.dataTransfer.dropEffect = "copy";
    }

    private onDrop = (evt: DragEvent) => {
        if (!evt.dataTransfer?.items) return;
        evt.preventDefault();
        for (let i = 0; i < evt.dataTransfer.items.length; i++) {
            const item = evt.dataTransfer.items[i];
            if (item.kind === "string" && item.type === "text/uri-list") {
                item.getAsString((url) => {
                    console.log("dropped", url);
                    this.tryCreateAvatarFromString(url);

                });
            }
        }
    }

    private onPaste = (evt: ClipboardEvent) => {
        const url = evt.clipboardData?.getData("text");
        if (url) {
            console.log("pasted", url);
            this.tryCreateAvatarFromString(url);
        }
    }


    private tryCreateAvatarFromString(str: string) {
        if (str.endsWith(".glb")) {
            // Load the GLB
        }
        else if (str.startsWith("https://readyplayer.me/gallery")) {
            const id = str.split("/").pop();
            if (id) {
                str = `https://models.readyplayer.me/${id}.glb`;
            }
            else {
                console.warn("Could not find id in URL", str);
                return;
            }
        }
        else {
            const newUrl = new URL(str);
            const id = newUrl.searchParams.get("id");
            if (id) {
                str = `https://models.readyplayer.me/${id}.glb`;
            }
            else {
                console.warn("Could not find id in URL", str);
                return;
            }
        }

        if (str.startsWith("https://models.readyplayer.me")) {
            const filter = findObjectOfType(NeedleFilterTrackingManager);
            const ref = AssetReference.getOrCreateFromUrl(str);
            if (filter) {
                console.log("Add filter", ref);
                filter.filters.push(ref);
                filter.select(filter.filters.length - 1);
            }
            else {
                console.warn("Instantiate avatar");
                ref.instantiate({ parent: this.context.scene })
            }
        }
        else {
            console.warn("Unsupported URL...", str.substring(0, 100));
        }

    }


} 