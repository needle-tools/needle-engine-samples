import { Behaviour, LogType, serializable, showBalloonMessage } from "@needle-tools/engine";

export class ShowBalloonMessage extends Behaviour {
    @serializable()
    text: string = "";

    start() {
        showBalloonMessage(this.text)
    }
}