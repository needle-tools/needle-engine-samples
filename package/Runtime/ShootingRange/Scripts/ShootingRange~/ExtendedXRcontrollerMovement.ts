import { NeedleXREventArgs, XRControllerMovement, serializable } from "@needle-tools/engine";

export class ExtendedXRcontrollerMovement extends XRControllerMovement {

    @serializable()
    showRay: boolean = true;
    showContacts: boolean = true;

    override onUpdateXR(args: NeedleXREventArgs): void {
        const rig = args.xr.rig;
        if (!rig?.gameObject) return;

        // in AR pass through mode we dont want to move the rig
        if (args.xr.isPassThrough) {
            this.renderRays(args.xr);
            this.renderHits(args.xr);
            return;
        }

        const movementController = args.xr.leftController;
        const teleportController = args.xr.rightController;

        if (movementController)
            this.onHandleMovement(movementController, rig.gameObject);
        if (teleportController) {
            this.onHandleRotation(teleportController, rig.gameObject);
            this.onHandleTeleport(teleportController, rig.gameObject);
        }

        if (this.showRay)
            this.renderRays(args.xr);

        if (this.showContacts)
            this.renderHits(args.xr);
    }
}