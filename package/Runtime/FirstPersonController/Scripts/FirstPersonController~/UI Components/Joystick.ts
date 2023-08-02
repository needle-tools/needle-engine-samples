import { Behaviour, EventList, IPointerDownHandler, IPointerMoveHandler, IPointerUpHandler, Input, Mathf, PointerEventData, Rect, RectTransform, isMobileDevice, serializable } from "@needle-tools/engine";
import { Vector2, Vector3 } from "three";

// TODO: improve joystick works only while anchored to bottom left corner, otherwise we can't calculate the origin correctly
// If something changed we need to test it and reimplement this!
export class Joystick extends Behaviour implements IPointerDownHandler, IPointerUpHandler
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

    private mousepos: Vector2 = new Vector2();
    private joyPos: Vector2 = new Vector2();
    private joyInitPos: Vector2 = new Vector2();
    private isDragging;
    private joyState: Vector2 = new Vector2();
    private pointerID: number = -1;

    awake() {
        if (this.joystick) 
            this.joyInitPos?.copy(this.joystick.anchoredPosition);
    }

    update(): void {
        if (this.joystick) {
            const target = this.isDragging ? this.joyPos : this.joyInitPos;
            this.joystick.anchoredPosition.lerp(target, this.visualSmoothing * this.context.time.deltaTime);
        }

        if (this.isDragging)
        {
            const input = this.context.input;
            const mousePos = input.getPointerPosition(this.pointerID);
            
            if (!this.touchArea || !this.joystick || !mousePos) {
                return;
            }
            
            /*const v = new Vector3();
            v.x = mousePos.x;
            v.y = mousePos.y;

            this.touchArea.shadowComponent!.worldToLocal(v);

            console.log(mousePos, v, this.touchArea.gameObject.position); */

            const rect = this.touchArea["rect"] as Rect;
            const origin = this.touchArea["position"] as Vector2;

            if (rect && origin)
            {
                this.mousepos.copy(mousePos);
                this.mousepos.y = this.context.domHeight - this.mousepos.y; //invert the Y axis
    
                this.joyPos.copy(this.mousepos);
                this.joyPos.sub(origin);
                
                const size = (rect.width / 2) * this.scale;
                this.joyPos.divideScalar(size);
                this.joyState.copy(this.joyPos);
                this.joyState.multiplyScalar(this.scale);

                if (this.invertX)
                    this.joyState.x *= -1;
                if (this.invertY)
                    this.joyState.y *= -1;
    
                if (this.joyState.length() > this.deadzone)
                {
                    this.joyState.multiplyScalar(this.sensitivity);
                    if (this.clampOutput) {
                        this.joyState.clampLength(0, 1);
                    }

                    this.onMove.invoke(this.joyState);
                }
    
                this.joyPos.clampLength(0, 1);
                this.joyPos.multiplyScalar(size);
            }
        }
    }

    onPointerDown(args: PointerEventData) {
        if (this.isDragging || args.pointerId === undefined)
            return;

        this.isDragging = true;
        this.pointerID = args.pointerId!;
        
        args.use();
    }

    onPointerUp(args: PointerEventData) {
        if (!this.isDragging || args.pointerId !== this.pointerID)
            return;

        this.isDragging = false;
        args.use();
    }
}