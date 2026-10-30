import {
    Behaviour, DragControls, DragMode, EdgeGrabMode, GameObject, GrabGesture, GrabRim, grabRimWidths, serializable,
} from "@needle-tools/engine";
import {
    AdditiveBlending, BufferAttribute, BufferGeometry, Camera, Color, DoubleSide, Matrix4, Mesh,
    MeshBasicMaterial, Object3D, OrthographicCamera, PerspectiveCamera, Ray, Sprite, SpriteMaterial,
    Texture, Vector2, Vector3,
} from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";

// Documentation → https://docs.needle.tools/scripting

/**
 * When one half of the handle display is shown - see {@link DragHandleVisualizer.showIcon} and
 * {@link DragHandleVisualizer.useCursor}. Auto: cursor for a mouse, icon for touch and XR.
 */
export enum HandleDisplay {
    /** Decide from the current input; re-decided when it changes (e.g. entering XR). */
    Auto = 0,
    Always = 1,
    Never = 2,
}

/**
 * Shows what a {@link DragControls} object will do before it is dragged: an icon under the pointer,
 * a matching cursor, and - for objects with edge or corner grabs - the rim zones drawn on the
 * object itself.
 *
 * One instance covers the whole scene, including objects spawned later. Extra instances stand by.
 *
 * | Pointer over | Icon | Cursor |
 * |---|---|---|
 * | body, or {@link DragMode.Slide} | move cross / slide arrows along the axis | `grab` |
 * | a side or corner that rotates (edgeGrab / cornerGrab), or a turn mode | circular arrow | turn icon |
 * | a side or corner that stretches or scales, or {@link DragMode.Scale} | resize arrow out of the grab | `*-resize` |
 * | a drag that cannot be let go here: the drop is vetoed, or there is no room where it is pointed | forbidden | `not-allowed` |
 * | nothing draggable | hidden | restored |
 *
 * Icons: DragHandleMove, DragHandleSlide, DragHandleTurn, DragHandleResize, DragHandleForbidden
 * from the shared Icons folder. An empty slot shows no icon; the cursor still changes.
 */
export class DragHandleVisualizer extends Behaviour {

    /** Show the handle icon under the pointer. Auto: every input except a mouse. */
    @serializable()
    showIcon: HandleDisplay = HandleDisplay.Auto;

    /** Set the mouse cursor to match the gesture. Auto: mouse only. Restored when no longer used. */
    @serializable()
    useCursor: HandleDisplay = HandleDisplay.Auto;

    /** Draw the edge and corner zones on hovered objects that rotate on edge grab or scale on corner grab. */
    @serializable()
    showRim: boolean = true;

    /** Icon size in screen pixels; constant at any distance. */
    @serializable()
    iconSize: number = 44;

    /** Icon offset from the pointer in screen pixels, X right and Y up. */
    @serializable(Vector2)
    screenOffset: Vector2 = new Vector2(0, 0);

    /** Icon tint; white leaves the art unchanged. */
    @serializable(Color)
    color: Color = new Color(1, 1, 1);

    /** Icon opacity. */
    @serializable()
    opacity: number = 0.9;

    /** Rim color for the zones that rotate. */
    @serializable(Color)
    turnColor: Color = new Color(1, 0.7, 0.25);

    /** Rim color for the zones that resize. */
    @serializable(Color)
    resizeColor: Color = new Color(0.3, 0.8, 1);

    /** Rim line width in screen pixels. The hovered zone is drawn at twice this. */
    @serializable()
    rimWidth: number = 2.5;

    /** Keep showing the handle while a drag is running. */
    @serializable()
    showWhileDragging: boolean = true;

    /** Free movement. DragHandleMove. */
    @serializable(Texture)
    moveIcon: Texture | null = null;

    /** Movement along one axis, drawn along X and turned onto the axis at runtime. DragHandleSlide. */
    @serializable(Texture)
    slideIcon: Texture | null = null;

    /** Rotation. DragHandleTurn. */
    @serializable(Texture)
    turnIcon: Texture | null = null;

    /** Resizing, drawn pointing up and to the right and turned onto the grabbed corner. DragHandleResize. */
    @serializable(Texture)
    resizeIcon: Texture | null = null;

    /** Shown while a drag cannot be let go where it is: the drop is vetoed, or there is no room. DragHandleForbidden. */
    @serializable(Texture)
    forbiddenIcon: Texture | null = null;

    /** Only show handles for objects under this one. Empty: the whole scene. */
    @serializable(Object3D)
    root: Object3D | null = null;

    // #region lifecycle

    onEnable(): void {
        if (!_owners.has(this.context)) _owners.set(this.context, this);
        this._sprite ??= this._createSprite();
        this._rim ??= new RimDisplay();
        this.context.scene.add(this._sprite, this._rim.root);
        const el = this.context.domElement as HTMLElement | undefined;
        // Taken now: later, DragControls may have put its own hover cursor on the element.
        this._previousCursor = el?.style.cursor ?? "";
        for (const type of _pointerEvents) el?.addEventListener(type, this._onPointerEvent, { passive: true });
    }

    onDisable(): void {
        if (_owners.get(this.context) === this) _owners.delete(this.context);
        this._sprite?.removeFromParent();
        this._rim?.root.removeFromParent();
        this._restoreCursor();
        const el = this.context.domElement as HTMLElement | undefined;
        for (const type of _pointerEvents) el?.removeEventListener(type, this._onPointerEvent);
    }

    onDestroy(): void {
        if (_owners.get(this.context) === this) _owners.delete(this.context);
        this._restoreCursor();
        this._sprite?.material.dispose();
        this._rim?.dispose();
    }

    update(): void {
        if (!this._owns()) {
            this._hide();
            return;
        }
        const found = this._resolve();
        if (!found) this._hide();
        else this._show(found);
        this._updateRim(found);
    }

