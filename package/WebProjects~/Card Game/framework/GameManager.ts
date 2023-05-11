import { Behaviour, CanvasGroup, GameObject, RoomEvents, Text, serializable } from "@needle-tools/engine";
import { Object3D } from "three";
import { Deck } from "./Deck";
import { Player } from "./Player";
import { BattleManager } from "./BattleManager";

export class GameModel {
    readonly guid: string = "game-state";
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

    @serializable(BattleManager)
    battleManager!: BattleManager;

    @serializable(Text)
    debugText: Text | null = null;

    @serializable(CanvasGroup)
    joinGameUI?: CanvasGroup;

    private _currentGameModel: GameModel | null = null;

    get canJoinGame() {
        if (this._currentGameModel === null) return true;
        if (this.context.connection.connectionId && this._currentGameModel.players.includes(this.context.connection.connectionId))
            return false;
        return this._currentGameModel.players.length < 2;
    }


    onEnable() {
        this.updateUI(this.canJoinGame);
        this.context.connection.beginListen(RoomEvents.JoinedRoom, this.onLocalUserJoinedRoom);
        this.context.connection.beginListen(RoomEvents.UserLeftRoom, this.testIfAllPlayersAreConnected);
        this.context.connection.beginListen("join-game", this.onRequestedJoinGame);
        this.context.connection.beginListen("game-updated", this.onGameUpdated);
    }
    onDisable(): void {
        this.context.connection.stopListen(RoomEvents.JoinedRoom, this.onLocalUserJoinedRoom);
        this.context.connection.stopListen(RoomEvents.UserLeftRoom, this.testIfAllPlayersAreConnected);
        this.context.connection.stopListen("join-game", this.onRequestedJoinGame);
        this.context.connection.stopListen("game-updated", this.onGameUpdated);
    }

    requestJoinGame() {
        this.updateUI(false);
        if (!this.canJoinGame) return;
        if (this.context.connection.connectionId)
            this.joinGame(this.context.connection.connectionId);
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
        this.testIfAllPlayersAreConnected();
        this.updateUI(this.canJoinGame);
        this.updatePlayers();
    }

    private testIfAllPlayersAreConnected() {
        if (this.context.connection.isConnected && this._currentGameModel?.players) {
            let stateChanged = false;
            for (let i = this._currentGameModel.players.length - 1; i >= 0; i--) {
                const id = this._currentGameModel.players[i];
                if (this.context.connection.userIsInRoom(id) === false) {
                    stateChanged = true;
                    this._currentGameModel.players.splice(i, 1);
                    console.log("Player is not in room anymore", id);
                }
            }
            if (stateChanged) {
                this.context.connection.send("game-updated", this._currentGameModel);
            }
        }
        this.updateUI(this.canJoinGame);
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

        if (this.debugText) {
            this.debugText.text = "";
            this.debugText.text = "Players: " + (this._currentGameModel?.players.length || 0);
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

        if (this.players.length === 2) {
            this.battleManager.startBattle(this.players);
        }
    }


    private players: Player[] = [];
}
