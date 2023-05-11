import { Behaviour, GameObject, serializable } from "@needle-tools/engine";
import { DragHandler } from "./DragHandler";
import { Card } from "./Card";
import { Creature, GLTF } from "./Creature";
import { CardModel, Deck } from "./Deck";
import { Player } from "./Player";
import { Object3D } from "three";

declare type SpawnedCreateModel = {
    guid: string;
    playerId: string;
    cardId: string;
}

export class BattleManager extends Behaviour {

    @serializable(Deck)
    deck!: Deck;

    @serializable(Object3D)
    creaturePositions: Object3D[] = [];

    private _players: Player[] = [];

    awake(): void {
        if (!this.deck) {
            console.error("Deck is not set");
        }
    }

    onEnable() {
        DragHandler.instance.onDrop.addEventListener(this.onDrop);
        this.context.connection.beginListen("spawn-creature", this.onSpawnCreature);
    }
    onDisable(): void {
        DragHandler.instance.onDrop.removeEventListener(this.onDrop);
        this.context.connection.stopListen("spawn-creature", this.onSpawnCreature);
    }

    startBattle(players: Player[]) {
        this._players = players;
        const hasLocalPlayer = players.find(p => p.isLocal);
        this.deck.isActive = hasLocalPlayer !== undefined;
    }

    private onDrop = (card: Card) => {
        GameObject.destroy(card.gameObject);
        const localPlayer = this._players.find(p => p.isLocal);
        if (localPlayer)
            this.createCreature(card, localPlayer.id);
    }

    private async createCreature(card: Card | CardModel, playerId: string) {

        if (card instanceof Card) {
            card = card.model!;
        }
        const player = this._players.find(p => p.id === playerId)!;

        if (card && player) {
            const instance = await card.model.instantiate() as GameObject;
            // const pos = this.context.mainCameraComponent!.worldPosition;
            // pos.y = instance.position.y;
            // instance.lookAt(pos);
            const index = this._players.indexOf(player);
            const posIndex = index % this.creaturePositions.length;
            instance.position.copy(this.creaturePositions[posIndex].position);
            const nextPosition = this.creaturePositions[(posIndex + 1) % this.creaturePositions.length].position;
            instance.lookAt(nextPosition);

            const creature = instance.getOrAddComponent(Creature)
            creature.initialize(card.id + "@" + playerId, card, card.model.rawAsset as GLTF);

            if (player.isLocal) {
                this.sendSpawnCreature(player, card);
            }
            player.setActiveCreate(creature);
        }
    }

    private sendSpawnCreature(player: Player, card: CardModel) {
        const model: SpawnedCreateModel = {
            guid: player.id,
            playerId: player.id,
            cardId: card.id
        }
        this.context.connection.send("spawn-creature", model)
    }

    private onSpawnCreature = (data: SpawnedCreateModel) => {

        if (this._players.length === 0) return;

        console.log("Spawn creature", data);
        const card = this.deck.getModel(data.cardId);
        if (card) {
            this.createCreature(card, data.playerId);
        }
        else
            console.error("Card not found", data.cardId);
    };
}