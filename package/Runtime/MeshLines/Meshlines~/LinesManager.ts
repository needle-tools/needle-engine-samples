import { Behaviour, GameObject } from "@needle-tools/engine";
import * as THREE from 'three';
import { Color, Material } from "three";
import { MeshLine, MeshLineMaterial } from 'three.meshline';



export declare type LineOptions = {
    material?: Material;
    options?: LineMaterialOptions;
}

export declare type LineMaterialOptions = {
    map?: THREE.Texture;
    useMap?: number;
    alphaMap?: THREE.Texture;
    color?: Color;
    opacity?: number;
    lineWidth?: number;
}

export class LineInstanceHandler {
    id: number = 0;
    points: Array<any> = [];
    line: MeshLine = new MeshLine();
    material?: MeshLineMaterial;
    mesh?: THREE.Mesh;

    constructor(owner: THREE.Object3D, options?: LineOptions) {
        if (options) {
            this.material = options.material;
        }

        if (!this.material)
            this.material = this.defaultLineMaterial;
        if (options) {
            const opts = options.options;
            if (opts) {
                Object.assign(this.material, opts);
            }
        }
        this.mesh = new THREE.Mesh(this.line, this.material);
        owner.add(this.mesh);
    }

    private static wp: THREE.Vector3 = new THREE.Vector3();

    appendPoint(vec: Vec3): Vec3 {
        let localPoint = LineInstanceHandler.wp;
        localPoint.set(vec.x, vec.y, vec.z);
        const parent = this.mesh?.parent;
        if (parent) {
            localPoint = parent.worldToLocal(localPoint);
            vec.x = localPoint.x;
            vec.y = localPoint.y;
            vec.z = localPoint.z;
        }

        this.points.push(vec.x, vec.y, vec.z);
        this.line.setPoints(this.points);
        return vec;
    }

    private defaultLineMaterial = new MeshLineMaterial({ color: 0x999999, lineWidth: 0.01 });
}

declare type Vec3 = {
    x: number;
    y: number;
    z: number;
}

declare type StartLineModel = {
    id: number;
    parentGuid: string;
}

declare type LineModel = {
    parentGuid: string;
    guid: number; // it must be named guid
    points: Array<Vec3>;
    width: number;
    color: Vec3;
    startIndex: number;
    finished: boolean;
}

export declare type LineHandle = {
    id: number;
}

declare type UpdateLineArgs = {
    point: Vec3;
}


export class LinesManager extends Behaviour {

    public startLine(parent?: THREE.Object3D, options?: LineOptions): LineHandle {
        const id = Math.random() * Number.MAX_SAFE_INTEGER;
        return this.internalStartLine(parent, id, true, options);
    }

    public updateLine(handle: LineHandle, args: UpdateLineArgs) {
        const line = this.inFlight[handle.id];
        if (!line) return;
        if (args.point) {
            args.point = line.appendPoint(args.point);
        }
        const buf = this.buffer[handle.id];
        if (buf) {
            if (args.point)
                buf.push(args.point.x, args.point.y, args.point.z);
            if (buf.length > 5) {
                this.sendLineUpdate(line, false, undefined, buf);
                buf.length = 0;
            }
        }
    }

    public endLine(handle: LineHandle, send: boolean = true): LineInstanceHandler | undefined {
        const line = this.inFlight[handle.id];
        if (!line) return undefined;
        this.finished.push(line);
        delete this.inFlight[handle.id];

        if (send)
            this.sendLineUpdate(line, true, 0);

        const buf = this.buffer[handle.id];
        if (buf) {
            delete this.buffer[handle.id];
            const arr = buf;
            arr.length = 0;
            this.freeBuffer.push(arr);
        }

        return line;
    }

    public getLine(handle: LineHandle): LineInstanceHandler | undefined {
        return this.inFlight[handle.id];
    }

    private finished: Array<LineInstanceHandler> = [];
    private inFlight: { [key: number]: LineInstanceHandler } = [];
    private buffer: { [key: number]: any[] } = {};
    private freeBuffer = new Array<Vec3[]>();

    awake(): void {

        this.context.connection.beginListen("line-start", (i: StartLineModel) => {
            this.onEnsureLine(i.id, i.parentGuid);
        });
        this.context.connection.beginListen("line-update", (evt: LineModel) => {
            let line = this.onEnsureLine(evt.guid, evt.parentGuid);
            if (line && evt.points) {
                if (evt.startIndex <= 0) {
                    line.points = evt.points;
                }
                else {
                    if (evt.startIndex >= line.points.length) {
                        line.points.push(...evt.points);
                    }
                }
                line.line.setPoints(line.points);
                line.material!.lineWidth = evt.width;
                line.material!.color.fromArray(evt.color);
                if (evt.finished === true) {
                    this.endLine({ id: line.id }, false);
                }
            }
        });
    }

    private onEnsureLine(lineId: number, parentGuid: string): LineInstanceHandler | null {
        if (this.inFlight[lineId]) return this.inFlight[lineId];
        let obj = GameObject.findByGuid(parentGuid, this.context.scene);
        if (!obj) {
            return null;
        }
        this.internalStartLine(obj as THREE.Object3D, lineId, false);
        return this.inFlight[lineId];
    }
    private internalStartLine(parent: THREE.Object3D | null | undefined, id: number, send: boolean = true, options?: LineOptions): LineHandle {
        const line = new LineInstanceHandler(parent ?? this.context.scene, options);
        line.id = id;
        this.inFlight[id] = line;
        if (send)
            this.sendLineStart(line);

        let buf;
        if (this.freeBuffer.length <= 0) buf = new Array<Vec3>();
        else buf = this.freeBuffer.pop();
        this.buffer[id] = buf;
        return { id: id };
    }

    private sendLineStart(instance: LineInstanceHandler) {
        const parent = instance.mesh!.parent;
        this.context.connection.send("line-start", { id: instance.id, parentGuid: parent ? parent["guid"] : undefined })
    }

    private sendLineUpdate(instance: LineInstanceHandler, finished: boolean, startIndex?: number, points?: Array<any>) {
        if (instance) {
            const model: LineModel = {
                parentGuid: instance.mesh!.parent!["guid"],
                guid: instance.id,
                points: points ? [...points] : instance.points,
                width: instance.material!.lineWidth,
                color: instance.material!.color.toArray(),
                startIndex: startIndex !== undefined ? startIndex : instance.points.length,
                finished: finished,
            };
            this.context.connection.send("line-update", model)
        }
    }
}
