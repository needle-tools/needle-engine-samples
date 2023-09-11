import { Behaviour, EventList, IPointerDownHandler, IPointerMoveHandler, IPointerUpHandler, Input, Mathf, PointerEventData, Rect, RectTransform, isMobileDevice, serializable } from "@needle-tools/engine";
import nipplejs from "nipplejs";
import { Vector2, Vector3 } from "three";

// TODO: improve joystick works only while anchored to bottom left corner, otherwise we can't calculate the origin correctly
// If something changed we need to test it and reimplement this!
export class Joystick extends Behaviour
{
    @serializable(RectTransform)
    touchArea?: RectTransform;

    @serializable(RectTransform)
    joystick?: RectTransform;

    @serializable()
    visualSmoothing: number = 1;

    @serializable()
    scale: number = 1;

    // @nonSerialized
    @serializable(EventList)
    onMove: EventList = new EventList();

    @serializable()
    invertX: boolean = false;

    @serializable()
    invertY: boolean = false;

    @serializable()
    sensitivity: number = 1;

    @serializable()
    deadzone: number = 0.1;

    @serializable()
    clampOutput: boolean = true;

    onDisable(): void {
        
    }
}