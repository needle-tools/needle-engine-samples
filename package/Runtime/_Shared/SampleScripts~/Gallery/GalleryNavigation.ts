import { Behaviour, findObjectOfType, RGBAColor, serializable } from "@needle-tools/engine";
import { GalleryManager } from "./GalleryManager";
import { GalleryPOI } from "./GalleryPOI";

/** Previous and next buttons and the focused POI title in the Needle Menu. The title opens a panel with the POI description and features. */
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

    private panel?: HTMLElement;
    private description?: HTMLElement;
    private features?: HTMLElement;
    private prevButton?: HTMLElement;
    private nextButton?: HTMLElement;
    private infoButton?: HTMLButtonElement;
    private index?: HTMLElement;
    private title?: HTMLElement;
    private resizeObserver?: ResizeObserver;
    private removeFocusListener?: () => void;
    private expanded = false;

    awake(): void {
        if (!document.getElementById("gallery-nav-style"))
            document.head.insertAdjacentHTML("beforeend", `<style id="gallery-nav-style">${css}</style>`);

        this.panel = document.createElement("div");
        this.panel.classList.add("gallery-nav");
        this.panel.innerHTML = panelHtml;
        this.description = this.panel.querySelector(".gallery-nav-description")!;
        this.features = this.panel.querySelector(".gallery-nav-features")!;
        // keep presses on the panel from reaching the camera controls behind it
        for (const type of ["pointerdown", "pointerup", "pointermove", "wheel"])
            this.panel.addEventListener(type, e => e.stopPropagation());

        this.infoButton = document.createElement("button");
        this.infoButton.classList.add("gallery-nav-info");
        this.infoButton.setAttribute("aria-expanded", "false");
        this.infoButton.setAttribute("aria-label", "Show details");
        this.infoButton.innerHTML = infoHtml;
        this.index = this.infoButton.querySelector(".gallery-nav-index")!;
        this.title = this.infoButton.querySelector(".gallery-nav-title")!;
        this.infoButton.addEventListener("click", () => this.setExpanded(!this.expanded));

        this.setExpanded(this.startExpanded);
    }

    onEnable(): void {
        this.manager ??= findObjectOfType(GalleryManager)!;
        if (!this.manager || !this.panel || !this.infoButton) return;

        // low priorities sit on the left of the menu, ahead of the built-in buttons
        const menu = this.context.menu;
        this.prevButton = menu.appendChild({
            label: "",
            title: "Previous",
            icon: "chevron_left",
            onClick: () => this.manager?.focusPrevious(),
            priority: -2000,
        }) as HTMLElement;
        this.infoButton.setAttribute("priority", "-1999");
        menu.appendChild(this.infoButton);
        this.nextButton = menu.appendChild({
            label: "",
            title: "Next",
            icon: "chevron_right",
            onClick: () => this.manager?.focusNext(),
            priority: -1998,
        }) as HTMLElement;

        this.context.domElement.appendChild(this.panel);
        this.resizeObserver = new ResizeObserver(() => this.positionPanel());
        this.resizeObserver.observe(this.infoButton);
        this.resizeObserver.observe(this.context.domElement);

        this.removeFocusListener = this.manager.addFocusListener((poi, index) => this.show(poi, index));
        const index = this.manager.selectedIndex;
        const poi = this.manager.pois[index];
        if (poi) this.show(poi, index);
    }

    onDisable(): void {
        this.removeFocusListener?.();
        this.removeFocusListener = undefined;
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;
        this.prevButton?.remove();
        this.nextButton?.remove();
        this.infoButton?.remove();
        this.panel?.remove();
    }

    setExpanded(expanded: boolean) {
        this.expanded = expanded;
        this.panel?.classList.toggle("expanded", expanded);
        this.infoButton?.classList.toggle("expanded", expanded);
        this.infoButton?.setAttribute("aria-expanded", String(expanded));
        this.positionPanel();
    }

    /** Anchors the panel to the title button, above the menu when the menu is in the lower half and below it otherwise. */
    private positionPanel() {
        const panel = this.panel;
        const button = this.infoButton;
        if (!panel || !button) return;
        const bounds = this.context.domElement.getBoundingClientRect();
        const rect = button.getBoundingClientRect();
        // a button that is not rendered, like one folded into the compact menu, leaves the panel at its default place
        if (rect.width === 0 || bounds.width === 0) {
            panel.style.removeProperty("--gallery-nav-left");
            panel.style.removeProperty("--gallery-nav-top");
            panel.style.removeProperty("--gallery-nav-bottom");
            return;
        }
        const half = Math.min(220, bounds.width / 2 - 16);
        const center = rect.left + rect.width / 2 - bounds.left;
        panel.style.setProperty("--gallery-nav-left", `${Math.max(half + 16, Math.min(bounds.width - half - 16, center))}px`);
        const below = rect.top + rect.height / 2 - bounds.top < bounds.height / 2;
        panel.style.setProperty("--gallery-nav-top", below ? `${rect.bottom - bounds.top + 8}px` : "auto");
        panel.style.setProperty("--gallery-nav-bottom", below ? "auto" : `${bounds.bottom - rect.top + 8}px`);
    }

    private show(poi: GalleryPOI, index: number) {
        if (!this.panel || !this.infoButton) return;
        const count = this.manager?.pois.length ?? 0;
        this.index!.textContent = String(index + 1).padStart(2, "0");
        this.index!.title = `${index + 1} / ${count}`;
        const accent = this.accentColors.length ? this.accentColors[index % this.accentColors.length] : undefined;
        const accentColor = accent ? `#${accent.getHexString()}` : "";
        this.panel.style.setProperty("--gallery-nav-accent", accentColor);
        this.infoButton.style.setProperty("--gallery-nav-accent", accentColor);
        this.title!.textContent = poi.title.trim();
        this.infoButton.title = poi.title.trim();
        this.description!.textContent = poi.description;
        this.features!.replaceChildren(...poi.features.map(name => {
            const tag = document.createElement("span");
            tag.textContent = name;
            return tag;
        }));
        const hasDetails = !!poi.description || poi.features.length > 0;
        this.panel.classList.toggle("has-details", hasDetails);
        this.infoButton.classList.toggle("has-details", hasDetails);

        // restart the fade-in for the new content
        for (const element of [this.panel, this.infoButton]) {
            element.classList.remove("changed");
            void element.offsetWidth;
            element.classList.add("changed");
        }
    }
}

