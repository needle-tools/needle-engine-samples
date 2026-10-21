import { Behaviour, findObjectOfType, RGBAColor, serializable } from "@needle-tools/engine";
import { GalleryManager } from "./GalleryManager";
import { GalleryPOI } from "./GalleryPOI";

/** Bottom bar with previous and next buttons and the focused POI title. Expands to show the POI description and features. */
export class GalleryNavigation extends Behaviour {
    /** Manager whose POIs are navigated. Falls back to the first one in the scene. */
    @serializable(GalleryManager)
    manager?: GalleryManager;

    /** Colors of the number badge, picked by POI index. Leave empty for a neutral badge. */
    @serializable(RGBAColor)
    accentColors: RGBAColor[] = [];

    /** Show the description panel right away. */
    @serializable()
    startExpanded: boolean = false;

    private root?: HTMLElement;
    private index?: HTMLElement;
    private title?: HTMLElement;
    private description?: HTMLElement;
    private features?: HTMLElement;
    private infoButton?: HTMLButtonElement;
    private removeFocusListener?: () => void;

    awake(): void {
        if (!document.getElementById("gallery-nav-style"))
            document.head.insertAdjacentHTML("beforeend", `<style id="gallery-nav-style">${css}</style>`);

        this.root = document.createElement("div");
        this.root.classList.add("gallery-nav");
        this.root.innerHTML = html;
        this.index = this.root.querySelector(".gallery-nav-index")!;
        this.title = this.root.querySelector(".gallery-nav-title")!;
        this.description = this.root.querySelector(".gallery-nav-description")!;
        this.features = this.root.querySelector(".gallery-nav-features")!;
        this.infoButton = this.root.querySelector(".gallery-nav-info")!;

        this.root.querySelector(".gallery-nav-prev")!.addEventListener("click", () => this.manager?.focusPrevious());
        this.root.querySelector(".gallery-nav-next")!.addEventListener("click", () => this.manager?.focusNext());
        this.infoButton.addEventListener("click", () => this.setExpanded(!this.root!.classList.contains("expanded")));
        // keep presses on the bar from reaching the camera controls behind it
        for (const type of ["pointerdown", "pointerup", "pointermove", "wheel"])
            this.root.addEventListener(type, e => e.stopPropagation());

        this.setExpanded(this.startExpanded);
    }

    onEnable(): void {
        this.manager ??= findObjectOfType(GalleryManager)!;
        if (!this.manager || !this.root) return;
        this.context.domElement.appendChild(this.root);
        this.removeFocusListener = this.manager.addFocusListener((poi, index) => this.show(poi, index));
        const index = this.manager.selectedIndex;
        const poi = this.manager.pois[index];
        if (poi) this.show(poi, index);
    }

    onDisable(): void {
        this.removeFocusListener?.();
        this.root?.remove();
    }

    setExpanded(expanded: boolean) {
        this.root?.classList.toggle("expanded", expanded);
        this.infoButton?.setAttribute("aria-expanded", String(expanded));
    }

    private show(poi: GalleryPOI, index: number) {
        if (!this.root) return;
        const count = this.manager?.pois.length ?? 0;
        this.index!.textContent = String(index + 1).padStart(2, "0");
        this.index!.title = `${index + 1} / ${count}`;
        const accent = this.accentColors.length ? this.accentColors[index % this.accentColors.length] : undefined;
        this.root.style.setProperty("--gallery-nav-accent", accent ? `#${accent.getHexString()}` : "");
        this.title!.textContent = poi.title.trim();
        this.description!.textContent = poi.description;
        this.features!.replaceChildren(...poi.features.map(name => {
            const tag = document.createElement("span");
            tag.textContent = name;
            return tag;
        }));
        this.root.classList.toggle("has-details", !!poi.description || poi.features.length > 0);

        // restart the fade-in for the new content
        this.root.classList.remove("changed");
        void this.root.offsetWidth;
        this.root.classList.add("changed");
    }
}

const chevron = /* html */`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">`;

const html = /* html */`
    <div class="gallery-nav-panel">
        <div class="gallery-nav-panel-inner">
            <p class="gallery-nav-description"></p>
            <div class="gallery-nav-features"></div>
        </div>
    </div>
    <div class="gallery-nav-bar">
        <button class="gallery-nav-arrow gallery-nav-prev" aria-label="Previous">${chevron}<path d="M15 5l-7 7 7 7"/></svg></button>
        <button class="gallery-nav-info" aria-expanded="false" aria-label="Show details">
            <span class="gallery-nav-index"></span>
            <span class="gallery-nav-title"></span>
            <span class="gallery-nav-toggle">${chevron}<path d="M6 15l6-6 6 6"/></svg></span>
        </button>
        <button class="gallery-nav-arrow gallery-nav-next" aria-label="Next">${chevron}<path d="M9 5l7 7-7 7"/></svg></button>
    </div>
`;

