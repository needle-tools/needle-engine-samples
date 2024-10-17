import { Behaviour, serializable } from '@needle-tools/engine';

export class DragAndDropGalleryUI_Entry {

    @serializable()
    name: string = '';

    @serializable()
    url: string = '';
}

export class DragAndDropGalleryUI extends Behaviour {
    @serializable(DragAndDropGalleryUI_Entry)
    urls: DragAndDropGalleryUI_Entry[] = [];

    awake() {
        const style = document.createElement("style");
        style.innerHTML = this.css;
        this.context.domElement.appendChild(style);

        const divWrapper = document.createElement('div');
        divWrapper.classList.add('drag-and-drop-gallery-wrapper');

        const div = document.createElement('div');
        div.className = 'drag-and-drop-gallery';

        const title = document.createElement('p');
        title.innerText = 'Drag and drop these links:';
        title.style.fontSize = '1.6rem';
        title.style.margin = "0px";
        title.style.marginBottom = "8px";
        div.appendChild(title);

        this.urls.forEach(x => div.appendChild(this.createElement(x)));

        divWrapper.appendChild(div);
        this.context.domElement.appendChild(divWrapper);
    }

    createElement(data: DragAndDropGalleryUI_Entry): HTMLElement {
        const element = document.createElement('a');

        element.innerText = data.name;
        element.setAttribute("href", data.url);
        element.classList.add('drag-and-drop-gallery-element');

        return element;
    }

    private css: string = /* css */`
        .drag-and-drop-gallery-wrapper {
            display: flex;
            justify-content: center;
            top: 16px;
            position: absolute;
            width: 100%;
        }
        .drag-and-drop-gallery {
            top: 16px;
            left: 16px;
            right: 16px;

            width: fit-content;
            height: auto;

            padding-top: 16px;
            padding-bottom: 16px;
            padding-left: 32px;
            padding-right: 32px;

            z-index: 1;

            display: flex;
            flex-direction: column;
            align-items: center;
            
            background: rgba(229, 230, 233, 0.8);
            border-radius: 27px;
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            box-shadow: 0 0 4px rgba(2, 2, 43, 0.2);

            color: rgb(40, 40, 40);

            gap: 4px;

            font-size: 1.2rem;
            font-family: 'Roboto Flex', sans-serif;
            font-weight: 200;
            /* font-optical-sizing: auto; */
            /* font-variation-settings: "width" 100; */
        }

        .drag-and-drop-gallery-element {
            color: inherit;
            /* text-decoration: none; */
        }
    `;
}