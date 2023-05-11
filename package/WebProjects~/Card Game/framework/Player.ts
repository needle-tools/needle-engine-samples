import { Behaviour, GameObject, serializable } from "@needle-tools/engine";
import { type GameManager } from "./GameManager";
import { Deck } from "./Deck";
import { Creature } from "./Creature";

// The player controls the creature!
export class Player extends Behaviour {

    @serializable()
    id!: string;

    @serializable(Behaviour)
    deck!: Deck;

    get isLocal() {
        return this.id === this.context.connection.connectionId
    }

    get isConnected() {
        return this.context.connection.userIsInRoom(this.id);
    }

    private activeCreature: Creature | null = null;

    setActiveCreate(creatue: Creature) {
        if (this.activeCreature) GameObject.destroy(this.activeCreature.gameObject);
        this.activeCreature = creatue;
    }

    onDestroy(): void {
        if (this.activeCreature) GameObject.destroy(this.activeCreature.gameObject);
    }
}
