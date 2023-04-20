import { Behaviour } from "@needle-tools/engine";
import * as THREE from "three";
import { Camera } from "@needle-tools/engine";
import * as utils from "@needle-tools/engine";
import { serializeable } from "@needle-tools/engine";
const disableRT = utils.getParam("disableRT"); 

export class DisplayCameraView extends Behaviour {

    //@type(UnityEngine.Camera[])
    @serializeable(Camera)
    public views: Camera[] | null = null;

    public width : number = 256;
    public height : number = 256;

    // TODO add dropdown for emissive vs. diffuse
    private rtTexture: THREE.WebGLRenderTarget | null = null;
    private rtScene: THREE.Scene | null = null;
    private material: THREE.Material | null = null;

    awake(): void {
        if(disableRT) return;
        this.rtTexture = new THREE.WebGLRenderTarget(this.width, this.height, { encoding: THREE.sRGBEncoding });
        this.rtTexture.samples = 4;
        // necessary to match texture orientation from the exported meshes it seems
        this.rtTexture.texture.repeat.y = -1;
        this.rtTexture.texture.offset.y = 1;
        this.rtScene = this.context.scene;
    }

    lastChangeTime: number = 0;
    visibleDuration: number = 1;
    viewIndex: number = 0;

    onBeforeRender() {
        if(disableRT) return;

        if (this.rtTexture && this.rtTexture.texture) {
            const currentMaterial = this.gameObject["material"];
            if (this.material !== currentMaterial) {
                this.material = currentMaterial;
                if (this.material) {
                    this.material["emissiveMap"] = this.rtTexture.texture;
                    this.material["emissive"] = new THREE.Color(1,1,1);
                    // for custom shaders
                    if (this.material["uniforms"]) {
                        this.material["uniforms"]["_EmissionMap"] = { value: this.rtTexture.texture };
                    }
                }
            }
        }

        if (!this.material || this.views == null || this.views.length <= 0 || !this.rtScene) return;

        const rend = this.context.renderer as THREE.WebGLRenderer;

        if (this.context.time.time - this.lastChangeTime > this.visibleDuration) {
            this.enableNextCamera();
        }

        const currentCamera = this.views[this.viewIndex % this.views.length]?.cam;
        if (!currentCamera) {
            this.enableNextCamera();
            return;
        }

        // remove from parent because otherwise three complains about framebuffer loop if we render ourselves
        const prevParent = this.gameObject.parent;
        this.gameObject.removeFromParent();
        // disable xr for RT. Maybe there is a better way, but haven't noticed any side effects
        const xr = rend.xr.enabled;
        rend.xr.enabled = false;

        const rt = rend.getRenderTarget();
        rend.setRenderTarget(this.rtTexture);
        // rend.setScissor(0, 0, window.innerWidth, window.innerHeight);
        rend.render(this.rtScene, currentCamera);
        rend.setRenderTarget(rt);

        // reset state
        rend.xr.enabled = xr;
        if (prevParent) prevParent.add(this.gameObject);
    }

    private enableNextCamera() {
        this.viewIndex += 1;
        this.visibleDuration = Math.random() * 3 + 3;
        this.lastChangeTime = this.context.time.time;
    }
}
