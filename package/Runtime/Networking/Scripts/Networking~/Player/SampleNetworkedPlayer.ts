import { Behaviour, PlayerState, Renderer, SyncedTransform, serializable, Text, RaycastOptions, Gizmos, IPhysicsEngine } from "@needle-tools/engine";
import { Color, MeshStandardMaterial, Vector2, Vector3 } from "three";

export class SampleNetworkedPlayer extends Behaviour {

    @serializable(PlayerState)
    playerState?: PlayerState;

    @serializable(SyncedTransform)
    syncedTransform?: SyncedTransform;

    @serializable(Renderer)
    mainRenderer?: Renderer;
    
    @serializable()
    speed: number = 5;

    private currentGoal = new Vector3();
    private pointerPos = new Vector2();

    private tempVec1 = new Vector3();
    private tempVec2 = new Vector3();
    
    start() {
        if(!this.playerState) return;

        if(this.playerState.hasOwner)
            this.initialize();
        else
            this.playerState.onFirstOwnerChangeEvent.addEventListener(this.initialize);

            this.currentGoal.copy(this.gameObject.position);
    }

    initialize = () => {
        if(!this.playerState || !this.mainRenderer) {
            return;
        }

        // Synced transform synchronizes position, rotation and scale. But has to be manually enabled to determine who the owner is.
        if(this.syncedTransform && this.playerState?.isLocalPlayer) {
            this.syncedTransform.requestOwnership();
        }

        // set the color of the player based on the netID (this means the color is calculated on each client but with the same result for same players)
        const netID = this.playerState.owner ?? "";
        const mat = this.mainRenderer.sharedMaterial as MeshStandardMaterial;
        if(mat) {
            const coloredMat = new MeshStandardMaterial();
            coloredMat.copy(mat);

            const id = parseInt(netID, 16);
            coloredMat.color = new Color(id);

            this.mainRenderer.sharedMaterial = coloredMat;
        }
    }

    update() {
        // only if we are the local player we are allowed to gather input and move the player
        if(this.playerState?.isLocalPlayer) {
            const input = this.context.input;
            const cam = this.context.mainCamera;
            const dt = this.context.time.deltaTime;
            const physics = this.context.physics.engine as IPhysicsEngine;

            // reach a goal
            this.tempVec1.copy(this.currentGoal);
            this.tempVec2.copy(this.gameObject.position);
            const vecToGoal = this.tempVec1.sub(this.tempVec2);
            const distanceToTravel = this.speed * dt;
            if(vecToGoal.length() < distanceToTravel)
                this.gameObject.position.copy(this.currentGoal);
            else
                this.gameObject.translateOnAxis(vecToGoal.normalize(), distanceToTravel);

            const reactOnHover = false; //input.getPointerPositionDelta(0)!.length() > 1;

            // save pointer position on pointer down
            if(input.getPointerDown(0)) {
                const pos = input.getPointerPosition(0);
                if(pos)
                    this.pointerPos.copy(pos);
            }

            // compare the pointer down and pointer up positions to determine if we clicked or dragged
            // and perform a raycast
            if((reactOnHover || input.getPointerUp(0)) && cam) {
                const currPointerPos = input.getPointerPosition(0) || new Vector2();
                if(currPointerPos.distanceTo(this.pointerPos) < 40 || reactOnHover) {   
                    const result = physics.raycast();
                    if(result && result.collider) {
                        this.currentGoal.copy(result.point);
                    }
                }
            }
        }
    }
}