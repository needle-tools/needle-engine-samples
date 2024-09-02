import { Behaviour, isMobileDevice, NeedleMenu, serializable } from "@needle-tools/engine";

export class TopMenu extends Behaviour {

    @serializable()
    onlyMobile: boolean = false;

    awake() {
        if (this.onlyMobile && !isMobileDevice()) return;

        const menu = this.gameObject.getComponent(NeedleMenu);
        if (menu) {
            menu.position = "top";
        }
    }
}