    /** Whether this is the instance doing the work. Re-checked every frame so a standby takes over. */
    private _owns(): boolean {
        const owner = _owners.get(this.context);
        if (owner === this) return true;
        if (!owner || !owner.activeAndEnabled) {
            _owners.set(this.context, this);
            return true;
        }
        if (!this._warnedDuplicate) {
            this._warnedDuplicate = true;
            console.warn("[DragHandleVisualizer] More than one in the scene: the one on "
                + owner.gameObject.name + " is active, the one on " + this.gameObject.name + " stands by.");
        }
        return false;
    }
    private _warnedDuplicate: boolean = false;

    // #endregion

    // #region what is under the pointer

    /** The gesture available right now, and where. A running drag answers first. */
    private _resolve(): Found | null {
        const active = this._activeDrag();
        if (active) {
            this._hover = null;
            if (!this.showWhileDragging) return null;
            const state = active.pointerState;
            // Attached and two-pointer drags resolve no single point.
            const point = state?.point ?? (active.draggedObject ?? active.dragObject)?.worldPosition;
            const gesture = state?.gesture ?? null;
            if (!point || gesture === null) return null;
            return { gesture, point, drag: active, blocked: this._cannotDrop(active), dragging: true, xr: state?.isXR === true };
        }

        const xr = this._isXR();
        // Screen pointer gone (left the canvas, finger lifted): nothing is hovered.
        if (!xr && !this._pointerInside) {
            this._hover = null;
            return null;
        }
        if (!this._hoverIsStale(xr)) return this._hover;

        this._hover = null;
        if (xr) {
            for (const controller of this.context.xr?.controllers ?? []) {
                if (!controller.connected) continue;
                const found = this._raycast(controller.ray, true);
                if (found) { this._hover = found; break; }
            }
        }
        else this._hover = this._raycast(null, false);
        return this._hover;
    }

    /** First hit along the ray. A non-draggable hit occludes everything behind it. */
    private _raycast(ray: Ray | null, xr: boolean): Found | null {
        const hits = this.context.physics.raycast({
            targets: this.root ? [this.root] : undefined,
            ray: ray ?? undefined,
        });
        for (const hit of hits) {
            if (!hit.object || _isOwnVisual(hit.object)) continue;
            const drag = GameObject.getComponentInParent(hit.object, DragControls);
            if (!drag || !drag.activeAndEnabled) return null;
            const gesture = drag.getGestureAt(hit.point, xr);
            if (gesture === null) return null;
            return { gesture, point: hit.point.clone(), drag, blocked: false, dragging: false, xr };
        }
        return null;
    }
    private _hover: Found | null = null;

    /**
     * Whether letting go now would fail: an allowDrop listener vetoed it, or the pose the pointer asks
     * for is occupied. No room only counts once it has lasted a moment, so brushing past an obstacle
     * does not flash the sign. Being near a target that does not take the object is not a failure -
     * the object is simply put down - so that alone shows nothing.
     */
    private _cannotDrop(drag: DragControls): boolean {
        const now = this.context.time.time;
        if (!drag.collisionBlocked) this._noRoomSince = -1;
        else if (this._noRoomSince < 0) this._noRoomSince = now;
        const noRoom = this._noRoomSince >= 0 && now - this._noRoomSince >= _noRoomDelay;
        return !drag.dropAllowed || noRoom;
    }
    private _noRoomSince: number = -1;

    /** Raycast again only when the pointer or camera moved, or every few frames for moving objects. */
    private _hoverIsStale(xr: boolean): boolean {
        const cam = this.context.mainCamera as Camera | null;
        const pointer = this.context.input.mousePositionRC;
        let stale = xr || (this.context.time.frameCount - this._lastRaycastFrame) >= 8;
        if (!_lastPointer.equals(pointer)) { _lastPointer.copy(pointer); stale = true; }
        if (cam && !_lastCamera.equals(cam.matrixWorld)) { _lastCamera.copy(cam.matrixWorld); stale = true; }
        if (stale) this._lastRaycastFrame = this.context.time.frameCount;
        return stale;
    }
    private _lastRaycastFrame: number = -1;

    /** The DragControls currently dragging, within {@link root}. */
    private _activeDrag(): DragControls | null {
        for (const drag of DragControls.CurrentlySelected) {
            if (!drag.pointerState) continue;
            if (this.root && !_isUnder(drag.gameObject, this.root)) continue;
            return drag;
        }
        return null;
    }

    // #endregion

    // #region presentation

    private _show(found: Found): void {
        const { gesture, point, drag, blocked } = found;
        if (this._enabled(this.useCursor, _cursorSuitsInput)) {
            // Held while shown so DragControls' plain hover hand does not overwrite it.
            this._cursorClaim ??= DragControls.claimCursor(this);
            this._setCursor(blocked
                ? this._imageCursor(this.forbiddenIcon, "not-allowed")
                : this._cursorFor(gesture, point, drag));
        }
        else this._restoreCursor();

        const sprite = this._sprite;
        if (!sprite || !this._enabled(this.showIcon, _iconSuitsInput)) {
            if (sprite) sprite.visible = false;
            return;
        }

        const material = sprite.material;
        const map = blocked ? this.forbiddenIcon : this._textureFor(gesture, drag);
        if (!map) {
            sprite.visible = false;
            return;
        }
        if (material.map !== map) {
            // Recompile only when the map appears or disappears, not on a swap.
            if (!material.map) material.needsUpdate = true;
            material.map = map;
        }
        material.opacity = this.opacity;
        material.color.copy(this.color);
        material.rotation = blocked ? 0 : this._screenRotationFor(gesture, point, drag);

        sprite.position.copy(point);
        sprite.visible = true;
        this._placeOnScreen(sprite, point, found.xr);
    }

    private _hide(): void {
        if (this._sprite) this._sprite.visible = false;
        this._restoreCursor();
    }

    private _enabled(setting: HandleDisplay, suits: (xr: boolean, mouse: boolean) => boolean): boolean {
        if (setting === HandleDisplay.Always) return true;
        if (setting === HandleDisplay.Never) return false;
        return suits(this._isXR(), this._isMouse());
    }

    private _isXR(): boolean {
        return this.context.isInXR === true;
    }

