import { AudioSource, Behaviour, findObjectsOfType, serializable } from "@needle-tools/engine";
import { GalleryManager } from "./GalleryManager";
import { GalleryPOI } from "./GalleryPOI";

/** Silences the AudioSources under this object while another POI of the gallery is focused, and fades them back in once this one is focused again. Add it next to a GalleryPOI. The sources keep playing meanwhile, and their own volume is left alone, so whatever drives them carries on undisturbed. */
export class GalleryPOIAudio extends Behaviour {

    /** Seconds to fade out, and back in. */
    @serializable()
    fadeSeconds: number = 0.5;

    private sources: AudioSource[] = [];
    private readonly gains = new Map<AudioSource, GainNode>();
    private focused = true;
    private removeFocusListener?: () => void;

    start() {
        this.sources = this.gameObject.getComponentsInChildren(AudioSource);
        const poi = this.gameObject.getComponent(GalleryPOI);
        const manager = poi ? findObjectsOfType(GalleryManager).find(m => m.pois.includes(poi)) : undefined;
        if (!poi || !manager) return;
        this.focused = manager.pois[manager.selectedIndex] === poi;
        this.removeFocusListener = manager.addFocusListener(focused => this.setFocused(focused === poi));
    }

    onDestroy() {
        this.removeFocusListener?.();
    }

    update() {
        if (this.gains.size >= this.sources.length) return;
        for (const source of this.sources) {
            if (this.gains.has(source)) continue;
            // exists only once the user has interacted with the page
            const sound = source.Sound;
            if (!sound) continue;
            // a filter rather than the volume, which the source's owner may set every frame
            const gain = sound.context.createGain();
            gain.gain.value = this.focused ? 1 : 0;
            sound.setFilters([...sound.getFilters(), gain]);
            this.gains.set(source, gain);
        }
    }

    private setFocused(focused: boolean) {
        this.focused = focused;
        for (const gain of this.gains.values()) {
            gain.gain.setTargetAtTime(focused ? 1 : 0, gain.context.currentTime, Math.max(0.01, this.fadeSeconds / 3));
        }
    }
}
