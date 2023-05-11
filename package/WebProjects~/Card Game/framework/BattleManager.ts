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

    get isInBattle() {
        return this._activePlayers !== null;
    }

    private _players: Player[] = [];
    private _activePlayers: Player[] | null = null;
    private _spawnEvents: Map<string, SpawnedCreateModel> = new Map();

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
        console.log("Start battle")
        this._players = players;
        this._activePlayers = [...players]
        const hasLocalPlayer = players.find(p => p.isLocal);
        // check if the local player is participating:
        if (hasLocalPlayer) this.deck.activate();
        else this.deck.deactivate();
        // for (const spawn of this._spawnEvents.values()) {
        //     this.onSpawnCreature(spawn);
        // }
        this._spawnEvents.clear();
    }
    endBattle() {
        const local = this._players.find(p => p.isLocal);
        if (!local || !local.isConnected) {
            this.deck.deactivate();
        }
        if (!this._activePlayers) return;
        console.log("End battle")
        for (const pl of this._activePlayers) {
            GameObject.destroy(pl);
        }
        this._activePlayers = null;
    }

    private onDrop = (card: Card) => {
        GameObject.destroy(card.gameObject);
        const localPlayer = this._players.find(p => p.isLocal);
        if (localPlayer)
            this.createCreature(card, localPlayer.id);
    }

    private _requestedCreature: Map<string, CardModel> = new Map();
    private async createCreature(card: Card | CardModel, playerId: string) {

        if (card instanceof Card) {
            card = card.model!;
        }
        const player = this._players.find(p => p.id === playerId)!;

        if (card && player) {
            this._requestedCreature.set(playerId, card);
            const instance = await card.model.instantiate() as GameObject;
            if (this._requestedCreature.get(playerId) !== card) {
                GameObject.destroy(instance);
                return;
            }
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
            guid: "creature-" + this._activePlayers?.indexOf(player),
            playerId: player.id,
            cardId: card.id
        }
        this._spawnEvents.set(model.guid, model);
        this.context.connection.send("spawn-creature", model)
    }

    private onSpawnCreature = (data: SpawnedCreateModel) => {

        this._spawnEvents.set(data.guid, data);

        console.log("Spawn creature", data);
        const card = this.deck.getModel(data.cardId);
        if (card) {
            this.createCreature(card, data.playerId);
        }
        else
            console.error("Card not found", data.cardId);
    };
}