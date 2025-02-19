import { Application, Behaviour, serializable } from "@needle-tools/engine";



export class CarRadio extends Behaviour {

    @serializable()
    url: string = "https://stream.laut.fm/gta-classics";

    private _audio: HTMLAudioElement | null = null;


    onEnable(): void {
        if(!this.url) return;
        // const url = "https://stream.laut.fm/los-santos-radio";
        this._audio = new Audio(this.url);
        this._audio.autoplay = true;

        Application.registerWaitForInteraction(() => {
            if (!this.enabled) return;
            this._audio?.play();
        })
    }
    onDisable(): void {
        this._audio?.pause();
    }

}