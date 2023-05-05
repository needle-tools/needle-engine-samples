import { Behaviour, RemoteSkybox, getComponent, getParam, serializable, setParamWithoutReload } from "@needle-tools/engine";


export class SkyboxWrapper extends Behaviour {

    @serializable(RemoteSkybox)
    remoteSkybox?: RemoteSkybox;

    start(): void {
        this.loadFromParam();   
    }

    public load() {

        this.apply("https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/1k/dam_wall_1k.exr");
    }

    public loadFromParam() {

        const url = getParam("skybox") as string;

        if (url != null && url != "")
            this.apply(url);
    }

    private apply(url: string) {

        this.remoteSkybox?.setSkybox(url);
        setParamWithoutReload("skybox", url);
    }
}