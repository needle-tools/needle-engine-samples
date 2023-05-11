import { AnimatorController, BehaviorExtension, Behaviour, CanvasGroup, GameObject, RoomEvents, SyncedRoom, getIp, getIpAndLocation, serializable, showBalloonMessage } from "@needle-tools/engine";
import { Card } from "./Card";
import { DragHandler } from "./DragHandler";
import { Creature, GLTF } from "./Creature";
import { Object3D } from "three";
import { Deck } from "./Deck";

export class GameModel {
    players: string[] = [];
}

export type JoinGameModel = {
    userId: string;
}

export class GameManager extends Behaviour {

    private static _instance: GameManager | null = null;
    static get instance() {
        if (this._instance === null) {
            this._instance = GameObject.findObjectOfType(GameManager);
        }
        return this._instance;
    }
    constructor() {
        super();
        GameManager._instance = this;
    }



    @serializable(CanvasGroup)
    joinGameUI?: CanvasGroup;

    @serializable(Deck)
    deck?: Deck;

    private _lastInstance: GameObject | null = null;
    private _currentGameModel: GameModel | null = null;

    get canJoinGame() {
        if (this._currentGameModel === null) return true;
        if (this.context.connection.connectionId && this._currentGameModel.players.includes(this.context.connection.connectionId))
            return false;
        return this._currentGameModel.players.length < 2;
    }


    onEnable() {
        if (this.deck) {
            this.deck.enabled = false;
        }
        this.updateUI(this.canJoinGame);
        DragHandler.instance.onDrop.addEventListener(this.onDrop);
        this.context.connection.beginListen(RoomEvents.JoinedRoom, this.onLocalUserJoinedRoom);
        this.context.connection.beginListen("join-game", this.onRequestedJoinGame);
        this.context.connection.beginListen("game-updated", this.onGameUpdated);
    }
    onDisable(): void {
        DragHandler.instance.onDrop.removeEventListener(this.onDrop);
        this.context.connection.stopListen(RoomEvents.JoinedRoom, this.onLocalUserJoinedRoom);
        this.context.connection.stopListen("join-game", this.onRequestedJoinGame);
        this.context.connection.stopListen("game-updated", this.onGameUpdated);
    }

    requestJoinGame() {
        this.updateUI(false);
        if (!this.canJoinGame) return;
        if (this.context.connection.connectionId)
            this.joinGame(this.context.connection.connectionId);
    }

    private onDrop = (card: Card) => {
        this._lastInstance?.destroy();
        GameObject.destroy(card.gameObject);
        this.createCreature(card);
    }

    private async createCreature(card: Card) {
        if (card?.model) {
            const model = card.model;
            this._lastInstance = await model.model.instantiate() as GameObject;
            const pos = this.context.mainCameraComponent!.worldPosition;
            pos.y = this._lastInstance.position.y;
            this._lastInstance.lookAt(pos);

            const creature = this._lastInstance.getOrAddComponent(Creature)
            creature.initialize(model, model.model.rawAsset as GLTF);
        }
    }

    private joinGame(userId: string) {
        if (this._currentGameModel === null) {
            this._currentGameModel = new GameModel();
        }
        if (this._currentGameModel.players.length < 2) {
            this._currentGameModel.players.push(userId);
            console.log("Send updated", this._currentGameModel);
            this.context.connection.send("game-updated", this._currentGameModel);
        }
        this.updateUI(this.canJoinGame);
        this.updatePlayers();
    }

    private onRequestedJoinGame = async (e: JoinGameModel) => {
        this.joinGame(e.userId);
    }

    private onGameUpdated = async (e: GameModel) => {
        console.log("onGameUpdated", e);
        this._currentGameModel = e;
        this.updateUI(this.canJoinGame);
        this.updatePlayers();
    }

    private onLocalUserJoinedRoom = async () => {
        this.updateUI(this.canJoinGame);
    }

    private _joinGameUIParent: Object3D | null = null;
    private updateUI(visible: boolean) {
        if (this.joinGameUI) {
            if (!this._joinGameUIParent) {
                this._joinGameUIParent = this.joinGameUI.gameObject.parent;
            }
            // TODO: canvas group alpha is not applied to buttons properly right now because of state system
            // if(visible) this._joinGameUIParent?.add(this.joinGameUI.gameObject);
            // else this._joinGameUIParent?.remove(this.joinGameUI.gameObject);
            if (visible) this.joinGameUI.gameObject.scale.set(1, 1, 1);
            else this.joinGameUI.gameObject.scale.set(0, 0, 0);
            // this.joinGameUI.alpha = visible ? 1 : 0;
            // this.joinGameUI.blocksRaycasts = visible;
            // this.joinGameUI.interactable = visible;
        }
    }

    private updatePlayers() {
        if (this._currentGameModel === null) return;
        for (let i = 0; i < this._currentGameModel.players.length; i++) {
            const id = this._currentGameModel.players[i];
            let player = this.players.find(p => p.id === id);
            if (!player) {
                player = new Player();
                player.id = id;
                player.manager = this;
                this.players.push(player);
                this.gameObject.addComponent(player);
            }
        }
        for (let i = this.players.length - 1; i >= 0; i--) {
            const player = this.players[i];
            if (!this._currentGameModel.players.includes(player.id)) {
                this.players.splice(i, 1);
                player.destroy();
            }
        }
    }


    private players: Player[] = [];
}


export class Player extends Behaviour {

    @serializable()
    id!: string;

    @serializable(Behaviour)
    manager!: GameManager;

    get isLocal() {
        return this.id === this.context.connection.connectionId
    }


    start() {
        console.log(this, this.isLocal);
    }


    onEnable(): void {
        if (this.isLocal) {
            this.manager.deck!.enabled = true;
        }
    }
}
