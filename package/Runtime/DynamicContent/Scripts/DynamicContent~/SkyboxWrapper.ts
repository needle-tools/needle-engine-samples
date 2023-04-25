import { Behaviour, RemoteSkybox, getComponent, getParam, serializable } from "@needle-tools/engine";

const param = getParam("skybox");

export class SkyboxWrapper extends Behaviour {

    @serializable(RemoteSkybox)
    remoteSkybox?: RemoteSkybox;

    public load() {

        this.apply("https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/1k/dam_wall_1k.exr");
    }

    public loadFromParam() {

        const url = param as string;

        if(url != null && url != "")
            this.apply(url);
    }

    private apply(url: string) {
        
        this.remoteSkybox?.setSkybox(url);
    }
}