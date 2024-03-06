import { Behaviour, GameObject, OrbitControls, Text, serializable } from "@needle-tools/engine";

export class CameraGoal extends Behaviour {
    @serializable()
    createMenuButton: boolean = false;

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

    /** the menu button for this LOD level */
    private menuButton: HTMLElement | null = null;

    addButton() {
        if (this.menuButton) this.removeButton();

        const textValue = this.gameObject.getComponentInChildren(Text)?.text ?? this.gameObject.name;

        const btn = document.createElement("button");
        this.menuButton = btn;
        btn.innerText = textValue.replace("_", " ");
        btn.setAttribute("priority", "40");
        btn.addEventListener("click", () => this.use());
        this.context.menu.appendChild(btn);
    }

    removeButton() {
        if (this.menuButton) {
            this.menuButton.remove();
            this.menuButton = null;
        }
    }

    use() {
        this.orbitalCamera?.setCameraTargetPosition(this.worldPosition);
    }
}