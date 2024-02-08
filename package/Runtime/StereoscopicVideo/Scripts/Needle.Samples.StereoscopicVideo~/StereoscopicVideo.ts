import { Behaviour, NeedleXREventArgs, VideoPlayer, serializable } from "@needle-tools/engine";
import * as THREE from "three";

export class StereoscopicVideo extends Behaviour {
    @serializable(VideoPlayer)
    videoPlayer: VideoPlayer;

    onEnterXR(args: NeedleXREventArgs): void {
        args.xr.allowEyeLayers = true;
    }

    start(): void {
        this.videoPlayer ??= this.gameObject.getComponent(VideoPlayer)!;
        
        const tex = this.videoPlayer.videoTexture!;
        const left = this.createSphere(false, tex);
        const right = this.createSphere(true, tex);

        this.gameObject.add(left, right);
    }

    private createSphere(isLeft: boolean, texture: THREE.Texture): THREE.Mesh {
        const sphere = new THREE.SphereGeometry(500, 60, 40);
        // invert the geometry on the x-axis so that all of the faces point inward
        sphere.scale(-1, -1, 1);

        const uvs1 = sphere.attributes.uv.array;
        for (let i = 0; i < uvs1.length; i += 2) {
            uvs1[i] *= 0.5;
            if (!isLeft) {
                uvs1[i] += 0.5;
            }
        }

        const mat = new THREE.MeshBasicMaterial({ map: texture});
        mat.side = THREE.DoubleSide;
        const mesh = new THREE.Mesh(sphere, mat);
        mesh.rotation.y = - Math.PI / 2;
        mesh.position.copy(new THREE.Vector3(0, 0, 0));
        mesh.layers.set(isLeft ? 1 : 2); // display in left eye only

        return mesh;
    }
}