import { Behaviour, GameObject, NEPointerEvent, serializable, RaycastOptions, Mathf, getWorldPosition, PlayerColor } from "@needle-tools/engine";
import * as THREE from 'three';
import { Object3D, Color, Vector3 } from "three";
import { LineHandle, LinesManager } from "./LinesManager";
import { MeshLineMaterial } from 'three.meshline';

class LineState {
    isDrawing: boolean;
    lastHit: Vector3;
    currentHandle: LineHandle | null;
    maxDistance: number;
    prevDistance: number;
    lastParent: THREE.Object3D | null;

    constructor() {
        this.isDrawing = false;
        this.lastHit = new Vector3();
        this.currentHandle = null;
        this.maxDistance = 0;
        this.prevDistance = 0;
        this.lastParent = null;
    }
}

export class LinesDrawer extends Behaviour {

    //@type LinesManager
    @serializable(LinesManager)
    lines!: LinesManager;
    //@type UnityEngine.Transform[]
    @serializable(Object3D)
    colliders?: THREE.Object3D[];
    alignToSurface: boolean = true;
    addToPaintedObject: boolean = true;

    //private orbit?: OrbitControls;

    onEnable(): void {
        this.context.input.addEventListener("pointerdown", this._onPointerDown);
        this.context.input.addEventListener("pointermove", this._onPointerMove);
        this.context.input.addEventListener("pointerup", this._onPointerUp);
    }

    onDisable(): void {
        this.context.input.removeEventListener("pointerdown", this._onPointerDown);
        this.context.input.removeEventListener("pointermove", this._onPointerMove);
        this.context.input.removeEventListener("pointerup", this._onPointerUp);
    }

    private _onPointerDown = (args: NEPointerEvent) => {
        if (args.button !== 0) return;
    }

    private _onPointerMove = (args: NEPointerEvent) => {
        if (args.button !== 0) return;

        if (!this.context.input.getPointerPressed(args.pointerId)) return;

        this.onPointerUpdate(args);
    }

    private _onPointerUp = (args: NEPointerEvent) => {
        if (args.button !== 0) return;

        this.onPointerUpdate(args);
    }

    private onPointerUpdate(args: NEPointerEvent) {
        const finish = this.context.input.getPointerUp(args.pointerId);
        const isSpatialDevice = args.isSpatial;
        this.updateLine(args.pointerId.toString(), isSpatialDevice, args.ray, true, finish, false);
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

    private updateLine(id: string, isSpatial: boolean, ray: THREE.Ray, active: boolean, finish: boolean, cancel: boolean = false): LineState {
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
            let pt: THREE.Vector3 | null = null;
            let hitParent: THREE.Object3D | null = null;
            let prev = state.prevDistance;
            if (state.maxDistance === 0) {
                state.maxDistance = this.context.mainCamera?.getWorldPosition(new Vector3()).length() ?? 0;
                prev = state.maxDistance;
            }

            if (isSpatial) {
                const xrScale = this.context.xr?.rigScale || 1;
                const dist = .01 * xrScale;
                pt = ray.origin.add(ray.direction.multiplyScalar(dist));
                // this controls how many points are drawn per unit of distance
                state.prevDistance = xrScale * .003;
            }
            else {
                const hit = this.getHit(ray);
                if (hit) {
                    if (!state.currentHandle) {
                        state.maxDistance = hit.distance;
                    }
                    pt = hit.point;
                    if (hit.face)
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
                    let lineParent = state.lastParent ?? this.gameObject as THREE.Object3D;
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
                if (state.lastHit && state.lastHit.distanceTo(pt) < state.prevDistance * .01) {
                    return state;
                }
                this.lines.updateLine(state.currentHandle, { point: pt });
                state.lastHit.copy(pt);
            }

            state.isDrawing = state.currentHandle !== null;
        }
        return state;
    }

    private _raycastOptions = new RaycastOptions();

    private getHit(ray: THREE.Ray): THREE.Intersection | null {
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
            col = new THREE.Color("hsl(" + (Math.random() * 100).toFixed(0) + ", 80%, 30%)");

        return new MeshLineMaterial({
            color: col,
            lineWidth: Mathf.lerp(0.005, 0.01, Math.random()),
        });
    }
}