    /** From DOM events: context.input.getIsMouse is only set on pointer-down. */
    private _isMouse(): boolean {
        if (this._lastPointerType !== null) return this._lastPointerType === "mouse";
        return globalThis.matchMedia?.("(hover: hover) and (pointer: fine)").matches === true;
    }
    private _lastPointerType: string | null = null;
    private _pointerInside: boolean = false;
    private readonly _onPointerEvent = (e: Event) => {
        const evt = e as PointerEvent;
        if (evt.pointerType) this._lastPointerType = evt.pointerType;
        switch (evt.type) {
            case "pointerleave":
            case "pointercancel":
                this._pointerInside = false;
                break;
            case "pointerup":
                // A lifted finger or pen has no hover left.
                if (evt.pointerType !== "mouse") this._pointerInside = false;
                break;
            default:
                this._pointerInside = true;
        }
    };

    /** Size in screen pixels and the pixel offset. In XR a fixed angular size instead. */
    private _placeOnScreen(sprite: Sprite, point: Vector3, xr: boolean): void {
        const cam = this.context.mainCamera as Camera | null;
        if (!cam) return;
        const perPixel = xr
            ? cam.getWorldPosition(_camPos).distanceTo(point) * _xrWorldPerPixel
            : this._worldPerPixel(point);
        if (perPixel <= 0) return;

        const size = this.iconSize * perPixel;
        sprite.scale.set(size, size, 1);

        const offset = this.screenOffset;
        if (!offset || (offset.x === 0 && offset.y === 0)) return;
        _camRight.setFromMatrixColumn(cam.matrixWorld, 0).normalize();
        _camUp.setFromMatrixColumn(cam.matrixWorld, 1).normalize();
        sprite.position
            .addScaledVector(_camRight, offset.x * perPixel)
            .addScaledVector(_camUp, offset.y * perPixel);
    }

    /** World size of one screen pixel at `point`, or 0. */
    private _worldPerPixel(point: Vector3): number {
        const cam = this.context.mainCamera as Camera | null;
        const height = this.context.domHeight;
        if (!cam || !height) return 0;

        let worldHeight: number;
        if ((cam as OrthographicCamera).isOrthographicCamera) {
            const ortho = cam as OrthographicCamera;
            worldHeight = (ortho.top - ortho.bottom) / (ortho.zoom || 1);
        }
        else {
            const persp = cam as PerspectiveCamera;
            const distance = cam.getWorldPosition(_camPos).distanceTo(point);
            worldHeight = 2 * distance * Math.tan((persp.fov * Math.PI / 180) / 2);
        }
        return worldHeight / height;
    }

    /**
     * Screen-space turn for the icon, in radians: slide arrows along the slide axis, resize arrow
     * out of the grabbed corner. The drawn angle of the art is subtracted.
     */
    private _screenRotationFor(gesture: GrabGesture, point: Vector3, drag: DragControls): number {
        const cam = this.context.mainCamera;
        if (!cam) return 0;

        if (gesture === GrabGesture.Move && drag.dragMode === DragMode.Slide) {
            const axis = drag.getModeAxis(_axis);
            if (!axis) return 0;
            _from.copy(point).addScaledVector(axis, -0.5);
            _to.copy(point).addScaledVector(axis, 0.5);
            return this._screenAngle(_from, _to, cam);
        }

        if (gesture === GrabGesture.Resize || gesture === GrabGesture.Stretch) {
            const centre = this._boundsCentre(drag, _from);
            if (!centre) return 0;
            return this._screenAngle(centre, point, cam) - _resizeIconScreenAngle;
        }

        return 0;
    }

    /** World centre of the object's bounds; the pivot is often at the base and skews corner directions. */
    private _boundsCentre(drag: DragControls, out: Vector3): Vector3 | null {
        const obj = drag.draggedObject ?? drag.dragObject;
        if (!obj) return null;
        if (drag.getGrabRim(_rimQuery)) return obj.localToWorld(_rimQuery.bounds.getCenter(out));
        return (obj as Object3D).getWorldPosition(out);
    }

    /** On-screen angle of `from`→`to`, as SpriteMaterial.rotation measures it. */
    private _screenAngle(from: Vector3, to: Vector3, cam: Camera): number {
        _a.copy(from).project(cam);
        _b.copy(to).project(cam);
        const aspect = (this.context.domWidth || 1) / (this.context.domHeight || 1);
        const dx = (_b.x - _a.x) * aspect;
        const dy = _b.y - _a.y;
        if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return 0;
        return Math.atan2(dy, dx);
    }

    // #endregion

    // #region rim

    private _updateRim(found: Found | null): void {
        const rim = this._rim;
        if (!rim) return;
        const dt = this.context.time.deltaTime;
        let target: DragControls | null = null;
        let point: Vector3 | null = null;
        if (this.showRim && found && found.drag.getGrabRim(_rimQuery, found.point, found.xr)) {
            // While dragging, keep the rim only for a turn or resize; a carried object needs none.
            if (!found.dragging || found.gesture !== GrabGesture.Move) {
                target = found.drag;
                point = found.dragging ? null : found.point;
            }
        }
        const cam = this.context.mainCamera as Camera | null;
        rim.update(target, target ? _rimQuery : null, point, dt, this.context.time.time, {
            turn: this.turnColor, resize: this.resizeColor, width: this.rimWidth,
            resolutionX: this.context.domWidth, resolutionY: this.context.domHeight,
            xr: found?.xr === true, camera: cam,
        });
    }

    private _rim: RimDisplay | null = null;

    // #endregion

    // #region cursor

    private _cursorFor(gesture: GrabGesture, point: Vector3, drag: DragControls): string {
        switch (gesture) {
            // CSS has no rotate cursor, so the turn art is used.
            case GrabGesture.Turn: return this._imageCursor(this.turnIcon, "grab");
            case GrabGesture.Resize:
            case GrabGesture.Stretch: {
                // Direction out of the grab on screen, picked by octant (NDC, y up).
                const angle = this._screenRotationFor(gesture, point, drag) + _resizeIconScreenAngle;
                const deg = ((angle * 180 / Math.PI) % 180 + 180) % 180;
                if (deg < 22.5 || deg >= 157.5) return "ew-resize";
                if (deg < 67.5) return "nesw-resize";
                if (deg < 112.5) return "ns-resize";
                return "nwse-resize";
            }
            default: return "grab";
        }
    }

