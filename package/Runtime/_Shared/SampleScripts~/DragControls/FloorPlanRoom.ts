import { addComponent, Behaviour, DragControls, Renderer, serializable } from "@needle-tools/engine";
import { Box3, BoxGeometry, Color, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";

import { TextPlane, TextPlaneAlign } from "./TextPlane.js";

// Documentation → https://docs.needle.tools/scripting

const _scale = new Vector3();
/** Space around the label text, in lines. */
const LABEL_PADDING = 0.4;

/**
 * One room of a floor plan model: a flat floor piece that gets low walls along its edges and a
 * label with its name and floor area.
 *
 * Pair it with a DragControls set to stretch by the edges. The walls keep their thickness and the
 * label keeps its size while the room is stretched, the area updates live, and on release the room
 * edges snap to the grid.
 *
 * The floor must not be rotated, and its mesh is read for the footprint, so any flat mesh works.
 */
export class FloorPlanRoom extends Behaviour {

    /** Name on the room label. */
    @serializable()
    roomName: string = "Room";

    /** Real metres per model metre. 10 means the model is built at 1:10. */
    @serializable()
    planScale: number = 10;

    /** Grid the room edges snap to on release, in model units. 0 turns snapping off. */
    @serializable()
    snap: number = 0.05;

    /** Wall height in model units. */
    @serializable()
    wallHeight: number = 0.035;

    /** Wall thickness in model units. */
    @serializable()
    wallThickness: number = 0.012;

    @serializable(Color)
    wallColor: Color = new Color(0.89, 0.87, 0.83);

    /** Height of one label line in model units. 0 hides the label. */
    @serializable()
    labelSize: number = 0.04;

    /** Floor area in square metres, real-world scale. */
    get area(): number {
        const s = this.footprint(_scale);
        return s.x * s.z * this.planScale * this.planScale;
    }

    private readonly _localBox = new Box3();
    /** Holds the walls and label, scaled back so they keep their size on a stretched room. */
    private readonly _unscaled = new Object3D();
    private readonly _walls: Mesh[] = [];
    private _label?: TextPlane;
    private readonly _lastScale = new Vector3(NaN, NaN, NaN);
    private _wallMaterial?: MeshStandardMaterial;
    private _offDragEnded?: Function;

    awake(): void {
        this.readBounds();
        this._unscaled.name = "FloorPlanRoom Walls";
        this.gameObject.add(this._unscaled);

        this._wallMaterial = new MeshStandardMaterial({ color: this.wallColor, roughness: 0.85 });
        const box = new BoxGeometry(1, 1, 1);
        for (let i = 0; i < 4; i++) {
            const wall = new Mesh(box, this._wallMaterial);
            wall.castShadow = true;
            wall.receiveShadow = true;
            this._walls.push(wall);
            this._unscaled.add(wall);
        }

        if (this.labelSize > 0) {
            const labelObject = new Object3D();
            labelObject.name = "FloorPlanRoom Label";
            // Flat on the floor, reading from the open front of the plan.
            labelObject.rotation.x = -Math.PI / 2;
            this._unscaled.add(labelObject);
            this._label = addComponent(labelObject, TextPlane, {
                lineHeight: this.labelSize,
                align: TextPlaneAlign.Center,
                fontWeight: 700,
                unlit: true,
                backgroundOpacity: 0.92,
                padding: LABEL_PADDING,
            });
        }
    }

    onEnable(): void {
        const drag = this.gameObject.getComponent(DragControls);
        this._offDragEnded = drag?.dragEnded.addEventListener(() => this.snapToGrid());
    }

    onDisable(): void {
        this._offDragEnded?.();
        this._offDragEnded = undefined;
    }

    // After DragControls has applied this frame's stretch, so the walls never lag a frame behind.
    onBeforeRender(): void {
        this.layout();
    }

    /** The floor size in model units, without the walls. */
    footprint(target: Vector3): Vector3 {
        this._localBox.getSize(target);
        return target.multiply(this.gameObject.scale);
    }

    private layout(): void {
        const scale = this.gameObject.scale;
        if (scale.equals(this._lastScale)) return;
        this._lastScale.copy(scale);

        this._unscaled.scale.set(1 / scale.x, 1 / scale.y, 1 / scale.z);
        // Inside the unscaled holder positions are in model units again.
        const min = this._localBox.min, max = this._localBox.max;
        const x0 = min.x * scale.x, x1 = max.x * scale.x;
        const z0 = min.z * scale.z, z1 = max.z * scale.z;
        const top = max.y * scale.y;
        const t = this.wallThickness, h = this.wallHeight;
        const y = top + h / 2;

        // Front and back run the full width, the sides fit between them.
        this.placeWall(0, (x0 + x1) / 2, y, z0 + t / 2, x1 - x0, h, t);
        this.placeWall(1, (x0 + x1) / 2, y, z1 - t / 2, x1 - x0, h, t);
        this.placeWall(2, x0 + t / 2, y, (z0 + z1) / 2, t, h, Math.max(0.001, z1 - z0 - 2 * t));
        this.placeWall(3, x1 - t / 2, y, (z0 + z1) / 2, t, h, Math.max(0.001, z1 - z0 - 2 * t));

        if (this._label) {
            // Along the front wall, so furniture standing at the back does not cover it.
            const labelDepth = this.labelSize * (2 + 2 * LABEL_PADDING);
            const labelZ = Math.max((z0 + z1) / 2, z1 - t - 0.01 - labelDepth / 2);
            this._label.gameObject.position.set((x0 + x1) / 2, top + 0.001, labelZ);
            this._label.setText(`${this.roomName.toUpperCase()}\n${this.area.toFixed(1)} m²`);
        }
    }

    private placeWall(index: number, x: number, y: number, z: number, sx: number, sy: number, sz: number): void {
        const wall = this._walls[index];
        wall.position.set(x, y, z);
        wall.scale.set(sx, sy, sz);
    }

    /** Moves both edges on each axis onto the grid, so neighbouring rooms meet without gaps. */
    snapToGrid(): void {
        const g = this.snap;
        if (!(g > 0)) return;
        const obj = this.gameObject;
        const size = this._localBox.getSize(_scale);

        for (const axis of ["x", "z"] as const) {
            if (size[axis] <= 0) continue;
            const lo = obj.position[axis] + this._localBox.min[axis] * obj.scale[axis];
            const hi = obj.position[axis] + this._localBox.max[axis] * obj.scale[axis];
            const snappedLo = Math.round(lo / g) * g;
            const snappedHi = Math.max(snappedLo + g, Math.round(hi / g) * g);
            obj.scale[axis] = (snappedHi - snappedLo) / size[axis];
            obj.position[axis] = snappedLo - this._localBox.min[axis] * obj.scale[axis];
        }
    }

    private readBounds(): void {
        this._localBox.makeEmpty();
        const renderer = this.gameObject.getComponent(Renderer);
        for (const mesh of renderer?.sharedMeshes ?? []) {
            const geometry = mesh?.geometry;
            if (!geometry) continue;
            if (!geometry.boundingBox) geometry.computeBoundingBox();
            if (geometry.boundingBox) this._localBox.union(geometry.boundingBox);
        }
        if (this._localBox.isEmpty()) this._localBox.set(new Vector3(-0.5, 0, -0.5), new Vector3(0.5, 0, 0.5));
    }
}
