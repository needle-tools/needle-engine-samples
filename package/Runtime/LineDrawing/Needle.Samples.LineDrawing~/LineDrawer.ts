import { Behaviour, GameObject, NEPointerEvent, serializable, RaycastOptions, getWorldPosition, PlayerColor, NeedleXRController, IPointerHitEventReceiver, InputEventQueue } from "@needle-tools/engine";
import { Object3D, Color, Vector3, Ray, Intersection } from "three";
import { LineHandle, LinesManager } from "./LinesManager";

class LineState {
    isDrawing: boolean;
    lastHit: Vector3;
    currentHandle: LineHandle | null;
    maxDistance: number;
    prevDistance: number;
    lastParent: Object3D | null;

    constructor() {
        this.isDrawing = false;
        this.lastHit = new Vector3();
        this.currentHandle = null;
        this.maxDistance = 0;
        this.prevDistance = 0;
        this.lastParent = null;
    }
}

declare type EvtData = {
    origin: object & Partial<IPointerHitEventReceiver>;
    pointerId: number;
    isSpatial: boolean;
    space: GameObject;
}

export class LinesDrawer extends Behaviour {

    //@type LinesManager
    @serializable(LinesManager)
    lines!: LinesManager;

    //@type UnityEngine.Transform[]
    @serializable(Object3D)
    colliders?: Object3D[];

    @serializable()
    alignToSurface: boolean = true;

    @serializable()
    addToPaintedObject: boolean = true;

    @serializable()
    brushName: string = "default";

    @serializable(Color)
    brushColor: Color = new Color(1, 1, 1);

    @serializable()
    useBrushColor: boolean = false;

    onEnable(): void {
        // We want to listen to pointer events late to check if any of them have been used. this allows us to e.g. use DragControl events or buttons
        this.context.input.addEventListener("pointerdown", this._onPointerDown, { queue: InputEventQueue.Default + 10 });
        // We want to listen to move events early to "use" them if they belong to a drawing action
        this.context.input.addEventListener("pointermove", this._onPointerMove, { queue: InputEventQueue.Early });
        this.context.input.addEventListener("pointerup", this._onPointerUp);
    }

    onDisable(): void {
        this.context.input.removeEventListener("pointerdown", this._onPointerDown);
        this.context.input.removeEventListener("pointermove", this._onPointerMove);
        this.context.input.removeEventListener("pointerup", this._onPointerUp);
    }

    private data: Set<number> = new Set();
    setColor(color: string)
    setColor(color: Color | string) {
        if (typeof color === "string") {
            if (!color.startsWith("#")) color = "#" + color;
            this.brushColor.set(color);
        } else {
            this.brushColor.copy(color);
        }
        this.useBrushColor = true;
    }

    setBrush(name: string) {
        this.brushName = name;
    }

    private _onPointerDown = (args: NEPointerEvent) => {
        if (args.button !== 0) return;
        if (args.used) return;
        if (args.defaultPrevented) return;
        args.use();
        if (args.origin instanceof NeedleXRController) {
            args.origin.pointerMoveAngleThreshold = 0;
            args.origin.pointerMoveDistanceThreshold = 0;
        }
        this.data.add(args.pointerId);
    }

    private _onPointerMove = (args: NEPointerEvent) => {
        if (args.button !== 0) return;
        if (args.used) return;
        if (!this.data.has(args.pointerId)) return;
        args.use();
        args.preventDefault();
        this.onPointerUpdate(args);
    }


    private _onPointerUp = (args: NEPointerEvent) => {
        if (args.button !== 0) return;
        if (!this.data.has(args.pointerId)) return;
        this.data.delete(args.pointerId);
        if (args.origin instanceof NeedleXRController) {
            args.origin.pointerMoveAngleThreshold = 0.1;
            args.origin.pointerMoveDistanceThreshold = 0.05;
        }
        this.onPointerUpdate(args);
    }

    private onPointerUpdate(args: NEPointerEvent) {
        const finish = this.context.input.getPointerUp(args.pointerId);
        const isSpatialDevice = args.isSpatial;

        let width = 2;
        if (args.origin instanceof NeedleXRController) {
            const spatialLineWidth = 1;

            const btn = args.origin.getButton("primary");
            if (btn !== undefined) {
                // currently, this starts at 0.1, so we remap 0.1..1 to 0..1
                const remapped = (btn.value - 0.2) / 0.8;
                width = remapped * spatialLineWidth;
            }

            // Get axis for pen tip. Currently, this requires still putting light touch on the trigger,
            // otherwise it's not a "pointer down" event.
            const tip2Axis = args.origin.getStick("xr-standard-thumbstick");
            if (tip2Axis !== undefined && tip2Axis.x < 0) {
                width = -tip2Axis.x * spatialLineWidth;
            }
        }

        if (finish || width > 0) {
            this.updateLine(args.pointerId.toString(), isSpatialDevice, args.ray, width, true, finish, false);
        }
    }

    start() {
        if (!this.lines) {
            this.lines = GameObject.getComponent(this.gameObject, LinesManager)!;
            if (!this.lines)
                this.lines = GameObject.addComponent(this.gameObject, LinesManager);
        }

        this._states["mouse"] = new LineState();
    }

