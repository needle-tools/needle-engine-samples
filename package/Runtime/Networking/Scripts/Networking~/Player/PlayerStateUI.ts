import { Behaviour, PlayerState, serializable, Text } from "@needle-tools/engine";

export class PlayerStateUI extends Behaviour {
    playerState!: PlayerState;

    @serializable(Text)
    label?: Text;

    start() {
        //get component is needed since a serialized reference is not adjusted after instantiation
        this.playerState = this.gameObject.getComponentInParent(PlayerState)!; 
        if(!this.playerState) return;

        if(this.playerState.hasOwner)
            this.updateLabel();
        else 
            this.playerState.onFirstOwnerChangeEvent.addEventListener(() => this.updateLabel());
    }

    updateLabel() {
        if(this.label && this.playerState) {
            this.label.text = `${this.playerState.owner!}\n${this.playerState.isLocalPlayer ? "<color=#ff715e>Local</color>" : "Remote"}`;
        }
    }
}