import { Behaviour, Mathf, OrbitControls, PointerType, findObjectOfType, serializable, showBalloonMessage } from "@needle-tools/engine";
import { Texture } from "three";
import * as THREE from "three";
import { GyroscopeControls } from "samples.sensors";

export class PanoramaViewer extends Behaviour {
    // TODO: add remote image url support
    // TODO: add video support
    // TODO: add remote video support
    @serializable(Texture)
    panoramas: Texture[] = [];

    @serializable()
    enableZoom: boolean = true;

    @serializable()
    zoomMin: number = 40;

    @serializable()
    zoomMax: number = 90;

    @serializable()
    zoomSensitivity: number = 0.1;

    @serializable()
    zoomSmoothing: number = 0.1;

    //@nonSerialized
    panoramaSize = 100;

    protected index = 0;
    private get _i() {
        return Mathf.clamp(this.index, 0 , this.panoramas.length - 1);
    }
    protected panoSphere?: THREE.Mesh;

    protected optionalGyroControls?: GyroscopeControls;
    protected optionalOrbitalControls?: OrbitControls;

    start() {
        this.panoSphere = this.createPanorama();
        this.gameObject.add(this.panoSphere);

        this.apply();

        // TODO report: Can't use serialized reference or GetComponentInChildren? Results in a { guid } obj.
        this.optionalGyroControls = findObjectOfType(GyroscopeControls, this.context.scene, false);
        this.optionalOrbitalControls = findObjectOfType(OrbitControls, this.context.scene, false);
    }

    update(): void {
        if (this.enableZoom) {
            this.handleZoom();
        }
    }

    protected previousPinchDistance: number | undefined = undefined;
    /* returns zoom delta */
    protected getZoomInput(): number {
        let delta = 0; 

        // PC - scrollwheel
        const input = this.context.input;
        delta = input.getMouseWheelDeltaY();

        // Touch - pinch
        if (input.getTouchesPressedCount() == 2) {
            const a = new THREE.Vector2();
            const b = new THREE.Vector2();
            for (const id of input.foreachPointerId(PointerType.Touch)) {
                const pos = input.getPointerPosition(id)!;
                b.copy(a);
                a.copy(pos);
            }

            const pinchDistance = a.distanceTo(b);
            if(this.previousPinchDistance) {
                delta += this.previousPinchDistance - pinchDistance;
            }
            this.previousPinchDistance = pinchDistance;
        }
        else 
            this.previousPinchDistance = undefined;

        // TODO: add vr controller support - joystick


        return delta;
    }

    protected zoomDeltaBuffer: number = 0;
    protected handleZoom() {
        const time = this.context.time;
        const delta = this.getZoomInput();

        this.zoomDeltaBuffer = Mathf.lerp(this.zoomDeltaBuffer, delta, time.deltaTime * this.zoomSmoothing);
        
        const cam = this.context.mainCameraComponent;
        const zoom = cam?.fieldOfView ?? 0;

        const applyZoomDelta = (delta: number) => { 
            if(cam?.fieldOfView) 
                cam.fieldOfView += delta; 
        };

        if(delta > 0 && zoom < this.zoomMax)
            applyZoomDelta(this.zoomDeltaBuffer);
        else if(delta < 0 && zoom > this.zoomMin)
            applyZoomDelta(this.zoomDeltaBuffer);
        else
            this.zoomDeltaBuffer = 0; // reset when out in a  bound
    }

    protected createPanorama(): THREE.Mesh {
        const sphere = new THREE.SphereGeometry(this.panoramaSize, 128, 128);

        const mat = new THREE.MeshBasicMaterial();
        /* mat.color = new THREE.Color(0, 0, 0); */
        mat.side = THREE.DoubleSide;

        const mesh = new THREE.Mesh(sphere, mat);

        mesh.position.set(0, 0, this.panoramaSize);
        mesh.scale.set(1, -1, 1);

        return mesh;
    }

    next() {
        this.index++;
        if (this.index >= this.panoramas.length) {
            this.index = 0;
        }

        this.apply();
    }
    previous() {
        this.index--;
        if (this.index < 0) {
            this.index = this.panoramas.length - 1;
        }

        this.apply();
    }
    select(index: number) {
        this.index = index;
        this.apply();
    }

    apply() {
        if (!this.panoSphere) return;

        const texture = this.panoramas[this._i];
        const mat = this.panoSphere.material as THREE.MeshBasicMaterial;

        if(texture && mat)
            mat.map = texture;
    }

    private isGyroEnabled = false;
    toggleGyroControls() {
        if (!this.optionalGyroControls) return;
        if (!this.optionalOrbitalControls) return;

        this.isGyroEnabled = !this.isGyroEnabled;

        this.optionalGyroControls.enabled = this.isGyroEnabled;
        this.optionalOrbitalControls.enabled = !this.isGyroEnabled;
    }
}