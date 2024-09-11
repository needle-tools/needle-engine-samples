import { Behaviour, GameObject, NEPointerEvent, serializable, RaycastOptions, getWorldPosition, PlayerColor, NeedleXRController, IPointerHitEventReceiver, InputEventQueue, enableSpatialConsole, getIconElement, Gizmos, getTempVector } from "@needle-tools/engine";
import { Object3D, Color, Vector3, Ray, Intersection } from "three";
import { LineHandle, LinesManager } from "./LinesManager";

class LineState {
    isDrawing: boolean;
    lastHit: Vector3 | undefined;
    currentHandle: LineHandle | null;
    maxDistance: number;
    totalDistance: number;
    prevDistance: number;
    lastParent: Object3D | null;

    constructor() {
        this.isDrawing = false;
        this.lastHit = undefined;
        this.currentHandle = null;
        this.totalDistance = 0;
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

    @serializable()
    brushWidth: number = 0.01;

    @serializable()
    createButton: boolean = true;

    private _allow2DDrawing: boolean = false;
    private _button?: HTMLElement;

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

    setWidth(width: number) {
        this.brushWidth = width;
    }


    onEnable(): void {
        // We want to listen to pointer events late to check if any of them have been used. this allows us to e.g. use DragControl events or buttons
        this.context.input.addEventListener("pointerdown", this._onPointerDown, { queue: InputEventQueue.Default + 10 });
        // We want to listen to move events early to "use" them if they belong to a drawing action
        this.context.input.addEventListener("pointermove", this._onPointerMove, { queue: InputEventQueue.Early });
        this.context.input.addEventListener("pointerup", this._onPointerUp);
        if (this.createButton) {
            this.updateButton();
        }
    }

    onDisable(): void {
        this.context.input.removeEventListener("pointerdown", this._onPointerDown);
        this.context.input.removeEventListener("pointermove", this._onPointerMove);
        this.context.input.removeEventListener("pointerup", this._onPointerUp);
    }

    private updateButton() {
        if (!this.createButton) {
            this._button?.remove();
            return;
        }
        else if (!this._button) {
            this._button = document.createElement("button");
            this._button.addEventListener("click", () => {
                this._allow2DDrawing = !this._allow2DDrawing;
                this.updateButton();
            });
        }
        this._button.setAttribute("priority", "10");
        this._button.innerText = this._allow2DDrawing ? "2D On" : "2D Off";
        this._button.prepend(getIconElement(this._allow2DDrawing ? "format_ink_highlighter" : "ink_highlighter")); // stylus_note
        this.context.menu.appendChild(this._button);
    }

    private readonly _activePointers: Set<number> = new Set();

    private _shouldHandle(args: NEPointerEvent) {
        if (args.button === 0) return true;
        // Handling for MX Ink / stylus based on button indices
        if (args.origin instanceof NeedleXRController && args.origin.isStylus && (args.button === 4 || args.button === 5)) return true;
        return false;
    }

    private _onPointerDown = (args: NEPointerEvent) => {
        if (!this._shouldHandle(args)) return;
        if (args.used) return;
        if (args.defaultPrevented) return;
        if (!args.isSpatial && !this._allow2DDrawing) {
            return;
        }
        args.use();
        if (args.origin instanceof NeedleXRController) {
            args.origin.pointerMoveAngleThreshold = 0;
            args.origin.pointerMoveDistanceThreshold = 0;
        }
        this.lastWidth = 0;
        this._activePointers.add(args.pointerId);
    }

    private _onPointerMove = (args: NEPointerEvent) => {
        if (!this._shouldHandle(args)) return;
        if (args.used) return;
        if (!this._activePointers.has(args.pointerId)) return;
        args.use();
        args.preventDefault();
        this.onPointerUpdate(args);
    }


    private _onPointerUp = (args: NEPointerEvent) => {
        if (!this._shouldHandle(args)) return;
        if (!this._activePointers.has(args.pointerId)) return;
        this._activePointers.delete(args.pointerId);
        if (args.origin instanceof NeedleXRController) {
            args.origin.pointerMoveAngleThreshold = 0.1;
            args.origin.pointerMoveDistanceThreshold = 0.05;
        }
        this.onPointerUpdate(args);
    }

    private lastWidth = 0;
    private _ray = new Ray();
    private onPointerUpdate(args: NEPointerEvent) {
        const finish = this.context.input.getPointerUp(args.pointerId);
        const isSpatialDevice = args.isSpatial;
        // TODO add pointer pen support
        const isStylusDevice = args.origin instanceof NeedleXRController && args.origin.isStylus;

        let width = 1;
        if (args.origin instanceof NeedleXRController) {
            const spatialLineWidth = 1;

            const btn = args.origin.getButton("primary");
            if (btn != undefined && args.button === 0) {
                width = btn.value * spatialLineWidth;
            }
            
            if (args.origin.isStylus) {
                width = args.pressure * spatialLineWidth;
            }
        }

        if (finish || width > 0 || this.lastWidth != width) {
            this.lastWidth = width;
            // We're using the "interactive space" of the input, which is dynamically adjusted
            // and is a combination of ray pose and grip pose depending on the device.
            // For example, a pen should paint with the tip, which is the ray pose; 
            // a hand should paint with the pinch point;
            // a transient-pointer should paint with the grip pose;
            // a Quest Pro controller pressure tip is a custom pose based on the grip pose.
            this._ray.set(args.space.worldPosition, args.space.worldForward);
            // for a hand, for now we overwrite this here and use the pinch point:
            if (args.origin instanceof NeedleXRController && args.origin.hand) {
                this._ray.set(args.origin.rayWorldPosition, args.space.worldForward);
                // this._ray.set(args.origin.pinchPosition, args.space.worldForward);
            }
            this.updateLine(args.pointerId.toString(), isSpatialDevice, isStylusDevice, this._ray, width, true, finish, false);
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

    private updateLine(id: string, isSpatial: boolean, isStylus: boolean, ray: Ray, width: number, active: boolean, finish: boolean, cancel: boolean = false): LineState {
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
                // abort the draw if the drawn segment is too long – e.g. longer than 1m
                if (state.lastHit !== undefined && state.lastHit.distanceTo(pt) > 1.0) {
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
                    state.lastHit = undefined;
                    state.prevDistance = 0;
                    state.maxDistance = 0;
                    state.totalDistance = 0;

                    // We can override the color and line width of new lines
                    if (state.currentHandle) {
                        const line = this.lines.getLine(state.currentHandle);
                        if (line && line.material) {
                            line.material.color?.set(this.getPaintColor());
                            line.material.lineWidth = this.brushWidth * line.material["brushWidth"];
                        }
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

                    // lazy line distance should probably be dependent on the device (pen vs controller vs hand)
                    const lazyLineDistance = isStylus ? 0.0005 : 0.005; // 0.5mm, 1cm, 5cm for testing.

                    if (dist < lazyLineDistance) {
                        Gizmos.DrawLine(state.lastHit, pt, 0xffffff);
                        return state;
                    }

                    // lazy line is stretched, we'll draw now
                    Gizmos.DrawLine(state.lastHit, pt, 0xff0000);

                    const direction = getTempVector(pt).sub(state.lastHit).normalize();
                    pt.sub(direction.multiplyScalar(lazyLineDistance));
                    
                    // Additionally, we don't want to draw too dense, so here's another check for a minimum distance between line segments.
                    const comp = state.prevDistance * (isSpatial ? 0.00002 : .002);
                    if (dist < comp) {
                        return state;
                    }

                }
                else {
                    // first point. this is always drawn
                    state.lastHit = pt.clone();
                    width = 0;
                }
                
                const drawnDistance = state.lastHit.distanceTo(pt);
                state.totalDistance += drawnDistance;
                if (drawnDistance >= 0.00001) // safeguard against ending up drawing the same point twice
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
