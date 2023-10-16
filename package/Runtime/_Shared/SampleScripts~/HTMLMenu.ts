import { Behaviour, EventList, serializable } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

export class HTMLMenu extends Behaviour {

    @serializable(EventList)
    methods: Array<EventList>;

    @serializable()
    names: Array<string>;
    
    private wrapper?: HTMLUListElement;
    private styleElement?: HTMLStyleElement;

    private static style = `
        .needle-menu {
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 100;
            list-style-type: none;
            margin: 0;
            overflow: hidden;
            background-color: white;
            display: flex;
            padding: 5px;
            border-radius: 20px;
        }

        .needle-menu li button {
            padding: 5px;
            margin: 0 5px;
            background: none;
            outline: none;
            border: 0;
            cursor: pointer;
        }

        .needle-menu li button:hover {
            font-weight: bold;
        }
    `;

    onEnable(): void {

        console.log("HTMLMenu.onEnable" )

        // make html div with a bunch of buttons
        this.wrapper = document.createElement("ul");
        this.wrapper.classList.add("needle-menu");

        // for with index
        for (let i = 0; i < this.methods.length; i++) {
            const method = this.methods[i];
            let niceName = "Button";
            if (i < this.names?.length)
                niceName = this.names[i];
            const li = document.createElement("li");
            const buttonElement = document.createElement("button");
            buttonElement.innerHTML = niceName;
            buttonElement.onclick = () => {
                method.invoke();
            }
            li.appendChild(buttonElement);
            this.wrapper.appendChild(li);
        }
        
        this.styleElement = document.createElement("style");
        this.styleElement.innerHTML = HTMLMenu.style;
        document.head.appendChild(this.styleElement);
        this.context.domElement.appendChild(this.wrapper);
    }

    onDisable(): void {
        // remove html div
        if (this.wrapper) {
            this.wrapper.remove();
            this.wrapper = undefined;
        }
        if (this.styleElement) {
            this.styleElement.remove();
            this.styleElement = undefined;
        }
    }
}