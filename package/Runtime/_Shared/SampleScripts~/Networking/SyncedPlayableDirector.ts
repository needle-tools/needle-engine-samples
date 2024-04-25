import { Behaviour, PlayableDirector, RoomEvents, getComponentInChildren, serializable, syncField } from '@needle-tools/engine';

const updateEventName = "timeline-sync";

export class SyncTimelineData {
    guid: string;
    timestamp: number;
    playback: number;
    speed: number;

    constructor(guid: string, timestamp: number, playback: number, speed: number) {
        this.guid = guid;
        this.timestamp = timestamp;
        this.playback = playback;
        this.speed = speed;
    }
}

export class SyncedPlayableDirector extends Behaviour {
    @serializable()
    playOnAwake: boolean = false;

    protected director?: PlayableDirector;
    protected get netGuid() { return `${updateEventName}_${this.director?.guid ?? ""}`; }

    awake() {
        this.director = this.gameObject.getComponentInChildren(PlayableDirector) ?? undefined;

        // disable
        if (this.director && this.director.playOnAwake === true)
            this.director.playOnAwake = false;

        const net = this.context.connection;

        net.beginListen(RoomEvents.RoomStateSent, this.startSync);
        net.beginListen(updateEventName, this.handleUpdate);

        const state = net.tryGetState(this.netGuid) as SyncTimelineData;
        if (state) { // state is already synced (component became active after the state was already sent)
            this.handleUpdate(state);
        }
    }

    onDestroy(): void {
        this.context.connection.stopListen(RoomEvents.RoomStateSent, this.startSync);
        this.context.connection.stopListen(updateEventName, this.handleUpdate);
    }

    private startSync = () => {
        const net = this.context.connection;

        const state = net.tryGetState(this.netGuid) as SyncTimelineData;
        if (state === undefined) {
            this.set(0, this.playOnAwake ? 1 : 0);
        }
    }

    set(time: number, speed: number = 1) {
        if (!this.director) return;

        const timestap = Date.now();
        const data = new SyncTimelineData(this.netGuid, timestap, time, speed);
        this.context.connection.send(updateEventName, data);
        this.handleUpdate(data);
    }

    private handleUpdate = (data: SyncTimelineData) => {
        if (!this.director) return;
        if (!data) return;

        const delta = Math.max(0, Date.now() - data.timestamp) / 1000;
        const time = (data.playback + (delta * data.speed)) % (this.director.duration);
        this.director.time = time;
        this.director.speed = data.speed;

        this.director.play();
    }

    // temp testing
    /* update(): void {
        const input = this.context.input;
        
        if(input.isKeyDown("Digit1"))
            this.set(0);

        if(input.isKeyDown("Digit2"))
            this.set(5);

        if(input.isKeyDown("Digit3"))
            this.set(10);
    } */
}