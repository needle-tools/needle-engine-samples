import { AssetReference, Behaviour, Camera, DragControls, ObjectUtils, Renderer, Rigidbody, saveImage, screenshot2, serializable } from "@needle-tools/engine";
import { DataTexture, DoubleSide, MeshStandardMaterial, Object3D, Texture, TextureLoader } from "three";

export class Photographer extends Behaviour {

    @serializable(Camera)
    camera?: Camera;

    @serializable()
    width: number = 1024;

    @serializable()
    height: number = 1024;

    @serializable(AssetReference)
    prefab: AssetReference | null = null;

    takePhoto() {
        const photo = screenshot2({
            type: "texture",
            camera: this.camera,
            width: this.width,
            height: this.height,
        });

        if (this.prefab && photo instanceof Texture) {
            this.prefab.instantiate(this.scene).then(res => {
                if (!res) return;
                
                setTimeout(()=>{
                    res.destroy();
                }, 2000)


                res?.position.set(0, 3, 0);

                res?.getOrAddComponent(DragControls);

                const rb = res?.getComponentInChildren(Rigidbody);
                if (rb) {
                    rb.teleport(this.gameObject.worldPosition.add({ x: 0, y: .5, z: 0 }));
                    rb.setAngularVelocity(Math.random() - .5, Math.random() - .5, Math.random() * 2 - 1);
                    rb.applyImpulse(this.gameObject.worldForward.add({ x: 0, y: 2, z: 0 })
                        .normalize()
                        .multiplyScalar(this.context.time.deltaTime * .5));
                }

                const renderer = res?.getComponentInChildren(Renderer);
                if (renderer) {
                    const mat = renderer.sharedMaterial.clone() || new MeshStandardMaterial();
                    if (mat && "map" in mat) {
                        mat.map = photo;
                        mat.side = DoubleSide;
                    }
                    renderer.sharedMaterial = mat;
                }
            })
        }
    }
}