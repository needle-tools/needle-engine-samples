import { Behaviour, EventList, WebXR, serializable, logHierarchy, NeedleXREventArgs } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

export class XRLifecycleEvents extends Behaviour {

    @serializable(EventList)
    onSessionStart: EventList = new EventList();

    @serializable(EventList)
    onSessionEnd: EventList = new EventList();

    onEnterXR(_args: NeedleXREventArgs): void {
        this.onWebXRStarted();
    }

    onExitXR(_args: NeedleXREventArgs): void {
        this.onWebXREnded();
    }

    private onWebXRStarted() {
        // logHierarchy(this.context.scene, false);
        this.onSessionStart.invoke();
    }

    private onWebXREnded() {
        // logHierarchy(this.context.scene, false);
        this.onSessionEnd.invoke();
    }
}