    /**
     * A CSS cursor from an icon texture, falling back to `fallback`. Compressed textures (KTX2) have
     * no drawable image; they get the keyword. Cached per image, so a progressive texture swapping
     * in its full resolution is redrawn once.
     */
    private _imageCursor(texture: Texture | null, fallback: string): string {
        if (!texture) return fallback;
        const image = texture.image as unknown;
        if (!image) return fallback;
        const cached = this._cursorCache.get(texture.uuid + "|" + fallback);
        if (cached && cached.image === image) return cached.value;

        let value = fallback;
        if (_isDrawable(image)) {
            const width = (image as { naturalWidth?: number }).naturalWidth || (image as { width: number }).width;
            if (!width) return fallback; // still decoding, try again next frame
            try {
                const size = _cursorPixels;
                const canvas = document.createElement("canvas");
                canvas.width = canvas.height = size;
                canvas.getContext("2d")?.drawImage(image, 0, 0, size, size);
                value = `url(${canvas.toDataURL("image/png")}) ${size / 2} ${size / 2}, ${fallback}`;
            }
            catch {
                // Cross-origin image taints the canvas.
            }
        }
        this._cursorCache.set(texture.uuid + "|" + fallback, { image, value });
        return value;
    }
    private readonly _cursorCache: Map<string, { image: unknown, value: string }> = new Map();

    /** Writes the cursor if it changed or someone else overwrote it. */
    private _setCursor(cursor: string): void {
        const el = this.context.domElement as HTMLElement | undefined;
        if (!el) return;
        if (this._cursor === cursor && el.style.cursor === this._cursorAsRead) return;
        el.style.cursor = cursor;
        this._cursor = cursor;
        // The element re-serializes url() values, so compare against what it reads back.
        this._cursorAsRead = el.style.cursor;
    }

    /** Puts the cursor back, only if it is still ours. */
    private _restoreCursor(): void {
        this._cursorClaim?.();
        this._cursorClaim = null;
        if (this._cursor === null) return;
        const el = this.context.domElement as HTMLElement | undefined;
        if (el && el.style.cursor === this._cursorAsRead) el.style.cursor = this._previousCursor;
        this._cursor = null;
        this._cursorAsRead = null;
    }
    private _cursor: string | null = null;
    private _cursorAsRead: string | null = null;
    private _previousCursor: string = "";
    private _cursorClaim: (() => void) | null = null;

    // #endregion

    // #region sprite

    private _sprite: Sprite | null = null;

    private _createSprite(): Sprite {
        const material = new SpriteMaterial({
            transparent: true,
            depthTest: false,
            depthWrite: false,
            toneMapped: false,
        });
        const sprite = new Sprite(material);
        sprite.visible = false;
        sprite.renderOrder = 10001;
        sprite.name = _spriteName;
        _markOwnVisual(sprite);
        return sprite;
    }

    /** The icon for this gesture. Slide falls back to the move icon. */
    private _textureFor(gesture: GrabGesture, drag: DragControls): Texture | null {
        if (gesture === GrabGesture.Turn) return this.turnIcon;
        if (gesture === GrabGesture.Resize || gesture === GrabGesture.Stretch) return this.resizeIcon;
        if (drag.dragMode === DragMode.Slide) return this.slideIcon ?? this.moveIcon;
        return this.moveIcon;
    }

    // #endregion
}

type Found = {
    gesture: GrabGesture,
    point: Vector3,
    drag: DragControls,
    blocked: boolean,
    dragging: boolean,
    xr: boolean,
};

type RimStyle = {
    turn: Color,
    resize: Color,
    width: number,
    resolutionX: number,
    resolutionY: number,
    xr: boolean,
    camera: Camera | null,
};

/**
 * The rim zones of one object: corner brackets for the resize zones, segmented side bars for the
 * turn zones. The zone under the pointer is drawn thicker with a soft fill. Fades and settles in
 * from slightly larger on appear.
 *
 * Flat for most edge grab modes: one face, the one {@link DragControls.getGrabRim} reads. For
 * {@link EdgeGrabMode.FaceGrid}, where every face has its own zones, the camera-facing faces of
 * the box are drawn together, so corners read as three-legged block corners and the hovered zone
 * lights up on every visible face it touches.
 */
class RimDisplay {
    readonly root: Object3D = new Object3D();
    private readonly _frame: LineSegments2;
    private readonly _frameMaterial: LineMaterial;
    private readonly _hi: LineSegments2;
    private readonly _hiMaterial: LineMaterial;
    private readonly _fill: Mesh;
    private readonly _fillMaterial: MeshBasicMaterial;

    private _drag: DragControls | null = null;
    private _frameKey: string = "";
    private _zoneKey: string = "";
    private _alpha: number = 0;
    private _zoneAlpha: number = 0;
    private readonly _bounds = new GrabRim();
    /** Bounds centre and half extents, per local axis. */
    private readonly _c: number[] = [0, 0, 0];
    private readonly _h: number[] = [0, 0, 0];
    /** Active face: normal axis and its sign. */
    private _iw: number = 1;
    private _sw: number = 1;
    private _cube: boolean = false;
    private _column: boolean = false;
    /** Camera-facing faces, bit `axis * 2 + (sign > 0 ? 1 : 0)`. */
    private _visible: number = 0;

