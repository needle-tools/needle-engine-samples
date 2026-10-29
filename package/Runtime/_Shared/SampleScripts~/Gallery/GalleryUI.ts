import { Behaviour, EventList, FileReference, ImageReference, serializable } from "@needle-tools/engine";

// declared by hand in GalleryUI.cs
//@dont-generate-component
export class GalleryUIItem {
    @serializable()
    name: string = "Name";

    @serializable(FileReference)
    icon?: FileReference;

    @serializable(EventList)
    click?: EventList;

    /** Image shown in the preview view of the menu. The view can only be picked in categories with at least one preview. */
    @serializable(ImageReference)
    preview?: ImageReference;
}

// declared by hand in GalleryUI.cs
//@dont-generate-component
export class GalleryUICategory {
    @serializable()
    title: string = "Title";

    @serializable(FileReference)
    icon?: FileReference;

    @serializable(EventList)
    select?: EventList;

    @serializable(EventList)
    deselect?: EventList;

    @serializable(GalleryUIItem)
    items: GalleryUIItem[] = [];
}

export class GalleryUI extends Behaviour {
    @serializable(GalleryUICategory)
    categories: GalleryUICategory[] = [];

    /** Open categories with preview images in the preview view. A view the visitor picked in the menu is remembered and wins. */
    @serializable()
    startWithPreviews: boolean = false;

    /** Width of the menu in px while it shows previews. Narrowed to fit the page. 0 keeps the width of the list. */
    @serializable()
    previewMenuWidth: number = 0;

    /** Smallest width of a preview in px. The menu fits as many columns as its width allows, and the previews share the rest of the row. */
    @serializable()
    previewMinWidth: number = 120;

    /** Height of a preview image in px, cropped to fit. 0 keeps the 16:9 shape of rendered previews. */
    @serializable()
    previewHeight: number = 0;

    protected mainmenu?: Element;
    protected submenuRoot?: Element;
    protected submenu?: Element;
    protected submenuTitle?: Element;
    protected submenuContent?: Element;
    protected viewButtons: HTMLButtonElement[] = [];

    awake(): void {
        document.body.insertAdjacentHTML("afterbegin", `<style>${css}</style>`);
        document.body.insertAdjacentHTML("afterbegin", html);

        this.mainmenu = document.querySelector(".mainmenu")!;
        this.submenuRoot = document.querySelector(".submenu-wrapper")!;
        this.submenu = document.querySelector(".submenu")!;
        this.submenuTitle = document.querySelector(".submenu-title")!;
        this.submenuContent = document.querySelector(".submenu-content")!;
        const wrapper = this.submenuRoot as HTMLElement;
        if (this.previewMenuWidth > 0) wrapper.style.setProperty("--gallery-preview-menu-width", `${this.previewMenuWidth}px`);
        if (this.previewMinWidth > 0) wrapper.style.setProperty("--gallery-preview-min-width", `${this.previewMinWidth}px`);
        if (this.previewHeight > 0) {
            wrapper.style.setProperty("--gallery-preview-height", `${this.previewHeight}px`);
            wrapper.style.setProperty("--gallery-preview-aspect", "auto");
        }
        this.viewButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".submenu-view button"));
        for (const button of this.viewButtons) {
            button.onclick = () => {
                const previews = button.dataset.view === "previews";
                try { localStorage.setItem(viewStorageKey, previews ? "previews" : "list"); } catch { }
                this.showPreviews = previews;
                if (this.selectedCategory) this.showItems(this.selectedCategory);
            };
        }

        this.categories.forEach(x => this.addCategory(x));
        this.hideSubmenu();
    }

    /** Add a new category to data and apply it to html.
     * Purpose is to give abbility to extend the menu during runtime / anytime after this script's awake.
     */
    addNewCategory(category: GalleryUICategory) {
        this.categories.push(category);
        this.addCategory(category);
    }

    protected addCategory(category: GalleryUICategory) {
        if (!this.mainmenu) return;
        const navBtn = createNavButton(category);
        
        this.mainmenu.appendChild(navBtn);
        navBtn.onclick = () => { 
            if (this.selectedCategory === category) {
                this.hideSubmenu();
            }
            else {
                this.showSubmenu(category);
            }
        };
    }

    protected addItem(item: GalleryUIItem) {
        if (!this.submenuContent) return;
        const panelBtn = this.submenuContent.classList.contains("previews") ? createPreviewButton(item) : createPanelButton(item);

        this.submenuContent.appendChild(panelBtn);
        panelBtn.onclick = () => { 
            item.click?.invoke();
        };
    }

    protected selectedCategory?: GalleryUICategory;
    protected showSubmenu(data: GalleryUICategory) {
        this.selectedCategory = data;
        this.selectedCategory?.select?.invoke();

        if (this.submenuTitle) {
            this.submenuTitle.textContent = data.title;
        }

        this.showItems(data);
        this.submenuRoot?.classList.remove("close");
    }

    private _showPreviews?: boolean;
    /** Whether categories with preview images show them. */
    get showPreviews(): boolean {
        if (this._showPreviews === undefined) {
            let stored: string | null = null;
            try { stored = localStorage.getItem(viewStorageKey); } catch { }
            this._showPreviews = stored ? stored === "previews" : this.startWithPreviews;
        }
        return this._showPreviews;
    }
    set showPreviews(value: boolean) { this._showPreviews = value; }

    protected showItems(data: GalleryUICategory) {
        // remove all nodes under this.submenuContent
        while (this.submenuContent?.firstChild) {
            this.submenuContent.removeChild(this.submenuContent.firstChild);
        }

        const hasPreviews = data.items.some(x => x.preview);
        const previews = hasPreviews && this.showPreviews;
        this.submenuRoot?.classList.toggle("has-previews", hasPreviews);
        this.submenuRoot?.classList.toggle("previews", previews);
        this.submenuContent?.classList.toggle("previews", previews);
        for (const button of this.viewButtons) {
            const active = (button.dataset.view === "previews") === previews;
            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
        }

        // add new content
        data.items.forEach(x => this.addItem(x));
    }

    protected hideSubmenu() {
        this.selectedCategory?.deselect?.invoke();
        this.selectedCategory = undefined;

        // remove all nodes under this.submenuContent
        while (this.submenuContent?.firstChild) {
            this.submenuContent?.removeChild(this.submenuContent.firstChild);
        }

        this.submenuRoot?.classList.add("close");
    }
}

