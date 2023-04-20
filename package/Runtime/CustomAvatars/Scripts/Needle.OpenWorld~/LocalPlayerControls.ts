import { SyncedTransform } from "@needle-tools/engine";
import { Behaviour, CharacterControllerInput, GameObject, serializeable } from "@needle-tools/engine";
import { PlayerStateOwnerChangedArgs, PlayerState, PlayerStateEvent, PlayerStateEventCallback } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting 
 
export class LocalPlayerControls extends Behaviour {


    onEnable() {
        const input = GameObject.getComponent(this.gameObject, CharacterControllerInput);
        const syncTransform = GameObject.getComponent(this.gameObject, SyncedTransform);
        const playerState = GameObject.getComponent(this.gameObject, PlayerState);

        if (!input || !syncTransform || !playerState) return;

        input.enabled = false;
        PlayerState.addEventListener(PlayerStateEvent.OwnerChanged, this.onOwnerChanged);
    }

    onDisable(): void {
        const input = GameObject.getComponent(this.gameObject, CharacterControllerInput);
        if (input) input.enabled = false;
        PlayerState.removeEventListener(PlayerStateEvent.OwnerChanged, this.onOwnerChanged);
    }

    private onOwnerChanged = (_evt: CustomEvent<PlayerStateOwnerChangedArgs>) => {

        const input = GameObject.getComponent(this.gameObject, CharacterControllerInput);
        const syncTransform = GameObject.getComponent(this.gameObject, SyncedTransform);
        if (!input || !syncTransform) return;


        if (PlayerState.isLocalPlayer(this)) {
            input.enabled = true;
            syncTransform.requestOwnership();
        }
        else {
            input.enabled = false;
        }

    }

}