    constructor() {
        this.root.name = "DragHandle.Rim";
        this.root.matrixAutoUpdate = false;
        this.root.visible = false;

        this._frameMaterial = _lineMaterial();
        this._frame = new LineSegments2(new LineSegmentsGeometry(), this._frameMaterial);
        this._frame.renderOrder = 9998;

        this._hiMaterial = _lineMaterial();
        this._hi = new LineSegments2(new LineSegmentsGeometry(), this._hiMaterial);
        this._hi.renderOrder = 10000;

        this._fillMaterial = new MeshBasicMaterial({
            transparent: true, depthTest: false, depthWrite: false, side: DoubleSide,
            blending: AdditiveBlending, toneMapped: false,
        });
        // Up to three quads: a block corner shows on three faces.
        const fillGeometry = new BufferGeometry();
        fillGeometry.setAttribute("position", new BufferAttribute(new Float32Array(12 * 3), 3));
        const index: number[] = [];
        for (let q = 0; q < 3; q++) index.push(q * 4, q * 4 + 1, q * 4 + 2, q * 4, q * 4 + 2, q * 4 + 3);
        fillGeometry.setIndex(index);
        this._fill = new Mesh(fillGeometry, this._fillMaterial);
        this._fill.renderOrder = 9999;
        this._fill.frustumCulled = false;

        for (const obj of [this._frame, this._hi, this._fill]) {
            _markOwnVisual(obj);
            obj.matrixAutoUpdate = false;
            this.root.add(obj);
        }
        _markOwnVisual(this.root);
    }

    dispose(): void {
        this._frame.geometry.dispose();
        this._hi.geometry.dispose();
        this._fill.geometry.dispose();
        this._frameMaterial.dispose();
        this._hiMaterial.dispose();
        this._fillMaterial.dispose();
    }

    /** `point` null keeps the current highlight (a drag in flight). */
    update(drag: DragControls | null, rim: GrabRim | null, point: Vector3 | null, dt: number, time: number, style: RimStyle): void {
        if (drag && rim && drag !== this._drag) {
            // Let the previous object's rim fade out first, then draw the new one in fresh.
            if (this._drag && this._alpha > 0.05) {
                this._fadeOut(dt);
                this._apply(style, time);
                return;
            }
            this._drag = drag;
            this._alpha = 0;
            this._zoneKey = "";
            this._frameKey = "";
        }
        const obj = drag ? (drag.draggedObject ?? drag.dragObject) : null;
        if (!drag || !rim || !obj) {
            this._fadeOut(dt);
            this._apply(style, time);
            return;
        }

        this._bounds.bounds.copy(rim.bounds);
        this._bounds.faceNormal.copy(rim.faceNormal);
        this._bounds.edgeWidth.copy(rim.edgeWidth);
        this._bounds.cornerWidth.copy(rim.cornerWidth);
        this._bounds.margin = rim.margin;
        this._bounds.worldScale.copy(rim.worldScale);
        this._bounds.viewDistance = rim.viewDistance;
        this._bounds.edgeGesture = rim.edgeGesture;
        this._bounds.cornerGesture = rim.cornerGesture;
        this._bounds.ownCorners = rim.ownCorners;
        this._layout(obj, drag.edgeGrabMode, style.camera);
        this._rebuildFrame(style);
        if (point) this._rebuildZone(obj, point, style);

        this._alpha = Math.min(1, this._alpha + dt * 6);
        this._zoneAlpha = Math.min(1, this._zoneAlpha + dt * 10);
        this._apply(style, time);
    }

    private _fadeOut(dt: number): void {
        this._alpha = Math.max(0, this._alpha - dt * 8);
        this._zoneAlpha = Math.max(0, this._zoneAlpha - dt * 12);
        if (this._alpha <= 0) this._drag = null;
    }

    private _apply(style: RimStyle, time: number): void {
        const obj = this._drag ? (this._drag.draggedObject ?? this._drag.dragObject) : null;
        this.root.visible = this._alpha > 0.001 && obj !== null;
        if (!this.root.visible || !obj) return;

        // Ease out of a slightly larger frame, scaled about the bounds centre.
        const ease = 1 - Math.pow(1 - this._alpha, 3);
        const k = 1 + 0.08 * (1 - ease);
        const c = this._bounds.bounds.getCenter(_rimCentre);
        _rimMatrix.makeTranslation(c.x, c.y, c.z)
            .multiply(_rimScale.makeScale(k, k, k))
            .multiply(_rimTranslate.makeTranslation(-c.x, -c.y, -c.z));
        obj.updateWorldMatrix(true, false);
        this.root.matrix.multiplyMatrices(obj.matrixWorld, _rimMatrix);
        this.root.matrixWorldNeedsUpdate = true;

        const width = style.xr ? style.width * 1.5 : style.width;
        this._frameMaterial.linewidth = width;
        this._hiMaterial.linewidth = width * 2;
        for (const m of [this._frameMaterial, this._hiMaterial]) m.resolution.set(style.resolutionX || 1, style.resolutionY || 1);

        const pulse = 0.8 + 0.2 * Math.sin(time * 5);
        this._frameMaterial.opacity = 0.55 * ease;
        this._hiMaterial.opacity = ease * this._zoneAlpha * pulse;
        this._fillMaterial.opacity = 0.22 * ease * this._zoneAlpha * pulse;
        this._hi.visible = this._fill.visible = this._zoneKey !== "body" && this._zoneKey !== "";
    }

    /** Centre, half extents, active face and - for the block and column styles - which faces the camera sees. */
    private _layout(obj: Object3D, mode: EdgeGrabMode, cam: Camera | null): void {
        const b = this._bounds.bounds;
        for (let i = 0; i < 3; i++) {
            this._c[i] = (b.min.getComponent(i) + b.max.getComponent(i)) * 0.5;
            this._h[i] = (b.max.getComponent(i) - b.min.getComponent(i)) * 0.5;
        }
        const n = this._bounds.faceNormal;
        this._iw = n.x !== 0 ? 0 : n.y !== 0 ? 1 : 2;
        this._sw = n.getComponent(this._iw) > 0 ? 1 : -1;
        this._cube = mode === EdgeGrabMode.FaceGrid;
        // Top Down reads only the footprint, so its rim runs the full height of the sides.
        this._column = mode === EdgeGrabMode.TopDown && this._h[this._iw] > 1e-6;
        this._visible = (this._cube || this._column) && cam ? this._facesTowards(obj, cam) : _faceBit(this._iw, this._sw);
        if (this._column) this._visible &= ~_faceBit(this._iw, -this._sw);
    }

