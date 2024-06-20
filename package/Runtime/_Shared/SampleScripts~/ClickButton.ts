import { Behaviour, Button, serializable } from "@needle-tools/engine";

export class ClickButton extends Behaviour {
    @serializable(Button)
    buttonToClick?: Button;

    click() {
        this.buttonToClick?.onClick?.invoke();
    }
}