const chevron = /* html */`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>`;

const infoHtml = /* html */`
    <span class="gallery-nav-index"></span>
    <span class="gallery-nav-title"></span>
    <span class="gallery-nav-toggle">${chevron}</span>
`;

const panelHtml = /* html */`
    <div class="gallery-nav-panel-inner">
        <p class="gallery-nav-description"></p>
        <div class="gallery-nav-features"></div>
    </div>
`;

const css = /* css */`
.gallery-nav {
    --gallery-nav-accent-fallback: #2a2d33;
    position: absolute;
    left: var(--gallery-nav-left, 50%);
    top: var(--gallery-nav-top, auto);
    /* without an anchor the panel sits above the menu */
    bottom: var(--gallery-nav-bottom, calc(env(safe-area-inset-bottom, 0px) + 88px));
    transform: translateX(-50%);
    width: min(440px, calc(100% - 32px));
    z-index: 2;
    font-family: 'Roboto Flex', system-ui, -apple-system, 'Segoe UI', sans-serif;
    color: #23252a;
    pointer-events: none;
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    transition: grid-template-rows 0.3s ease, opacity 0.2s ease;
}

.gallery-nav.expanded.has-details {
    grid-template-rows: 1fr;
    opacity: 1;
}

.gallery-nav-panel-inner {
    overflow: hidden;
    min-height: 0;
    border-radius: 18px;
    background: rgba(250, 249, 247, 0.72);
    backdrop-filter: blur(18px) saturate(1.4);
    -webkit-backdrop-filter: blur(18px) saturate(1.4);
    outline: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 8px 24px rgba(20, 22, 30, 0.12), 0 1px 2px rgba(20, 22, 30, 0.08);
}

.gallery-nav.expanded.has-details .gallery-nav-panel-inner { pointer-events: auto; }

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

/* the title button inside the Needle Menu, which styles its direct children */
.gallery-nav-info {
    display: flex;
    align-items: center;
    gap: 10px;
    font: inherit;
}

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
    /* fixed, so the arrows stay put whatever the title */
    width: 11rem;
    max-width: 40vw;
    text-align: left;
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

.gallery-nav-info:hover .gallery-nav-toggle { opacity: 0.9; }
.gallery-nav-info.expanded .gallery-nav-toggle { transform: rotate(180deg); }
.gallery-nav-info:not(.has-details) .gallery-nav-toggle { display: none; }
.gallery-nav-info:not(.has-details) { cursor: default; }

.gallery-nav.changed .gallery-nav-panel-inner > *,
.gallery-nav-info.changed .gallery-nav-title {
    animation: gallery-nav-fade 0.35s ease;
}

@keyframes gallery-nav-fade {
    from { opacity: 0; transform: translateY(3px); }
    to { opacity: 1; transform: none; }
}

@media (max-width: 480px) {
    .gallery-nav-title { font-size: 14px; }
    .gallery-nav-description { font-size: 13px; margin: 14px 14px 10px; }
    .gallery-nav-features { margin: 0 14px 14px; }
}
`;
