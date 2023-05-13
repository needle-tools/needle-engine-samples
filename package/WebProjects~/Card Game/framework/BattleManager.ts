import { Behaviour, GameObject, serializable } from "@needle-tools/engine";
import { DragHandler } from "./DragHandler";
import { Card, CardModel } from "./Card";
import { Creature, CreatureState, GLTF } from "./Creature";
import { Deck } from "./Deck";
import { Player } from "./Player";
import { Object3D } from "three";
import { CreatureUI } from "./CreatureUI";

declare type SpawnedCreateModel = {
    guid: string;
    playerId: string;
    cardId: string;
}
declare type CreatureDiedModel = {
    creatureId: string;
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
    private _creatureUITemplate: GameObject | undefined = undefined;
    private _cardStats: Map<Card, CreatureState> = new Map();

    awake(): void {
        if (!this.deck) {
            console.error("Deck is not set");
        }
        this._creatureUITemplate = GameObject.findObjectOfType(CreatureUI)?.gameObject;
        if (this._creatureUITemplate) {
            // HACK: todo need to fix positioning when this is disabled
            // this._creatureUITemplate.scale.set(0, 0, 0);
            this._creatureUITemplate.visible = false;
        }
    }

    onEnable() {
        DragHandler.instance.onDrop.addEventListener(this.onDrop);
        this.context.connection.beginListen("spawn-creature", this.onSpawnCreature);
        this.context.connection.beginListen("creature-died", this.onCreatureDiedRemote);
    }
    onDisable(): void {
        DragHandler.instance.onDrop.removeEventListener(this.onDrop);
        this.context.connection.stopListen("spawn-creature", this.onSpawnCreature);
        this.context.connection.stopListen("creature-died", this.onCreatureDiedRemote);
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

    private _previousCreature: Card | null = null;

    private onDrop = (card: Card) => {
        // if (!this._cardStats.has(card)) {
        //     this._cardStats.set(card, card.creature!.state);
        // }
        if (this._previousCreature) {
            this.deck?.addToDeck(this._previousCreature);
        }
        this._previousCreature = card;
        card.gameObject.visible = false;
        // card.gameObject.removeFromParent();
        const localPlayer = this._players.find(p => p.isLocal);
        if (localPlayer) {
            this.createCreature(card, localPlayer.id);
        }
    }

    /** used to determine if the creature currently being instantiated is still the last requested */
    private _lastRequestedCreature: Map<string, CardModel> = new Map();
    private _activeCreatures: Map<string, Creature> = new Map();

    private async createCreature(card: Card | CardModel, playerId: string) {
        if (card instanceof Card) {
            card = card.model!;
        }
        const player = this._players.find(p => p.id === playerId)!;

        if (card && player) {
            this._lastRequestedCreature.set(playerId, card);
            const index = this._players.indexOf(player);
            const posIndex = index % this.creaturePositions.length;
            const targetPosition = this.creaturePositions[posIndex].position;

            const instance = await card.model.instantiate({ position: targetPosition }) as GameObject;
            if (this._lastRequestedCreature.get(playerId) !== card) {
                GameObject.destroy(instance);
                return;
            }
            // const pos = this.context.mainCameraComponent!.worldPosition;
            // pos.y = instance.position.y;
            // instance.lookAt(pos);
            // instance.position.copy(targetPosition);
            const nextPosition = this.creaturePositions[(posIndex + 1) % this.creaturePositions.length].position;
            instance.lookAt(nextPosition);

            const creature = instance.getOrAddComponent(Creature)
            creature.isLocallyOwned = player.isLocal;
            creature.addEventListener("died", this.onCreatureDied)
            const creatureGuid = card.id + "@" + playerId;
            creature.guid = creatureGuid;
            creature.initialize(creatureGuid, card, card.model.rawAsset as GLTF);
            this._activeCreatures.set(creatureGuid, creature);

            if (player.isLocal) {
                this.sendSpawnCreature(player, card);
            }
            player.setActiveCreate(creature);

            if (this._creatureUITemplate) {
                this._creatureUITemplate.visible = true;
                this._creatureUITemplate.scale.set(1, 1, 1);
                const ui = GameObject.instantiate(this._creatureUITemplate)!;
                this._creatureUITemplate.visible = false;
                const creatureUI = ui!.getComponent(CreatureUI) as CreatureUI;
                creatureUI.setCreature(creature);
            }
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


    private onCreatureDied = (evt: CustomEvent<Creature>) => {
        const creature = evt.detail;
        creature.gameObject.destroy();
        if (creature.isLocallyOwned) {
            this.context.connection.send<CreatureDiedModel>("creature-died", {
                creatureId: creature.guid
            });
        }
    }

    private onCreatureDiedRemote = (evt: CreatureDiedModel) => {
        console.log("Creature died remote", evt);
        this.onKillCreature(evt.creatureId);
    }

    private onKillCreature(guid: string) {
        const creature = this._activeCreatures.get(guid);
        if (creature) {
            this._activeCreatures.delete(guid);
            creature.die();
        }
    }
}