const viewStorageKey = "needle-gallery-ui-view";

const defaultIcon = "https://upload.wikimedia.org/wikipedia/commons/2/21/City_locator_4.svg";
const createNavButton = (data: GalleryUICategory) => {
    const button = document.createElement("button");
    button.classList.add("room");
    button.classList.add("open-submenu");
    button.innerHTML = /* html */`
        <button class="open-submenu">
            <span class="icon">
                <img src=${data.icon?.url ?? defaultIcon} alt=${data.title ?? "?"}>
            </span>
        </button>
    `;

    return button;
};

const createPanelButton = (data: GalleryUIItem) => {
    const button = document.createElement("button");
    button.classList.add("submenu-button");

    const img = /* html */`
        <img src=${data.icon?.url} alt=${data.name ?? "?"}>
    `;
    const a = /* html */`
        <a>${data.name}</a>
    `
    if (data.icon) {
        button.innerHTML += img;
    }

    button.innerHTML += a;

    return button;
};

const createPreviewButton = (data: GalleryUIItem) => {
    const button = document.createElement("button");
    button.classList.add("submenu-button", "submenu-card");

    const frame = document.createElement("span");
    frame.classList.add("submenu-card-image");
    const url = data.preview?.url ?? data.icon?.url;
    if (url) {
        const img = document.createElement("img");
        img.src = url;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        if (!data.preview) img.classList.add("icon");
        frame.appendChild(img);
    }
    button.appendChild(frame);

    const label = document.createElement("span");
    label.classList.add("submenu-card-label");
    label.textContent = data.name;
    button.appendChild(label);
    button.title = data.name;

    return button;
};

const listIcon = /* html */`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>`;
const gridIcon = /* html */`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>`;

const html = /* html */`
  <div class="mainmenu">
    <!-- Content -->
  </div>

  <div class="submenu-wrapper">
    <h2 class="submenu-title"></h2>
    <div class="submenu-view" role="group" aria-label="View">
        <button data-view="list" aria-label="List" title="List">${listIcon}</button>
        <button data-view="previews" aria-label="Previews" title="Previews">${gridIcon}</button>
    </div>
    <div class="submenu">
        <div class="submenu-content">
            <!-- Content -->
        </div>
    </div>
  </div>
`;

