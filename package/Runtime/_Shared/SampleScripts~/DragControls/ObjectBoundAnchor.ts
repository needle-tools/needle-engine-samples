import { Behaviour, Gizmos, getBoundingBox, getParam, getWorldQuaternion, serializable, setWorldPosition, setWorldQuaternion } from "@needle-tools/engine";
import { Box3, Matrix4, Object3D, Quaternion, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

const debug = getParam("debugboundanchor");

/**
 * A side, edge or corner of an axis-aligned box: 6 faces, 12 edges, 8 corners, and the centre.
 * Named after which axes it leans on and which way - `PositiveXNegativeZ` sits on the
 * `+X` face and the `-Z` face at once, which makes it an edge running along Y; add a third axis and
 * it names a corner instead.
 */
export enum ObjectBoundAnchorPosition {
    Center = 0,
    PositiveX = 1,
    NegativeX = 2,
    PositiveY = 3,
    NegativeY = 4,
    PositiveZ = 5,
    NegativeZ = 6,
    PositiveXPositiveY = 7,
    PositiveXNegativeY = 8,
    NegativeXPositiveY = 9,
    NegativeXNegativeY = 10,
    PositiveYPositiveZ = 11,
    PositiveYNegativeZ = 12,
    NegativeYPositiveZ = 13,
    NegativeYNegativeZ = 14,
    PositiveXPositiveZ = 15,
    PositiveXNegativeZ = 16,
    NegativeXPositiveZ = 17,
    NegativeXNegativeZ = 18,
    PositiveXPositiveYPositiveZ = 19,
    PositiveXPositiveYNegativeZ = 20,
    PositiveXNegativeYPositiveZ = 21,
    PositiveXNegativeYNegativeZ = 22,
    NegativeXPositiveYPositiveZ = 23,
    NegativeXPositiveYNegativeZ = 24,
    NegativeXNegativeYPositiveZ = 25,
    NegativeXNegativeYNegativeZ = 26,
}

/** Per-axis sign (`-1`, `0` or `1`) for each {@link ObjectBoundAnchorPosition}, in declaration order. */
const _axisSigns: ReadonlyArray<readonly [number, number, number]> = [
    [0, 0, 0],
    [1, 0, 0], [-1, 0, 0],
    [0, 1, 0], [0, -1, 0],
    [0, 0, 1], [0, 0, -1],
    [1, 1, 0], [1, -1, 0], [-1, 1, 0], [-1, -1, 0],
    [0, 1, 1], [0, 1, -1], [0, -1, 1], [0, -1, -1],
    [1, 0, 1], [1, 0, -1], [-1, 0, 1], [-1, 0, -1],
    [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
    [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
];

const _invMatrix = new Matrix4();
const _worldBox = new Box3();
const _corner = new Vector3();
const _center = new Vector3();
const _halfSize = new Vector3();
const _localPoint = new Vector3();
const _worldPoint = new Vector3();
const _localDir = new Vector3();
const _worldDir = new Vector3();
const _quat = new Quaternion();

//@dont-generate-component
// This has a hand-written C# counterpart (ObjectBoundAnchor.cs, next to the compiler's own output
// in SampleScripts.codegen) instead of a generated one - it needs the enum's X-axis names mirrored
// for the glTF export's coordinate flip, which the compiler has no way to know about. See that
// file's ObjectBoundAnchorValueResolver for the full explanation. Keep the two in sync by hand:
// ObjectBoundAnchorPosition's names and values, and every @serializable field's name, type and
// default below.
/**
 * Keeps this object sitting on one side, edge or corner of another object's bounds - a face
 * centre, an edge midpoint, or one of its 8 corners, picked with {@link anchor}.
 *
 * The natural fit is a drag handle: put one `ObjectBoundAnchor` per corner (or per face) of
 * whatever should be resizable, add {@link DragControls} to each handle, and every handle starts
 * out exactly on the box it belongs to - including after the box changes because the target was
 * scaled, re-meshed, or swapped for something else and {@link refresh} is called.
 *
 * Bounds are measured once, in {@link target}'s own local space, and cached - see
 * {@link recomputeBoundsContinuously} for when that is not enough. Every frame this only has to
 * turn that cached local point through {@link target}'s current world matrix, so a plain drag
 * handle costs one matrix multiply per frame, not a walk of the target's geometry.
 *
 * Add this to the handle itself, not to the object it measures - {@link target} is a reference to
 * that object, and defaults to this object's parent so a handle authored as a child of the object
 * it belongs to needs no further setup.
 */
export class ObjectBoundAnchor extends Behaviour {

    /** The object whose bounds this anchors to. Defaults to this object's parent. */
    @serializable(Object3D)
    target?: Object3D;

    /** Which side, edge or corner of {@link target}'s bounds to sit on. */
    @serializable()
    anchor: ObjectBoundAnchorPosition = ObjectBoundAnchorPosition.Center;

    /**
     * Pushes the anchor point outward along its own axes, in world units - a constant distance
     * regardless of {@link target}'s scale, unlike the bounds themselves.
     * `0` sits exactly on the bounds; a positive value clears the surface, which is normally what a
     * drag handle wants so it doesn't sit flush inside the mesh it belongs to. Has no effect on
     * {@link ObjectBoundAnchorPosition.Center}, which has no axis to push along.
     */
    @serializable()
    margin: number = 0;

    /** Also take on {@link target}'s world rotation, instead of keeping whatever rotation this
     *  object already has. Off by default - most handles (spheres, cubes) don't care, and a handle
     *  that should stay world-axis-aligned while the target spins needs this off. */
    @serializable()
    matchRotation: boolean = false;

    /**
     * Recompute {@link target}'s local bounds every frame instead of once and caching the result.
     *
     * The cache is what keeps this cheap, and is correct as long as {@link target}'s geometry
     * doesn't change shape after start - moving, rotating or scaling `target` is all handled by the
     * cheap per-frame path regardless of this setting. Turn this on only for a target that deforms
     * in place: a skinned mesh, morph targets, procedurally rebuilt geometry. Call {@link refresh}
     * instead where the change is a one-off (a mesh swap, a resize triggered by code).
     */
    @serializable()
    recomputeBoundsContinuously: boolean = false;

    /** {@link target}'s bounds, in its own local space. Valid once {@link refresh} has run. */
    private readonly _localBounds = new Box3();
    private _boundsValid = false;

    onEnable(): void {
        if (!this.target) this.target = this.gameObject.parent ?? undefined;
        if (!this.target) {
            console.warn(`${this.name}: ObjectBoundAnchor has no target and no parent to fall back to`, this.gameObject);
            return;
        }
        this.refresh();
    }

    update(): void {
        if (!this.target) return;
        if (this.recomputeBoundsContinuously || !this._boundsValid) this.computeLocalBounds();
        this.applyAnchor();
    }

    onBeforeRender(): void {
        if (!debug || !this.target || !this._boundsValid) return;
        this.target.updateWorldMatrix(true, false);
        _worldBox.copy(this._localBounds).applyMatrix4(this.target.matrixWorld);
        Gizmos.DrawWireBox3(_worldBox, 0x00ffff, 0, false);
        Gizmos.DrawWireSphere(this.worldPosition, 0.03, 0xff00ff, 0, false);
    }

    /** Recomputes {@link target}'s local bounds and immediately re-applies {@link anchor}. Call
     *  this after changing {@link target}, or after anything else that changes its shape while
     *  {@link recomputeBoundsContinuously} is off. */
    refresh(): void {
        this.computeLocalBounds();
        this.applyAnchor();
    }

    /**
     * Measures {@link target}'s world-space bounding box (excluding this handle's own subtree, so
     * a handle authored as a child of its target doesn't skew the box it's meant to sit on) and
     * turns it into a box in {@link target}'s local space by transforming its corners through
     * {@link target}'s inverse world matrix.
     *
     * That's a double axis-alignment - re-fitting an already axis-aligned box after rotating it -
     * so a rotated target ends up with a local box a little larger than its true local bounds. The
     * same trade-off {@link DragTarget} makes for its own box measurement: cheap and never
     * optimistic, which is what a handle that only needs to sit at the *extremes* of the box
     * actually cares about.
     */
    private computeLocalBounds(): void {
        if (!this.target) return;
        this.target.updateWorldMatrix(true, false);
        getBoundingBox(this.target, [this.gameObject], undefined, _worldBox);

        this._localBounds.makeEmpty();
        if (_worldBox.isEmpty()) {
            this._boundsValid = true;
            return;
        }

        _invMatrix.copy(this.target.matrixWorld).invert();
        for (let i = 0; i < 8; i++) {
            _corner.set(
                i & 1 ? _worldBox.max.x : _worldBox.min.x,
                i & 2 ? _worldBox.max.y : _worldBox.min.y,
                i & 4 ? _worldBox.max.z : _worldBox.min.z,
            ).applyMatrix4(_invMatrix);
            this._localBounds.expandByPoint(_corner);
        }
        this._boundsValid = true;
    }

    /** Turns the cached local bounds and {@link anchor} into a world position (and, with
     *  {@link matchRotation}, a world rotation) for this object. */
    private applyAnchor(): void {
        if (!this.target || !this._boundsValid) return;
        const [sx, sy, sz] = _axisSigns[this.anchor];

        this._localBounds.getCenter(_center);
        this._localBounds.getSize(_halfSize).multiplyScalar(0.5);
        _localPoint.set(
            _center.x + sx * _halfSize.x,
            _center.y + sy * _halfSize.y,
            _center.z + sz * _halfSize.z,
        );

        this.target.updateWorldMatrix(true, false);
        _worldPoint.copy(_localPoint).applyMatrix4(this.target.matrixWorld);

        // A constant world-space push, not a local one: applying it before the matrix multiply
        // above would scale it right along with the bounds, so a handle on a 10x-scaled object
        // would clear the surface by 10x the authored margin. Rotation still applies - the push
        // should follow the face it's pushing off of - but scale deliberately does not.
        if (this.margin !== 0 && (sx !== 0 || sy !== 0 || sz !== 0)) {
            _localDir.set(sx, sy, sz).normalize();
            _worldDir.copy(_localDir).applyQuaternion(getWorldQuaternion(this.target, _quat)).normalize();
            _worldPoint.addScaledVector(_worldDir, this.margin);
        }

        setWorldPosition(this.gameObject, _worldPoint);

        if (this.matchRotation) setWorldQuaternion(this.gameObject, getWorldQuaternion(this.target, _quat));
    }
}