    private _facesTowards(obj: Object3D, cam: Camera): number {
        const ortho = (cam as OrthographicCamera).isOrthographicCamera === true;
        if (ortho) cam.getWorldDirection(_rimView).negate();
        else cam.getWorldPosition(_rimCamPos);
        obj.updateWorldMatrix(true, false);
        let mask = 0;
        for (let i = 0; i < 3; i++) {
            for (const s of [-1, 1]) {
                _rimNormal.set(0, 0, 0).setComponent(i, s).transformDirection(obj.matrixWorld);
                if (!ortho) {
                    _rimPoint.set(this._c[0], this._c[1], this._c[2]);
                    _rimPoint.setComponent(i, this._c[i] + s * this._h[i]);
                    obj.localToWorld(_rimPoint);
                    _rimView.copy(_rimCamPos).sub(_rimPoint);
                }
                if (_rimNormal.dot(_rimView) > 1e-5) mask |= _faceBit(i, s);
            }
        }
        // The face being read is always shown, even edge-on.
        return mask | _faceBit(this._iw, this._sw);
    }

    private _isVisible(axis: number, sign: number): boolean {
        return (this._visible & _faceBit(axis, sign)) !== 0;
    }

    /** Pushes the local point at `centre + (x, y, z)`. */
    private _pt(x: number, y: number, z: number, out: number[]): void {
        out.push(this._c[0] + x, this._c[1] + y, this._c[2] + z);
    }

    /** Pushes a point given as offsets along three named axes. */
    _ax(ia: number, a: number, ib: number, b: number, iw: number, w: number, out: number[]): void {
        _rimTriple[ia] = a; _rimTriple[ib] = b; _rimTriple[iw] = w;
        this._pt(_rimTriple[0], _rimTriple[1], _rimTriple[2], out);
    }

    /** The colour of a gesture: turn colour for a turn, resize colour for a resize or stretch. */
    private _gestureColor(gesture: GrabGesture, style: RimStyle): Color | null {
        if (gesture === GrabGesture.Turn) return style.turn;
        if (gesture === GrabGesture.Resize || gesture === GrabGesture.Stretch) return style.resize;
        return null;
    }

    /** Corners are their own zone only with a corner action; otherwise they are just where two edges meet. */
    private _cornerColor(style: RimStyle): Color | null {
        return this._bounds.ownCorners ? this._gestureColor(this._bounds.cornerGesture, style) : null;
    }

    /** Null where the sides move the object. */
    private _edgeColor(style: RimStyle): Color | null {
        return this._gestureColor(this._bounds.edgeGesture, style);
    }

    /** Edge and corner widths of the face with normal axis `iw`, sized as the engine sizes it. */
    private _faceWidths(iw: number): { e: Vector3, k: Vector3 } {
        const b = this._bounds;
        const e = new Vector3(), k = new Vector3();
        grabRimWidths(b.bounds, _rimAxis.set(0, 0, 0).setComponent(iw, 1), b.margin, b.worldScale, b.viewDistance, e, k, b.ownCorners);
        return { e, k };
    }

    private _rebuildFrame(style: RimStyle): void {
        const widths = [0, 1, 2].map(iw => this._faceWidths(iw));
        const key = [this._drag?.guid, this._h.map(v => v.toFixed(4)).join(","), this._visible, this._column,
            widths.map(w => w.k.toArray().map(v => v.toFixed(4)).join(",")).join(";"),
            this._bounds.edgeGesture, this._bounds.cornerGesture, this._bounds.ownCorners, style.turn.getHex(), style.resize.getHex()].join("|");
        if (key === this._frameKey) return;
        this._frameKey = key;

        const segments = new SegmentSet();
        const corner = this._cornerColor(style);
        const edgeColor = this._edgeColor(style);
        for (let iw = 0; iw < 3; iw++) {
            for (const sw of [-1, 1]) {
                // the column style reads one face; its sides are drawn below
                if (this._column ? iw !== this._iw || sw !== this._sw : !this._isVisible(iw, sw)) continue;
                const ia = iw === 0 ? 1 : 0, ib = iw === 2 ? 1 : 2;
                const ha = this._h[ia], hb = this._h[ib], w = sw * this._h[iw];
                if (ha <= 1e-6 || hb <= 1e-6) continue;
                // where the corner zones end on this face
                const k = widths[iw].k;
                const ka = corner ? ha - k.getComponent(ia) : ha, kb = corner ? hb - k.getComponent(ib) : hb;
                if (corner) {
                    for (const sa of [-1, 1]) for (const sb of [-1, 1]) {
                        segments.add(this, corner, ia, sa * ha, ib, sb * hb, iw, w, ia, sa * ka);
                        segments.add(this, corner, ia, sa * ha, ib, sb * hb, iw, w, ib, sb * kb);
                    }
                }
                if (edgeColor) {
                    // Inset from the brackets so the two read as separate zones.
                    const gap = corner ? 0.06 * Math.min(ka, kb) : 0;
                    for (const s of [-1, 1]) {
                        if (ka > gap) segments.addSpan(this, edgeColor, ia, ib, s * hb, iw, w, -ka + gap, ka - gap);
                        if (kb > gap) segments.addSpan(this, edgeColor, ib, ia, s * ha, iw, w, -kb + gap, kb - gap);
                    }
                }
            }
        }
        if (this._column) this._addColumnSides(segments, widths[this._iw].k, corner, style);
        _setSegments(this._frame, segments.positions, segments.colors);
    }

    /**
     * The column style's visible sides: the vertical box edges, which are the outer edges of the
     * corner columns, and the bottom outline drawn like the top.
     */
    private _addColumnSides(segments: SegmentSet, k: Vector3, corner: Color | null, style: RimStyle): void {
        const iw = this._iw, ia = iw === 0 ? 1 : 0, ib = iw === 2 ? 1 : 2;
        const ha = this._h[ia], hb = this._h[ib];
        if (ha <= 1e-6 || hb <= 1e-6) return;
        const top = this._sw * this._h[iw], bottom = -top;
        const gap = corner ? 0.06 * Math.min(ha - k.getComponent(ia), hb - k.getComponent(ib)) : 0;
        const edgeColor = this._edgeColor(style);
        const edge = corner ?? edgeColor ?? style.turn;
        for (const [ie, il] of [[ia, ib], [ib, ia]]) {
            const he = this._h[ie], hl = this._h[il], kl = corner ? hl - k.getComponent(il) : hl;
            for (const se of [-1, 1]) {
                if (!this._isVisible(ie, se)) continue;
                for (const sl of [-1, 1]) {
                    segments.add(this, edge, ie, se * he, il, sl * hl, iw, top, iw, bottom);
                    if (corner) segments.add(this, corner, ie, se * he, il, sl * hl, iw, bottom, il, sl * kl);
                }
                if (edgeColor && kl > gap)
                    segments.addSpan(this, edgeColor, il, ie, se * he, iw, bottom, -kl + gap, kl - gap);
            }
        }
    }