const css = /* css */`
.mainmenu {
    position: absolute;
    top: 16px;
    right: 16px;
    display: flex;
    padding: 4px;
    flex-direction: column;
    align-items: center;
    background: rgba(229, 230, 233, 0.8);
    border-radius: 50%;
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    box-shadow: 0 0 4px rgba(2, 2, 43, 0.2);
    /* above the content slot of needle-engine (500), which holds HTML overlays of the scene, below the Needle menu */
    z-index: 501;

    /* default font settings */
    font-size: 1rem;
    font-family: 'Roboto Flex', sans-serif;
    /* font-optical-sizing: auto; */
    /* font-variation-settings: "width" 100; */
    color: rgb(40, 40, 40);
}

.mainmenu button {
    width: 42px;
    height: 42px;
    border: none;
    border-radius: 50%;
    background: transparent;
    transition: background-color 0.5s;
    outline: rgba(0, 0, 0, 0) 1px solid;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
}

.mainmenu button.active,
.mainmenu button:hover {
    background: rgba(245, 245, 245, .8);
    transition: all 0.1s linear .02s;
    outline: rgba(0, 0, 0, .05) 1px solid;
}

.mainmenu button.active img,
.mainmenu button:hover img
{
    /* filter: invert(100%) sepia(0%) saturate(7478%) hue-rotate(317deg) brightness(109%) contrast(99%); */
}

.mainmenu button img {
    width: 32px;
    height: 32px;
}

.mainmenu button .state-icon {
    position: absolute;
    top: 9px;
    left: 11px;
    width: 32px; 
    height: 32px; 
    background-size: cover;
    background-repeat: no-repeat;
    pointer-events: none; 
    filter: invert(61%) sepia(85%) saturate(1169%) hue-rotate(92deg) brightness(92%) contrast(86%);
}

.mainmenu button.active .state-icon,
.mainmenu button:hover .state-icon
{
    filter: invert(61%) sepia(85%) saturate(1169%) hue-rotate(92deg) brightness(92%) contrast(86%);
}

/*Submenu*/
.submenu-wrapper {
    position: absolute;
    top: 16px;
    right: calc(70px + 10px);
    width: 333px;
    max-height: 60vh;
    padding: 22px;
    z-index: 501;

    background: #ffffff5c;
    border: 1px solid rgba(255, 255, 255, .1);
    border-radius: 1.1999rem;
    outline: rgb(0 0 0 / 5%) 1px solid;
    box-shadow: 0px 7px 0.5rem 0px rgb(0 0 0 / 6%), inset 0px 0px 1.3rem rgba(0, 0, 0, .05);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);

    overflow: hidden;
}

.submenu {
    overflow-x: hidden;
    overflow-y: scroll;
    max-height: calc(60vh - 22px * 2);
    font-family: 'Roboto Flex', sans-serif;
}

/* width */
.submenu::-webkit-scrollbar {
    scrollbar-color: #ff0000;
    width: 5px;
}

/* Track */
.submenu::-webkit-scrollbar-track {
    background: #8880;
    margin-right: 20px;
}

/* Handle */
.submenu::-webkit-scrollbar-thumb {
    background: #8888;
    border-radius: 10px; /* Rounded corners */
    margin: 0 8px; /* Offset the track to move the thumb left */
}

/* Handle on hover */
.submenu::-webkit-scrollbar-thumb:hover {
    background: #555A;
}

.submenu-title {
    color: #282828;
    font-size: 22px;
    font-weight: 800;
    line-height: 32px;
    margin-bottom: 16px;
    margin-top: 0px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    border-bottom: 1px solid rgba(40, 40, 40, .4);
    font-family: 'Roboto Flex', sans-serif;
}

.submenu-button {
    height: 1.8rem;
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-size: 1rem;
    line-height: 32px;
    border: none;
    cursor: pointer;
    font-family: 'Roboto Flex', sans-serif;
    font-weight: 200;
    width: 100%;
    
    background: transparent;
    outline: rgba(0, 0, 0, 0) 1px solid;
    border-radius: 0.8rem;
}

.submenu-button:hover { 
    background: rgba(245, 245, 245, .8);
    transition: all 0.1s linear .02s;
    outline: rgba(0, 0, 0, .05) 1px solid;
}

.submenu-button img {
    width: 32px;
    height: 32px;
    margin-right: 6px;
    margin-left: -6px;
}

.submenu-button a {
    color: #282828;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
}

.submenu-content img {
    max-width: 100%;
    height: auto;
    margin-right: 6px;
}

.special {
    display: flex;
    align-items: center;
    margin-top: 16px;
    font-size: 13px;
    line-height: 20px;
    color: #919191;
    border: none;
    background: none;
}

.special img {
    width: 16px;
    height: 16px;
    filter: invert(61%) sepia(85%) saturate(1169%) hue-rotate(92deg) brightness(92%) contrast(86%);
}

.submenu-wrapper.close {
    display: none;
}

.submenu-view {
    position: absolute;
    top: 22px;
    right: 22px;
    display: none;
    gap: 2px;
    padding: 2px;
    border-radius: 10px;
    background: rgba(0, 0, 0, .05);
}

.submenu-wrapper.has-previews .submenu-view { display: flex; }

/* the page width minus the main menu, a 16px margin, the padding and the border */
.submenu-wrapper.previews { width: min(var(--gallery-preview-menu-width, 333px), calc(100vw - 142px)); }
.submenu-wrapper.has-previews .submenu-title { padding-right: 72px; }

.submenu-view button {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    padding: 0;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: rgba(40, 40, 40, .55);
    cursor: pointer;
    transition: background-color 0.1s, color 0.1s;
}

.submenu-view button:hover { color: #282828; }

.submenu-view button.active {
    background: rgba(255, 255, 255, .9);
    color: #282828;
    box-shadow: 0 1px 2px rgba(0, 0, 0, .12);
}

.submenu-content.previews {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(var(--gallery-preview-min-width, 120px), 100%), 1fr));
    gap: 10px;
    padding-right: 8px;
}

.submenu-content.previews .submenu-card {
    height: auto;
    margin: 0;
    padding: 4px;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    line-height: 1.2;
}

.submenu-card-image {
    display: block;
    aspect-ratio: var(--gallery-preview-aspect, 16 / 9);
    height: var(--gallery-preview-height, auto);
    border-radius: 0.6rem;
    overflow: hidden;
    background: rgba(0, 0, 0, .06);
}

.submenu-content.previews .submenu-card img {
    display: block;
    width: 100%;
    height: 100%;
    max-width: none;
    margin: 0;
    object-fit: cover;
}

.submenu-content.previews .submenu-card img.icon {
    width: 40%;
    margin: 0 auto;
    object-fit: contain;
    opacity: .5;
}

.submenu-card-label {
    padding: 0 2px 2px;
    font-size: 13px;
    font-weight: 400;
    color: #282828;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

@media screen and (max-width: 768px) {
    .mainmenu {
        width: 42px;
        height: auto;
        padding-bottom: 2px;
    }

    .mainmenu button {
        width: 32px;
        height: 32px;
    }

    .mainmenu button img {
        width: 24px;
        height: 24px;
    }

    .mainmenu button .state-icon {
        position: absolute;
        top: 9px;
        left: 9px;
        width: 24px; 
        height: 24px; 
    }

    .submenu-wrapper {
        right: calc(60px + 5px);
        width: 256px;
        border-radius: 21px;
        padding: 16px;
        max-height: 40vh;
    }

    .submenu {
        max-height: calc(40vh - 16px * 2);
    }

    .submenu-title {
        font-size: 18px;
        line-height: 28px;
        margin-bottom: 10px;
    }

    .submenu-view { top: 16px; right: 16px; }
    .submenu-view button { width: 24px; height: 24px; }
    .submenu-wrapper.previews { width: min(var(--gallery-preview-menu-width, 256px), calc(100vw - 115px)); }
    .submenu-content.previews { gap: 6px; }
    .submenu-card-label { font-size: 12px; }

    .submenu-button {
        margin-bottom: 6px;
        /* font-size: 1.3rem; */
        line-height: 24px;
    }

    .submenu-button img {
        width: 24px;
        height: 24px;
    }

    .special {
        margin-top: 10px;
        font-size: 11px;
    }

    .special img {
        width: 10px;
        height: 10px;
    }
}`;