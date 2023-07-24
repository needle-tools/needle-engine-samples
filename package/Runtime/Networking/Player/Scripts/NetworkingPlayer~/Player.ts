import { Behaviour, PlayerState, Renderer, SyncedTransform, serializable, Text } from "@needle-tools/engine";
import { Color, MeshStandardMaterial } from "three";

export class Player extends Behaviour {

    @serializable(PlayerState)
    playerState?: PlayerState;

    @serializable(SyncedTransform)
    syncedTransform?: SyncedTransform;

    @serializable(Renderer)
    mainRenderer?: Renderer;

    @serializable(Text)
    nameLabel?: Text;
    
    speed: number = 5;

    // wrapper to clean the code so we don't have to check if playerState is null
    isLocalPlayer() {
        return this.playerState?.isLocalPlayer || false;
    }
    
    start() {
        if(!this.playerState || !this.mainRenderer)
            return;

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
        if(this.isLocalPlayer()) {
            this.gameObject.position.x = Math.random() * 5 - 2.5;
            this.gameObject.position.z = Math.random() * 5 - 2.5;
        }

        // set the name label
        if(this.nameLabel) {
            this.nameLabel.text = `${this.playerState.owner!}\n${this.playerState.isLocalPlayer ? "<color=#ff715e>Local</color>" : "Remote"}`;
        }
    }

    update() {
        // only if we are the local player we are allowed to gather input and move the player
        if(this.isLocalPlayer()) {
            const input = this.context.input;
            const dt = this.context.time.deltaTime;

            if (input.isKeyPressed("ArrowLeft") || input.isKeyPressed("a")) {
                this.gameObject.position.x -= this.speed * dt;
            }
            if (input.isKeyPressed("ArrowRight") || input.isKeyPressed("d")) {
                this.gameObject.position.x += this.speed * dt;
            }
            if (input.isKeyPressed("ArrowUp") || input.isKeyPressed("w")) {
                this.gameObject.position.z -= this.speed * dt;
            }
            if (input.isKeyPressed("ArrowDown") || input.isKeyPressed("s")) {
                this.gameObject.position.z += this.speed * dt;
            }
        }
    }
}