    private _rebuildZone(obj: Object3D, pointWorld: Vector3, style: RimStyle): void {
        const p = obj.worldToLocal(_rimPoint.copy(pointWorld));
        const iw = this._iw, sw = this._sw;
        const ia = iw === 0 ? 1 : 0, ib = iw === 2 ? 1 : 2;
        const ha = this._h[ia], hb = this._h[ib], hw = this._h[iw];
        if (ha <= 1e-6 || hb <= 1e-6) { this._setZone("body"); return; }
        const E = this._bounds.edgeWidth, K = this._bounds.cornerWidth;
        const u = p.getComponent(ia) - this._c[ia];
        const v = p.getComponent(ib) - this._c[ib];
        // the engine's test, see grabBoundsZoneByWidths
        const inA = ha - Math.abs(u), inB = hb - Math.abs(v);
        const cornerHit = this._bounds.ownCorners && inA <= K.getComponent(ia) && inB <= K.getComponent(ib);
        const pastA = inA <= E.getComponent(ia), pastB = inB <= E.getComponent(ib);
        const sa = Math.sign(u) || 1, sb = Math.sign(v) || 1;
        const w = sw * hw;

        let key = "body";
        let color: Color | null = null;
        if (cornerHit) {
            key = `c${iw}${sw}${sa}${sb}`;
            color = this._cornerColor(style);
        }
        else if ((pastA || pastB) && this._edgeColor(style)) {
            // where two edges meet, the nearer one
            const onA = pastA && (!pastB || inA <= inB);
            key = onA ? `a${iw}${sw}${sa}` : `b${iw}${sw}${sb}`;
            color = this._edgeColor(style);
        }
        if (!color) key = "body";
        key += "|" + this._visible + "|" + K.toArray().concat(E.toArray()).map(x => x.toFixed(4)).join(",");
        if (key === this._zoneKey) return;
        this._setZone(key.startsWith("body") ? "body" : key);
        if (!color) return;

        const lines = new SegmentSet();
        const fill: number[] = [];
        // Depth into the box along the face normal, for the block style's side faces.
        const deep = this._cube && hw > 1e-6;
        if (key.startsWith("c")) {
            const ca = sa * ha, cb = sb * hb;
            const ka = ha - K.getComponent(ia), kb = hb - K.getComponent(ib);
            lines.add(this, color, ia, ca, ib, cb, iw, w, ia, sa * ka);
            lines.add(this, color, ia, ca, ib, cb, iw, w, ib, sb * kb);
            this._quad(fill, ia, sa * ka, ca, ib, sb * kb, cb, iw, w);
            if (deep) {
                // down the side faces, as those faces size their corners
                const sideA = this._faceWidths(ia).k, sideB = this._faceWidths(ib).k;
                const kwA = hw - sideA.getComponent(iw), kwB = hw - sideB.getComponent(iw);
                lines.add(this, color, ia, ca, ib, cb, iw, w, iw, sw * Math.min(kwA, kwB));
                if (this._isVisible(ia, sa)) this._quad(fill, ib, sb * (hb - sideA.getComponent(ib)), cb, iw, sw * kwA, w, ia, ca);
                if (this._isVisible(ib, sb)) this._quad(fill, ia, sa * (ha - sideB.getComponent(ia)), ca, iw, sw * kwB, w, ib, cb);
            }
            else if (this._column) {
                // the whole corner column, top to bottom
                lines.add(this, color, ia, ca, ib, cb, iw, w, iw, -w);
                lines.add(this, color, ia, ca, ib, cb, iw, -w, ia, sa * ka);
                lines.add(this, color, ia, ca, ib, cb, iw, -w, ib, sb * kb);
                if (this._isVisible(ia, sa)) this._quad(fill, ib, sb * kb, cb, iw, -w, w, ia, ca);
                if (this._isVisible(ib, sb)) this._quad(fill, ia, sa * ka, ca, iw, -w, w, ib, cb);
            }
        }
        else {
            // An edge: `ie` is the axis the grab went past, `il` the one the edge runs along.
            const ie = key.startsWith("a") ? ia : ib, il = key.startsWith("a") ? ib : ia;
            const se = key.startsWith("a") ? sa : sb;
            const he = this._h[ie], hl = this._h[il];
            // runs between the corner zones, as deep as the edge width
            const kl = this._bounds.ownCorners ? hl - K.getComponent(il) : hl, de = he - E.getComponent(ie);
            lines.addSpan(this, color, il, ie, se * he, iw, w, -kl, kl);
            this._quad(fill, ie, se * de, se * he, il, -kl, kl, iw, w);
            if (deep && this._isVisible(ie, se)) {
                const side = this._faceWidths(ie).e;
                this._quad(fill, iw, sw * (hw - side.getComponent(iw)), w, il, -kl, kl, ie, se * he);
            }
            else if (this._column && this._isVisible(ie, se)) {
                // the whole side between the corner columns
                lines.addSpan(this, color, il, ie, se * he, iw, -w, -kl, kl);
                this._quad(fill, iw, -w, w, il, -kl, kl, ie, se * he);
            }
        }
        _setSegments(this._hi, lines.positions, lines.colors);

        const attr = this._fill.geometry.getAttribute("position") as BufferAttribute;
        (attr.array as Float32Array).set(fill);
        attr.needsUpdate = true;
        this._fill.geometry.setDrawRange(0, (fill.length / 12) * 6);
        this._fillMaterial.color.copy(color);
    }

