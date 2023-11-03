import { Behaviour, GameObject, Mathf, WebXR, WebXRController, WebXREvent, detectARSupport, findObjectOfType, serializable } from "@needle-tools/engine";
import { Vector3, Object3D } from "three";

enum XRHandedness {
    None = "none",
    Left = "left",
    Right = "right"
}

export class CustomXRController extends Behaviour {
    static usedIndexes: number[] = [];
    static isIndexUsed(index: number) { return this.usedIndexes.includes(index); }

    // TODO: Expose enum
    private handedness: XRHandedness = XRHandedness.None;

    @serializable()
    tempIsLeft: boolean = false;
    @serializable()
    tempIsRight: boolean = false;

    @serializable()
    enableRay: boolean = true;

    @serializable()
    hideController: boolean = true;

    @serializable()
    autoAttach: boolean = true;

    private handPositionOffset: Vector3 = new Vector3(0, -0.02, -0.05);
    private handRotationOffset: Vector3 = new Vector3(/* -20 */0, 180, -90);
    private controllerPositionOffset: Vector3 = new Vector3();
    private controllerRotationOffset: Vector3 = new Vector3(-45, 180, 0);

    @serializable()
    hideWhenDetatched: boolean = true;

    static webXR?: WebXR;
    private get webXR(): WebXR | undefined { return CustomXRController.webXR; }

    private isAttached = false;
    private lastAttachedIndex = -1;
    private currentController?: WebXRController;

    awake(): void {
        //temp
        if (this.tempIsLeft)
            this.handedness = XRHandedness.Left;
        else if (this.tempIsRight)
            this.handedness = XRHandedness.Right;

        CustomXRController.webXR ??= findObjectOfType(WebXR, this.scene, false);
        WebXR.addEventListener(WebXREvent.XRStarted, this.xrUpdate);

        this.detach();
    }
    onDestroy(): void {
        WebXR.removeEventListener(WebXREvent.XRUpdate, this.xrUpdate);
    }

    private xrUpdate = () => {
        if (!this.isAttached && this.autoAttach)
            this.tryAttach();

        if(this.isAttached) {
            this.handleActiveController();
        }
    }

    private tryAttach() {
        if (!this.webXR) return;

        for (const controller of this.webXR.Controllers) {
            // allegable for attachment
            if (controller.input?.handedness == this.handedness && !CustomXRController.isIndexUsed(controller.index)) {
                this.attach(controller);
                break;
            }
        }
    }

    private tempVec: Vector3 = new Vector3();
    handleActiveController() {
        if(!this.currentController) return;

        const controller = this.currentController;
        const isHand = controller.isUsingHands;

        const controllerRoot = controller.controller;
        const handRoot = this.getHandRoot(controller);
        const root = isHand ? handRoot : controllerRoot;

        if(root && this.gameObject.parent != root) {
            const pos = isHand ? this.handPositionOffset : this.controllerPositionOffset;
            const rot = isHand ? this.handRotationOffset : this.controllerRotationOffset;
            this.tempVec.copy(rot);
            this.tempVec.multiplyScalar(Mathf.Deg2Rad);

            // invert rotation for the right hand
            if(controller.input?.handedness == XRHandedness.Right) {
                this.tempVec.negate();
            }

            root.attach(this.gameObject);
            this.gameObject.position.copy(pos);
            this.gameObject.rotation.set(this.tempVec.x, this.tempVec.y, this.tempVec.z);
        }
    }

    private getHandRoot(controller: WebXRController): Object3D | null {
        if(!controller.hand) return null;
        const joints = controller.hand["joints"];
        if (!joints) return null;
        return joints["index-finger-metacarpal"];

    }

    attach(controller: WebXRController) {
        this.detach(); // detach if we were attached

        this.isAttached = true;

        this.gameObject.visible = true;
        this.currentController = controller;
        CustomXRController.usedIndexes.push(controller.index);
        this.lastAttachedIndex = controller.index;

        if(this.hideController)
            this.currentController.controllerModel.visible = false;
    }

    detach(newParent: THREE.Object3D = this.scene) {
        if (this.currentController) {
            CustomXRController.usedIndexes.splice(CustomXRController.usedIndexes.indexOf(this.currentController.index));

            if(this.hideController)
                this.currentController.controllerModel.visible = true; // ?
        }

        this.currentController = undefined;
        this.isAttached = false;

        newParent.attach(this.gameObject);
        if (this.hideWhenDetatched)
            this.gameObject.visible = false;
    }
}