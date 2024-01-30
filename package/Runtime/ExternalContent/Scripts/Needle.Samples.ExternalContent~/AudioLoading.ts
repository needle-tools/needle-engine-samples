import { AudioSource, Behaviour, getParam, serializable, setParamWithoutReload } from "@needle-tools/engine";

export class AudioLoading extends Behaviour {
    @serializable(AudioSource)
    audioSource?: AudioSource;

    // @type UnityEngine.AudioClip
    @serializable(URL)
    defaultAudio?: string;

    load() {
        if(this.defaultAudio && this.defaultAudio != "")
            this.downloadAndApply(this.defaultAudio);
    }

    loadFromParam() {
        const url = getParam("audio") as string
        if (url && url != "")
            this.downloadAndApply(url);
    }

    async downloadAndApply(url: string) {
        if (!this.audioSource) {
            this.audioSource = this.gameObject.addNewComponent(AudioSource)!;
        }

        this.audioSource.clip = url;
        this.audioSource.stop();
        this.audioSource.play();

        setParamWithoutReload("audio", url);
    }
}