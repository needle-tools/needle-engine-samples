import { BehaviorModel, Behaviour, findObjectOfType, NetworkedStreamEvents, NetworkedStreams, PeerHandle, StreamEndedEvent, StreamReceivedEvent, SyncedRoom, Voip } from "@needle-tools/engine";



export class FaceFilterVideoCall extends Behaviour {


    private _streams?: NetworkedStreams;


    onEnable(): void {

        const syncedRoom = findObjectOfType(SyncedRoom);
        if(!syncedRoom){
            this.context.scene.addComponent(SyncedRoom);
        }
        const voip = findObjectOfType(Voip);
        if(!voip){
            this.context.scene.addComponent(Voip);
        }

        this._streams ??= new NetworkedStreams(this);

        this._streams.enable();
        this._streams?.addEventListener(NetworkedStreamEvents.StreamReceived, this.onReceiveStream);
        this._streams?.addEventListener(NetworkedStreamEvents.StreamEnded, this.onEndStream);
        
        const myStream = this.context.renderer.domElement.captureStream(30);
        this._streams.startSendingStream(myStream);
        this._callElements.push(this.context.renderer.domElement);
    }
    onDisable(): void {
        this._streams?.disable();
        this._streams?.removeEventListener(NetworkedStreamEvents.StreamReceived, this.onReceiveStream);
        this._streams?.removeEventListener(NetworkedStreamEvents.StreamEnded, this.onEndStream);
    }

    private _videos: Map<string, HTMLVideoElement> = new Map();
    private _callElements: HTMLElement[] = [];

    private onEndStream = (evt: StreamEndedEvent) => {
        const video = this._videos.get(evt.userId);
        if (video) {
            video.srcObject = null;
            video.remove();
            this._videos.delete(evt.userId);
            this._callElements = this._callElements.filter(el => el != video);
            this.onElementsChanged();
        }
    }

    private onReceiveStream = (evt: StreamReceivedEvent) => {
        let video = this._videos.get(evt.userId);
        if (!video) {
            video = document.createElement("video");
            video.style.cssText = `
                width: 30%;
                height: auto;
            `
            this._videos.set(evt.userId, video);
            this._callElements.push(video);
            this.context.domElement.appendChild(video);
            this.onElementsChanged();
        }
        video.srcObject = evt.stream;
        video.play();
    }


    private _container?: HTMLElement;

    private onElementsChanged() {
        if (!this._container) {
            this._container = document.createElement("div");
            this._container.style.cssText = `
                display: grid;
            `
        }
        // make a grid that fits all elements.
        // if we're at 1 element, make it 1x1
        // if we're at 2 elements, make it 1x2
        // if we're at 3 elements, make it 2x2
        // if we're at 4 elements, make it 2x2
        // if we're at 5 elements, make it 2x3

        this._container.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(this._callElements.length))}, 1fr)`;
        for (const el of this._callElements) {
            el.style.width = "100%";
            el.style.height = "auto";
            this._container.appendChild(el);
        }
        if (this._container.parentNode != this.context.domElement) {
            this.context.domElement.appendChild(this._container);
        }
    }

}