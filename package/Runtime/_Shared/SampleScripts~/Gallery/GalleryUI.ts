import { Behaviour, EventList, FileReference, serializable } from "@needle-tools/engine";

export class GalleryUIItem {
    @serializable()
    name: string = "Name";

    @serializable(FileReference)
    icon?: FileReference;

    @serializable(EventList)
    click?: EventList;
}

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

    protected mainmenu?: Element;
    protected submenuRoot?: Element;
    protected submenu?: Element;
    protected submenuTitle?: Element;
    protected submenuContent?: Element;

    awake(): void {
        document.body.insertAdjacentHTML("afterbegin", `<style>${css}</style>`);
        document.body.insertAdjacentHTML("afterbegin", html);

        this.mainmenu = document.querySelector(".mainmenu")!;
        this.submenuRoot = document.querySelector(".submenu-wrapper")!;
        this.submenu = document.querySelector(".submenu")!;
        this.submenuTitle = document.querySelector(".submenu-title")!;
        this.submenuContent = document.querySelector(".submenu-content")!;

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
        const panelBtn = createPanelButton(item);

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

        // remove all nodes under this.submenuContent
        while (this.submenuContent?.firstChild) {
            this.submenuContent.removeChild(this.submenuContent.firstChild);
        }

        // add new content
        data.items.forEach(x => this.addItem(x));

        this.submenuRoot?.classList.remove("close");
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

const html = /* html */`
  <div class="mainmenu">
    <!-- Content -->
  </div>

  <div class="submenu-wrapper">
    <h2 class="submenu-title"></h2>
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
    z-index: 1;

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
    z-index: 1;

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