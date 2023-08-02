import { Behaviour, PlayerState, Renderer, SyncedTransform, serializable, Text, RaycastOptions, Gizmos } from "@needle-tools/engine";
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
    private options = new RaycastOptions();

    private tempVec1 = new Vector3();
    private tempVec2 = new Vector3();


    // wrapper to clean the code so we don't have to check if playerState is null
    isLocalPlayer() {
        return this.playerState?.isLocalPlayer || false;
    }
    
    start() {
        if(!this.playerState) return;

        if(this.playerState.hasOwner)
            this.initialize();
        else
            this.playerState.onFirstOwnerChangeEvent.addEventListener(() => { console.log("let's goo baby!"); this.initialize(); });
    }

    initialize() {
        if(!this.playerState || !this.mainRenderer) {
            return;
        }

        // Synced transform synchronizes position, rotation and scale. But has to be manually enabled to determine who the owner is.
        if(this.syncedTransform && this.isLocalPlayer()) {
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

        // sample: set random position on the map 
        this.currentGoal = new Vector3(Math.random() * 5 - 2.5, 0, Math.random() * 5 - 2.5);
    }

    update() {
        // only if we are the local player we are allowed to gather input and move the player
        if(this.isLocalPlayer()) {
            const input = this.context.input;
            const cam = this.context.mainCamera;
            const dt = this.context.time.deltaTime;
            const physics = this.context.physics;

            // reach a goal
            this.tempVec1.copy(this.currentGoal);
            this.tempVec2.copy(this.gameObject.position);
            const vecToGoal = this.tempVec1.sub(this.tempVec2);
            const distanceToTravel = this.speed * dt;
            if(vecToGoal.length() < distanceToTravel)
                this.gameObject.position.copy(this.currentGoal);
            else
                this.gameObject.translateOnAxis(vecToGoal.normalize(), distanceToTravel);

            // save pointer position on pointer down
            if(input.getPointerDown(0)) {
                const pos = input.getPointerPosition(0);
                if(pos)
                    this.pointerPos.copy(pos);
            }

            // compare the pointer down and pointer up positions to determine if we clicked or dragged
            // and perform a raycast
            if(input.getPointerUp(0) && cam) {
                const currPointerPos = input.getPointerPosition(0) || new Vector2();
                if(currPointerPos.distanceTo(this.pointerPos) < 40) {   
                    
                    const results = physics.raycast(this.options);
                    if(results.length > 0) {
                        this.currentGoal = results[0].point;
                    }
                }
            }
        }
    }
}