import { Behaviour, Renderer, Watch, getComponent } from "@needle-tools/engine";
import { MeshStandardMaterial } from "three";

export class SkyboxPreviewer extends Behaviour {

    private watch : Watch | null = null;

    awake() {

        this.previewCurrent();

        this.watch = new Watch(this.context.scene, "environment");
        
        this.watch.subscribeWrite(_ => {
            this.previewCurrent();
        });
    }
        
    previewCurrent() {
        
        const ren = getComponent(this.gameObject, Renderer) as Renderer;
        if(ren)
            ren.sharedMaterial["map"] = this.context.scene.environment;
    }
    
}