    /** A quad spanning [a0, a1] x [b0, b1] on the plane `iw = w`. */
    private _quad(out: number[], ia: number, a0: number, a1: number, ib: number, b0: number, b1: number, iw: number, w: number): void {
        this._ax(ia, a0, ib, b0, iw, w, out);
        this._ax(ia, a1, ib, b0, iw, w, out);
        this._ax(ia, a1, ib, b1, iw, w, out);
        this._ax(ia, a0, ib, b1, iw, w, out);
    }

    private _setZone(key: string): void {
        if (key !== this._zoneKey) this._zoneAlpha = 0;
        this._zoneKey = key;
    }
}

/** Line segments with colours, skipping duplicates - adjacent faces share their edges and corners. */
class SegmentSet {
    readonly positions: number[] = [];
    readonly colors: number[] = [];
    private readonly _seen = new Set<string>();

    /** From the point (a, b, w) on axes (ia, ib, iw), moving axis `im` to `to`. */
    add(rim: RimDisplay, color: Color, ia: number, a: number, ib: number, b: number, iw: number, w: number, im: number, to: number): void {
        const start: number[] = [];
        rim._ax(ia, a, ib, b, iw, w, start);
        _rimTriple[ia] = a; _rimTriple[ib] = b; _rimTriple[iw] = w;
        _rimTriple[im] = to;
        const end: number[] = [];
        rim._ax(0, _rimTriple[0], 1, _rimTriple[1], 2, _rimTriple[2], end);
        this._push(start, end, color);
    }

    /** Along axis `il` from `l0` to `l1`, at `ie = e` and `iw = w`. */
    addSpan(rim: RimDisplay, color: Color, il: number, ie: number, e: number, iw: number, w: number, l0: number, l1: number): void {
        const start: number[] = [];
        const end: number[] = [];
        rim._ax(il, l0, ie, e, iw, w, start);
        rim._ax(il, l1, ie, e, iw, w, end);
        this._push(start, end, color);
    }

    private _push(start: number[], end: number[], color: Color): void {
        const ka = start.map(v => v.toFixed(5)).join(","), kb = end.map(v => v.toFixed(5)).join(",");
        const key = ka < kb ? ka + "|" + kb : kb + "|" + ka;
        if (this._seen.has(key)) return;
        this._seen.add(key);
        this.positions.push(...start, ...end);
        this.colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    }
}

function _faceBit(axis: number, sign: number): number {
    return 1 << (axis * 2 + (sign > 0 ? 1 : 0));
}

function _lineMaterial(): LineMaterial {
    return new LineMaterial({
        vertexColors: true,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
        linewidth: 2,
    });
}

function _setSegments(lines: LineSegments2, positions: number[], colors: number[]): void {
    // A fresh geometry: LineSegmentsGeometry cannot grow its instance buffers in place.
    lines.geometry.dispose();
    const geometry = new LineSegmentsGeometry();
    if (positions.length) {
        geometry.setPositions(positions);
        geometry.setColors(colors);
    }
    lines.geometry = geometry;
    lines.visible = positions.length > 0;
}

/**
 * Our visuals must never be hit by a raycast, or they occlude the object they describe and swallow
 * its presses. Physics raycasts meshes through their geometry and never calls `raycast()`, so the
 * engine's own opt-out is used. Not layer 2: scenes can stop rendering it (GalleryManager does).
 */
function _markOwnVisual(obj: Object3D): void {
    obj.userData[_ownVisualKey] = true;
    obj.raycastAllowed = false;
    obj.raycast = () => { };
}
function _isOwnVisual(obj: Object3D): boolean {
    for (let o: Object3D | null = obj; o; o = o.parent) if (o.userData?.[_ownVisualKey]) return true;
    return false;
}
const _ownVisualKey = "dragHandleVisual";

function _isUnder(obj: Object3D, root: Object3D): boolean {
    for (let o: Object3D | null = obj; o; o = o.parent) if (o === root) return true;
    return false;
}

function _isDrawable(image: unknown): image is CanvasImageSource {
    return (typeof HTMLImageElement !== "undefined" && image instanceof HTMLImageElement)
        || (typeof HTMLCanvasElement !== "undefined" && image instanceof HTMLCanvasElement)
        || (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap)
        || (typeof OffscreenCanvas !== "undefined" && image instanceof OffscreenCanvas);
}

/** The resize art points up and to the right: +45 degrees on screen (image rows run down). */
const _resizeIconScreenAngle = Math.PI * 0.25;

/** The instance showing the handles, per context. */
const _owners: Map<object, DragHandleVisualizer> = new Map();

const _spriteName = "DragHandle.Icon";

const _pointerEvents = ["pointermove", "pointerdown", "pointerup", "pointerleave", "pointercancel"] as const;

/** Seconds the pointed-at pose has to stay occupied before the forbidden sign shows. */
const _noRoomDelay = 0.15;

/** Custom cursor size in pixels; browsers draw this size well everywhere. */
const _cursorPixels = 32;

/** World size per "pixel" per metre of distance in XR: 44 px is about 2.5 degrees. */
const _xrWorldPerPixel = 0.001;

const _cursorSuitsInput = (xr: boolean, mouse: boolean) => !xr && mouse;
const _iconSuitsInput = (xr: boolean, mouse: boolean) => xr || !mouse;

const _rimQuery = new GrabRim();
const _lastPointer = new Vector2(Number.NaN, Number.NaN);
const _lastCamera = new Matrix4();
const _camPos = new Vector3();
const _camRight = new Vector3();
const _camUp = new Vector3();
const _axis = new Vector3();
const _from = new Vector3();
const _to = new Vector3();
const _a = new Vector3();
const _b = new Vector3();
const _rimPoint = new Vector3();
const _rimCentre = new Vector3();
const _rimMatrix = new Matrix4();
const _rimScale = new Matrix4();
const _rimTranslate = new Matrix4();
const _rimTriple: number[] = [0, 0, 0];
const _rimView = new Vector3();
const _rimCamPos = new Vector3();
const _rimNormal = new Vector3();
const _rimAxis = new Vector3();
