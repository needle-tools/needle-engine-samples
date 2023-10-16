import { Behaviour, EventList, WebXR, WebXREvent, serializable, logHierarchy } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

export class XRLifecycleEvents extends Behaviour {

    @serializable(EventList)
    onSessionStart: EventList = new EventList();

    @serializable(EventList)
    onSessionEnd: EventList = new EventList();

    private _webXRStartedListener: any;
    private _webXREndedListener: any;

    onEnable() {
        this._webXRStartedListener = WebXR.addEventListener(WebXREvent.XRStarted, this.onWebXRStarted.bind(this));
        this._webXREndedListener = WebXR.addEventListener(WebXREvent.XRStopped, this.onWebXREnded.bind(this));
    }

    onDisable() {
        WebXR.removeEventListener(WebXREvent.XRStarted, this._webXRStartedListener);
        WebXR.removeEventListener(WebXREvent.XRStopped, this._webXREndedListener);
    }
    private onWebXRStarted() {
        logHierarchy(this.context.scene, false);
        this.onSessionStart.invoke();
    }

    private onWebXREnded() {
        logHierarchy(this.context.scene, false);
        this.onSessionEnd.invoke();
    }
}