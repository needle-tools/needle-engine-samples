import { Behaviour, GameObject, SceneSwitcher } from "@needle-tools/engine";

export class SceneSwitcherControls extends Behaviour {
    private switcher?: SceneSwitcher;
    next() {
        this.switcher ??= this.get();
        console.log(this.switcher);
        this.switcher?.selectNext();
    }

    previous() {
        this.switcher ??= this.get();
        this.switcher?.selectPrev();
    }

    private get(): SceneSwitcher {
        return GameObject.findObjectOfType(SceneSwitcher)!;
    }
}