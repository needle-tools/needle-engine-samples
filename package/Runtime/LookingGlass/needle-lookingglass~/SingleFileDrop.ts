import { Behaviour, DropListener, getOrAddComponent, Animation, OrbitControls, getComponent } from "@needle-tools/engine";
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Documentation → https://docs.needle.tools/scripting

export class SingleFileDrop extends Behaviour {
    
    start() {
        const drop = this.gameObject.getComponent(DropListener);
        drop?.addEventListener('object-added', (evt : any) => {

            const data = evt.detail as GLTF;

            // clear all children, re-add the new one
            // NOTE: in production, old objects should be properly desytroyed and freed instead of just clearing.
            this.gameObject.clear();
            const newObject = data.scene;
            // necessary because Looking Glass overwrites the rotation again, so the scene itself needs to be flipped right now...
            newObject.rotateY(Math.PI);
            this.gameObject.add(newObject);

            // play the first animation as loop
            if (data.animations?.length > 0) {
                const animation = getOrAddComponent(newObject, Animation);
                animation.animations = data.animations;
                animation.play(animation.animations[0], { loop: true });
            }

            // fit the camera to the new object
            // get OrbitControls from mainCamera
            const orbitControls = getComponent(this.context.mainCamera!, OrbitControls);
            if (orbitControls)
                orbitControls.fitCameraToObjects([this.gameObject], 1.3);
        });

        // create centered p element
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.top = "15px";
        div.style.width = "100%";
        div.style.pointerEvents = "none";
        div.style.opacity = "0.75";
        div.style.display = 'flex';

        const p = document.createElement('p');
        p.style.pointerEvents = "initial";
        p.innerHTML = `Drop .glb files to view them<br/>Drop <a href="https://polyhaven.com/hdris" target="_blank">PolyHaven HDRI</a> image previews`;
        p.style.textAlign = 'center';
        p.style.margin = 'auto';
        p.style.width = '100%';
        p.style.color = 'white';
        
        div.appendChild(p);
        this.context.domElement.shadowRoot.appendChild(div);
    }
}