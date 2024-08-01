import { Behaviour, GameObject, NEPointerEvent, serializable, RaycastOptions, Mathf, getWorldPosition, PlayerColor, NeedleXRController, IPointerHitEventReceiver, Gizmos } from "@needle-tools/engine";
import { Object3D, Color, Vector3, Vector2, Ray, Intersection } from "three";
import { LineHandle, LinesManager } from "./LinesManager";
import { MeshLineMaterial } from 'meshline';

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
    alignToSurface: boolean = true;
    addToPaintedObject: boolean = true;

    //private orbit?: OrbitControls;

    onEnable(): void {
        this.context.input.addEventListener("pointerdown", this._onPointerDown);
        // this.context.input.addEventListener("pointermove", this._onPointerMove, { queue: -200 });
        this.context.input.addEventListener("pointerup", this._onPointerUp);
    }

    onDisable(): void {
        this.context.input.removeEventListener("pointerdown", this._onPointerDown);
        // this.context.input.removeEventListener("pointermove", this._onPointerMove);
        this.context.input.removeEventListener("pointerup", this._onPointerUp);
    }
    
    private data: Map<string, EvtData> = new Map();

    private _onPointerDown = (args: NEPointerEvent) => {
        if (args.button !== 0) return;
        args.use();
        this.data.set(args.pointerId.toString(), {
            origin: args.origin,
            pointerId: args.pointerId,
            isSpatial: args.isSpatial,
            space: args.space,
        });
        args.use();
    }

    /*
    private _onPointerMove = (args: NEPointerEvent) => {
        if (args.button !== 0) return;
        if (!this.context.input.getPointerPressed(args.pointerId)) return;

        this.onPointerUpdate(args);

        args.use();
        args.preventDefault();
    }
    */

    private _onPointerUp = (args: NEPointerEvent) => {
        if (args.button !== 0) return;

        this.onPointerUpdate(args);

        this.data.delete(args.pointerId.toString());
    }

    update() {
        for (const [key, value] of this.data) {
            this.onPointerUpdate(value);
        }
    }

    private _ray: Ray = new Ray();
    private onPointerUpdate(args: EvtData) {
        const finish = this.context.input.getPointerUp(args.pointerId);
        const isSpatialDevice = args.isSpatial;

        let width = 1;
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

        if (finish || width > 0)
        {
            this._ray.set(args.space.worldPosition, args.space.worldForward);
            this.updateLine(args.pointerId.toString(), isSpatialDevice, this._ray, width, true, finish, false);
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
                // this.sendLineUpdate();
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
                const dist = .01 * xrScale * -1;
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
                    state.currentHandle = this.lines.startLine(lineParent, { material: this.createRandomMaterial() });
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
                    const comp = state.prevDistance * .01 * (isSpatial ? 0.00001 : 1);
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

    private createRandomMaterial() {
        let col: Color;
        if (this.context.connection.connectionId)
            col = PlayerColor.colorFromHashCode(PlayerColor.hashCode(this.context.connection.connectionId));
        else
            col = new Color("hsl(" + (Math.random() * 100).toFixed(0) + ", 80%, 30%)");

        return new MeshLineMaterial({
            color: col,
            lineWidth: 0.005, // Mathf.lerp(0.005, 0.01, Math.random()),
            resolution: new Vector2(window.innerWidth, window.innerHeight),
        });
    }
}