    private _states: { [id: string]: LineState } = {};

    private updateLine(id: string, isSpatial: boolean, ray: Ray, width: number, active: boolean, finish: boolean, cancel: boolean = false): LineState {
        let state = this._states[id];
        if (!state) {
            this._states[id] = new LineState();
            state = this._states[id];
        }

        if (finish) {
            state.isDrawing = false;
            if (state.currentHandle) {
                this.lines.endLine(state.currentHandle);
                state.currentHandle = null;
            }
        }
        else if (active) {
            if (cancel) {
                return state;
            }
            let pt: Vector3 | null = null;
            let hitParent: Object3D | null = null;
            let prev = state.prevDistance;
            if (state.maxDistance === 0) {
                state.maxDistance = this.context.mainCamera?.getWorldPosition(new Vector3()).length() ?? 0;
                prev = state.maxDistance;
            }

            if (isSpatial) {
                const xrScale = this.context.xr?.rigScale || 1;
                // TODO for a pen this needs to be super accurate (dist=0)
                // but for a controller we need to add a bit of distance
                // HACK for wrong pen alignment on v67, adjust on v68
                const controllerOffset = 0;
                const dist = .01 * xrScale * controllerOffset;
                pt = ray.origin.add(ray.direction.multiplyScalar(dist));
                // this controls how many points are drawn per unit of distance
                state.prevDistance = xrScale * .1;
            }
            else {
                const hit = this.getHit(ray);
                if (hit) {
                    if (!state.currentHandle) {
                        state.maxDistance = hit.distance;
                    }
                    pt = hit.point;
                    if (pt && hit.face)
                        pt.add(hit.face.normal.multiplyScalar(0.01));
                    state.prevDistance = hit.distance;
                    hitParent = hit.object;
                }
                else if (state.maxDistance > 0) {
                    let dist = state.maxDistance;
                    // if we start drawing in thin air:
                    if (!state.currentHandle && state.lastHit) {
                        const wp = getWorldPosition(this.context.mainCamera!);
                        dist = state.lastHit.distanceTo(wp);
                    }
                    pt = ray.origin.add(ray.direction.multiplyScalar(state.maxDistance));
                    state.prevDistance = state.maxDistance;
                }
            }

            if (pt) {
                // abort the draw if the drawn segment is too long
                if (state.lastHit.distanceTo(pt) > 6) {
                    if (state.currentHandle) {
                        // this.sendLineUpdate();
                        this.lines.endLine(state.currentHandle);
                        state.currentHandle = null;
                        return state;
                    }
                }

                if (!state.currentHandle) {
                    let lineParent = state.lastParent ?? this.gameObject as Object3D;
                    if (this.addToPaintedObject && hitParent) lineParent = hitParent;
                    state.lastParent = lineParent;
                    state.currentHandle = this.lines.startLine(lineParent, this.brushName);
                    // here, we can override the color
                    if (state.currentHandle) {
                        const line = this.lines.getLine(state.currentHandle);
                        line?.material?.color?.set(this.getPaintColor());
                    }
                }

                if (this.alignToSurface) {
                    if (state.prevDistance > state.maxDistance || Math.abs(prev - state.prevDistance) > 0.2) {
                        const newDistance = state.maxDistance;
                        pt = ray.origin.add(ray.direction.multiplyScalar(newDistance));
                        state.prevDistance = newDistance;
                    }
                }
                if (state.lastHit) {
                    const dist = state.lastHit.distanceTo(pt);
                    const comp = state.prevDistance * (isSpatial ? 0.000001 : .002);
                    if (dist < comp) {
                        return state;
                    }
                }
                this.lines.updateLine(state.currentHandle, { point: pt, width: width });
                state.lastHit.copy(pt);
            }

            state.isDrawing = state.currentHandle !== null;
        }
        return state;
    }

    private _raycastOptions = new RaycastOptions();

    private getHit(ray: Ray): Intersection | null {
        if (!this.colliders || this.colliders.length === 0) {
            this.colliders = [this.gameObject];
        }
        // remove invalid entries
        for (let i = this.colliders.length - 1; i >= 0; i--) {
            const entry = this.colliders[i];
            if (!entry) {
                this.colliders.splice(i, 1);
            }
        }
        this._raycastOptions.targets = this.colliders;
        this._raycastOptions.ray = ray;
        const hits = this.context.physics.raycast(this._raycastOptions);
        if (hits.length > 0) {
            for (const hit of hits) {
                if (!GameObject.isActiveInHierarchy(hit.object)) {
                    continue;
                }
                return hit;
            }
        }
        return null;
    }

    private getPaintColor() {
        let col: Color;
        if (this.useBrushColor) {
            col = new Color(this.brushColor.r, this.brushColor.g, this.brushColor.b);
        }
        else if (this.context.connection.connectionId)
            col = PlayerColor.colorFromHashCode(PlayerColor.hashCode(this.context.connection.connectionId));
        else
            col = new Color("hsl(" + (Math.random() * 100).toFixed(0) + ", 80%, 30%)");

        return col;
    }
}
