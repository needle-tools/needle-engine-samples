import { Behaviour, NeedleXRController, NeedleXREventArgs, NeedleXRHitTestResult, NEPointerEvent, serializable, setWorldPosition, setWorldQuaternion } from '@needle-tools/engine';
import { Matrix4, Object3D, Quaternion, Vector3 } from 'three';

export class CustomARPlacer extends Behaviour {
    @serializable(Object3D)
    indicator?: Object3D;

    @serializable(Object3D)
    content?: Object3D;

    private isPlacing: boolean = false;

    private xrRay = new XRRay({x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 1});
    private xrMat = new Matrix4();
    private xrHitSource?: XRHitTestSource;
    
    async onEnterXR(args: NeedleXREventArgs) {
        const space = await args.xr.session.requestReferenceSpace("viewer");
        if (!space) return;
        this.xrHitSource  = await args.xr.session.requestHitTestSource?.({space: space, offsetRay: this.xrRay});
    }

    awake(): void {
        this.context.input.addEventListener("pointerup", this.onPreview);
        this.context.input.addEventListener("pointermove", this.onPlace);
        this.isPlacing = true;
    }

    private onPreview = (pointerArgs: NEPointerEvent) => {

    }

    private onPlace = (pointerArgs: NEPointerEvent) => {
        
    }

    private getHit(pointerArgs: NEPointerEvent): any {
        if (!pointerArgs || !pointerArgs.space) return undefined;

        // Controller
        if (pointerArgs.origin instanceof NeedleXRController) {
            
        }
        // Touch
        else {
            const pos = pointerArgs.space.position;
        }        
    }

    private _applyHit(object: Object3D | undefined, position: Vector3, quaternion: Quaternion) {
        if (object) {
            setWorldPosition(object, position);
            setWorldQuaternion(object, quaternion);
        }
    }
}