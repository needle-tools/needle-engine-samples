import { Behaviour, GameObject } from "@needle-tools/engine";
import { Color, Mesh, Object3D, Texture, Vector2, Vector3 } from "three";
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

export declare type LineOptions = {
    material?: MeshLineMaterial;
    options?: LineMaterialOptions;
}

export declare type LineMaterialOptions = {
    map?: Texture;
    useMap?: number;
    alphaMap?: Texture;
    color?: Color;
    opacity?: number;
    lineWidth?: number;
}

export class LineInstanceHandler {
    id: number = 0;
    points: Array<any> = [];
    widths: Array<number> = [];
    line: MeshLineGeometry = new MeshLineGeometry();
    material?: MeshLineMaterial;
    mesh?: Mesh;
    widthCbBinding: (percentage: number) => number;

    constructor(owner: Object3D, options?: LineOptions) {
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
        this.mesh = new Mesh(this.line, this.material);
        owner.add(this.mesh);
        this.widthCbBinding = this.widthCb.bind(this);
    }

    private static wp: Vector3 = new Vector3();

    private widthCb(percentage: number) {
        // for testing – returning a sine wave here when we have no widths specified
        if (!this.widths) return 1; //2 + Math.sin(percentage * Math.PI * 2) * 2;
        const i = Math.floor(percentage * this.widths.length);
        return this.widths[i];
    }

    appendPoint(vec: Vec3, width?: number): Vec3 {
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
        if (width === undefined) width = 1;
        this.widths.push(width);
        this.setPoints();
        return vec;
    }

    setPoints() {
        this.line.setPoints(this.points, this.widthCbBinding);
    }

    private res = new Vector2(window.innerWidth, window.innerHeight);
    private defaultLineMaterial = new MeshLineMaterial({ color: 0x999999, lineWidth: 0.01, resolution: this.res });
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
    widths: Array<number>;
    color: Array<number>;
    startIndex: number;
    finished: boolean;
}

export declare type LineHandle = {
    id: number;
}

declare type UpdateLineArgs = {
    point: Vec3;
    width: number;
}


export class LinesManager extends Behaviour {

    public startLine(parent?: Object3D, options?: LineOptions): LineHandle {
        const id = Math.random() * Number.MAX_SAFE_INTEGER;
        return this.internalStartLine(parent, id, true, options);
    }

    public updateLine(handle: LineHandle, args: UpdateLineArgs) {
        const line = this.inFlight[handle.id];
        if (!line) return;
        if (args.point) {
            args.point = line.appendPoint(args.point, args.width);
        }
        const buf = this.buffer[handle.id];
        const widthBuf = this.widthBuffer[handle.id];
        if (buf && widthBuf) {
            if (args.point)
                buf.push(args.point.x, args.point.y, args.point.z);
            if (args.width)
                widthBuf.push(args.width);
            if (buf.length > 5) {
                this.sendLineUpdate(line, false, undefined, buf, widthBuf);
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
        const widthBuf = this.widthBuffer[handle.id];
        if (buf && widthBuf) {
            delete this.buffer[handle.id];
            const arr = buf;
            arr.length = 0;
            this.freeBuffer.push(arr);

            delete this.widthBuffer[handle.id];
            const arr2 = widthBuf;
            arr2.length = 0;
            this.freeWidthBuffer.push(arr2);
        }

        return line;
    }

    public getLine(handle: LineHandle): LineInstanceHandler | undefined {
        return this.inFlight[handle.id];
    }

    private finished: Array<LineInstanceHandler> = [];
    private inFlight: { [key: number]: LineInstanceHandler } = [];
    private buffer: { [key: number]: any[] } = {};
    private widthBuffer: { [key: number]: number[] } = {};
    private freeBuffer = new Array<Vec3[]>();
    private freeWidthBuffer = new Array<number[]>();

    awake(): void {

        this.context.connection.beginListen("line-start", (i: StartLineModel) => {
            this.onEnsureLine(i.id, i.parentGuid);
        });
        this.context.connection.beginListen("line-update", (evt: LineModel) => {
            let line = this.onEnsureLine(evt.guid, evt.parentGuid);
            if (line && evt.points) {
                if (evt.startIndex <= 0) {
                    line.points = evt.points;
                    line.widths = evt.widths;
                }
                else {
                    if (evt.startIndex >= line.points.length) {
                        line.points.push(...evt.points);
                        line.widths.push(...evt.widths);
                    }
                }
                line.setPoints();
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
        this.internalStartLine(obj as Object3D, lineId, false);
        return this.inFlight[lineId];
    }
    private internalStartLine(parent: Object3D | null | undefined, id: number, send: boolean = true, options?: LineOptions): LineHandle {
        const line = new LineInstanceHandler(parent ?? this.context.scene, options);
        line.id = id;
        this.inFlight[id] = line;
        if (send)
            this.sendLineStart(line);

        let buf;
        let widthBuf;
        if (this.freeBuffer.length <= 0) buf = new Array<Vec3>();
        else buf = this.freeBuffer.pop();
        if (this.freeWidthBuffer.length <= 0) widthBuf = new Array<number>();
        else widthBuf = this.freeWidthBuffer.pop();
        this.buffer[id] = buf;
        this.widthBuffer[id] = widthBuf;
        return { id: id };
    }

    private sendLineStart(instance: LineInstanceHandler) {
        const parent = instance.mesh!.parent;
        this.context.connection.send("line-start", { id: instance.id, parentGuid: parent ? parent["guid"] : undefined })
    }

    private sendLineUpdate(instance: LineInstanceHandler, finished: boolean, startIndex?: number, points?: Array<any>, widths?: Array<number>) {
        if (instance) {
            const model: LineModel = {
                parentGuid: instance.mesh!.parent!["guid"],
                guid: instance.id,
                points: points ? [...points] : instance.points,
                widths: widths ? [...widths] : instance.widths,
                width: instance.material!.lineWidth,
                color: instance.material!.color.toArray(),
                startIndex: startIndex !== undefined ? startIndex : instance.points.length,
                finished: finished,
            };
            this.context.connection.send("line-update", model)
        }
    }
}