const css = /* css */`
.gallery-nav {
    --gallery-nav-accent-fallback: #2a2d33;
    position: absolute;
    left: 50%;
    /* sits above the Needle menu */
    bottom: calc(env(safe-area-inset-bottom, 0px) + 88px);
    transform: translateX(-50%);
    width: min(440px, calc(100% - 32px));
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    z-index: 2;
    font-family: 'Roboto Flex', system-ui, -apple-system, 'Segoe UI', sans-serif;
    color: #23252a;
    pointer-events: none;
}

.gallery-nav-bar,
.gallery-nav-panel-inner {
    background: rgba(250, 249, 247, 0.72);
    backdrop-filter: blur(18px) saturate(1.4);
    -webkit-backdrop-filter: blur(18px) saturate(1.4);
    outline: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 8px 24px rgba(20, 22, 30, 0.12), 0 1px 2px rgba(20, 22, 30, 0.08);
    pointer-events: auto;
}

.gallery-nav-bar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px;
    border-radius: 999px;
    max-width: 100%;
}

.gallery-nav button {
    font: inherit;
    color: inherit;
    border: none;
    background: transparent;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
}

.gallery-nav-arrow {
    flex: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    transition: background-color 0.15s, transform 0.15s;
}

.gallery-nav-arrow:hover { background: rgba(0, 0, 0, 0.06); }
.gallery-nav-arrow:active { transform: scale(0.92); }

.gallery-nav-info {
    min-width: 0;
    height: 40px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 10px 0 6px;
    border-radius: 999px;
    transition: background-color 0.15s;
}

.gallery-nav-info:hover { background: rgba(0, 0, 0, 0.05); }

.gallery-nav-index {
    flex: none;
    min-width: 30px;
    height: 26px;
    padding: 0 6px;
    box-sizing: border-box;
    border-radius: 13px;
    display: grid;
    place-items: center;
    font-size: 13px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
    color: #fff;
    background: var(--gallery-nav-accent, var(--gallery-nav-accent-fallback));
    transition: background-color 0.3s;
}

.gallery-nav-title {
    min-width: 0;
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.gallery-nav-toggle {
    flex: none;
    display: grid;
    place-items: center;
    opacity: 0.55;
    transition: transform 0.25s, opacity 0.15s;
}

.gallery-nav-toggle svg { width: 18px; height: 18px; }
.gallery-nav-info:hover .gallery-nav-toggle { opacity: 0.9; }
.gallery-nav.expanded .gallery-nav-toggle { transform: rotate(180deg); }
.gallery-nav:not(.has-details) .gallery-nav-toggle { display: none; }

.gallery-nav-panel {
    width: 100%;
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    transform: translateY(6px);
    transition: grid-template-rows 0.3s ease, opacity 0.2s ease, transform 0.3s ease;
}

.gallery-nav.expanded.has-details .gallery-nav-panel {
    grid-template-rows: 1fr;
    opacity: 1;
    transform: none;
}

.gallery-nav-panel-inner {
    overflow: hidden;
    min-height: 0;
    border-radius: 18px;
}

.gallery-nav:not(.expanded) .gallery-nav-panel-inner { pointer-events: none; }

.gallery-nav-description {
    margin: 16px 18px 12px;
    font-size: 14px;
    line-height: 1.5;
}

.gallery-nav-features {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 18px 16px;
}

.gallery-nav-features:empty { display: none; }

.gallery-nav-features span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    padding: 6px 10px 6px 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.75);
    outline: 1px solid rgba(0, 0, 0, 0.07);
}

.gallery-nav-features span::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--gallery-nav-accent, var(--gallery-nav-accent-fallback));
}

.gallery-nav.changed .gallery-nav-title,
.gallery-nav.changed .gallery-nav-panel-inner > * {
    animation: gallery-nav-fade 0.35s ease;
}

@keyframes gallery-nav-fade {
    from { opacity: 0; transform: translateY(3px); }
    to { opacity: 1; transform: none; }
}

@media (max-width: 480px) {
    .gallery-nav { bottom: calc(env(safe-area-inset-bottom, 0px) + 80px); }
    .gallery-nav-title { font-size: 14px; }
    .gallery-nav-description { font-size: 13px; margin: 14px 14px 10px; }
    .gallery-nav-features { margin: 0 14px 14px; }
}
`;
