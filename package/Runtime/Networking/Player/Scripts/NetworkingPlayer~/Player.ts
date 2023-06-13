import { Behaviour, Mathf, PlayerState, Renderer, SyncedTransform, serializable } from "@needle-tools/engine";
import { Color, Material, MathUtils, MeshStandardMaterial } from "three";

export class Player extends Behaviour {

    @serializable(PlayerState)
    playerState?: PlayerState;

    @serializable(SyncedTransform)
    syncedTransform?: SyncedTransform;

    @serializable(Renderer)
    mainRenderer?: Renderer;
    
    speed: number = 5;

    isOwner(): boolean { 
        if(!this.playerState || !this.playerState.owner)
            return false;

        return this.playerState.owner == this.context.connection.connectionId;
    }

    start() {
        if(!this.playerState || !this.mainRenderer)
            return;

        if(this.syncedTransform && this.isOwner()) {
            this.syncedTransform.requestOwnership();
        }

        const netID = this.playerState.owner
        if(!netID)
            return;

        const mat = this.mainRenderer.sharedMaterial as MeshStandardMaterial;
        if(mat) {
            const coloredMat = new MeshStandardMaterial();
            coloredMat.copy(mat);

            const id = parseInt(netID, 16);
            coloredMat.color = new Color(id);

            this.mainRenderer.sharedMaterial = coloredMat;
        }
    }

    update(): void {
        if(!this.playerState || !this.playerState.owner) {
            return;
        }

        if(this.isOwner()) {
            const input = this.context.input;
            const dt = this.context.time.deltaTime;

            if (input.isKeyPressed("ArrowLeft")) {
                this.gameObject.position.x -= this.speed * dt;
            }
            if (input.isKeyPressed("ArrowRight")) {
                this.gameObject.position.x += this.speed * dt;
            }
            if (input.isKeyPressed("ArrowUp")) {
                this.gameObject.position.z -= this.speed * dt;
            }
            if (input.isKeyPressed("ArrowDown")) {
                this.gameObject.position.z += this.speed * dt;
            }
        }
    }
}