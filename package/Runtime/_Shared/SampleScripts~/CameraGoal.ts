import { Behaviour, GameObject, OrbitControls, Text, serializable } from "@needle-tools/engine";

export class CameraGoal extends Behaviour {
    @serializable()
    createMenuButton: boolean =  false;

    private _orbitalCamera?: OrbitControls;
    private get orbitalCamera() {
        this._orbitalCamera ??= GameObject.findObjectOfType(OrbitControls)!;
        return this._orbitalCamera;
    }

    awake() {
        if (this.createMenuButton) {
            this.addButton();
        }
    }

    private static buttonsCounts: number = 0;

    private menuButton: HTMLElement | null = null;
    private divElem: HTMLElement | null = null;
    addButton() {
        if (this.menuButton) this.removeButton();

        const textValue = this.gameObject.getComponentInChildren(Text)?.text ?? this.gameObject.name;;

        if (CameraGoal.buttonsCounts == 0) {
            const div = document.createElement("div");
            div.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
            div.style.minWidth = "1px";
            div.style.margin = "10px";
            div.setAttribute("priority", "41");
            this.context.menu.appendChild(div);
            this.divElem = div;
        }

        const btn = document.createElement("button");
        btn.innerText = textValue; 
        btn.setAttribute("priority", "40");
        btn.addEventListener("click", () => this.use());
        this.context.menu.appendChild(btn);
        this.menuButton = btn;

        CameraGoal.buttonsCounts++;
    }

    removeButton() {
        if (this.menuButton) {
            this.menuButton.remove();
            this.menuButton = null;
            CameraGoal.buttonsCounts--;
        }

        if (CameraGoal.buttonsCounts == 0 && this.divElem) {
            this.divElem.remove();
            this.divElem = null;
        }
    }

    use() {
        this.orbitalCamera?.setCameraTargetPosition(this.worldPosition);
    }
}