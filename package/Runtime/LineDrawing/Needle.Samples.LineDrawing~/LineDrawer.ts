import { Behaviour, GameObject, serializable } from "@needle-tools/engine";
import { OrbitControls, RaycastOptions, Mathf, getWorldPosition, KeyCode, PlayerColor, ControllerEvents, WebXRController } from "@needle-tools/engine";
import * as THREE from 'three';
import { Object3D, Color, Ray, Raycaster, Vector3 } from "three";
import { LineHandle, LinesManager } from "./LinesManager";
import { MeshLine, MeshLineMaterial } from 'three.meshline';

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

    start() {
        if (!this.lines) {
            this.lines = GameObject.getComponent(this.gameObject, LinesManager)!;
            if (!this.lines)
                this.lines = GameObject.addNewComponent(this.gameObject, LinesManager);
        }
        //this.orbit = GameObject.findObjectOfType(OrbitControls, this.context) ?? undefined;
        this._states["mouse"] = new LineState();


        const xrControllerSelected: { [key: string]: boolean } = {};

        WebXRController.addEventListener(ControllerEvents.SelectStart, (ctrl, _) => {
            xrControllerSelected[ctrl.controller.uuid] = true;
        });
        WebXRController.addEventListener(ControllerEvents.Update, (ctrl, _) => {
            if (xrControllerSelected[ctrl.controller.uuid] === true) {
                const ray = ctrl.getRay();
                this.updateLine(ctrl.controller.uuid, ray, true, false, false);
            }
        });
        WebXRController.addEventListener(ControllerEvents.SelectEnd, (ctrl, _) => {
            xrControllerSelected[ctrl.controller.uuid] = false;
            const ray = ctrl.getRay();
            this.updateLine(ctrl.controller.uuid, ray, true, true, false);
        });
    }

    private _states: { [id: string]: LineState } = {};
    private _isDrawing: boolean = false;

    update() {
        //if (this.orbit && this._states["mouse"]) {
        //    if (this.orbit) this.orbit.enabled = !this._states["mouse"].isDrawing;
        //}
        if (!this.context.mainCamera) return;

        const multi = this.context.input.getPointerPressedCount() > 1;
        const sp = this.context.input.getPointerPositionRC(0);
        if (!sp) return;

        LinesDrawer._raycaster.setFromCamera(sp, this.context.mainCamera);
        const ray = LinesDrawer._raycaster.ray;
        if (!this._isDrawing) {
            if (this.context.input.getPointerDown(0)) {
                this._isDrawing = true;
            }
        }
        else if (this.context.input.getPointerUp(0)) {
            this._isDrawing = false;
            const state = this._states["mouse"];
            if(state) {
                if (state.currentHandle) {
                    this.lines.endLine(state.currentHandle);
                    state.currentHandle = null;
                    state.isDrawing = false;
                }
            }
        }
        else {
            this.updateLine("mouse", ray,
                this.context.input.getPointerPressed(0),
                this.context.input.getPointerUp(0), multi || this.context.input.isKeyPressed("LeftAlt")
            );
        }
    }

    private updateLine(id: string, ray: THREE.Ray, active: boolean, finish: boolean, cancel: boolean = false): LineState {
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
            const hit = this.getHit(ray);
            let pt: THREE.Vector3 | null = null;
            let prev = state.prevDistance;
            if(state.maxDistance === 0) {
                state.maxDistance = this.context.mainCamera?.getWorldPosition(new Vector3()).length() ?? 0;
                prev = state.maxDistance;
            }
            if (hit) {
                if (!state.currentHandle) {
                    state.maxDistance = hit.distance;
                }
                pt = hit.point;
                if (hit.face)
                    pt.add(hit.face.normal.multiplyScalar(0.01));
                state.prevDistance = hit.distance;
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

            if (pt) {
                if (!state.currentHandle) {
                    let parent = state.lastParent ?? this.gameObject as THREE.Object3D;
                    if (this.addToPaintedObject && hit) parent = hit.object;
                    state.lastParent = parent;
                    state.currentHandle = this.lines.startLine(parent, { material: this.createRandomMaterial() });
                }

                if (this.alignToSurface) {
                    if (state.prevDistance > state.maxDistance || Math.abs(prev - state.prevDistance) > 0.2) {
                        const newDistance = state.maxDistance;
                        // if (state.maxDistance === 0) state.maxDistance = newDistance;
                        // const camPos = getWorldPosition(this.context.mainCamera);
                        pt = ray.origin.add(ray.direction.multiplyScalar(newDistance));
                        // pt = camPos.add(dir.multiplyScalar(newDistance));
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
    private static _raycaster: Raycaster = new Raycaster();

    private getHit(ray: THREE.Ray): THREE.Intersection | null {
        if (!this.colliders || this.colliders.length === 0) {
            this.colliders = [this.gameObject];
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
        // const col = new THREE.Color("hsl(0, 100%, 50%)");

        return new MeshLineMaterial({
            color: col,
            lineWidth: Mathf.lerp(0.005, 0.01, Math.random()),
        });
    }
}
