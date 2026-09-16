import {
    Behaviour, DragControls, DragMode, GameObject, GrabGesture, serializable,
} from "@needle-tools/engine";
import {
    Camera, Color, Object3D, OrthographicCamera, PerspectiveCamera, Sprite, SpriteMaterial,
    Texture, Vector2, Vector3,
} from "three";

// Documentation → https://docs.needle.tools/scripting

/**
 * When one half of the handle display is shown - see {@link DragHandleVisualizer.showIcon} and
 * {@link DragHandleVisualizer.useCursor}.
 *
 * The two halves suit opposite inputs, which is what {@link Auto} exists for: a mouse already has a
 * pointer on screen and the cheapest, most familiar way to say what a spot does is to change it,
 * while in XR there is no cursor to change at all and the only place to put the answer is in the
 * scene. Touch has no hover to speak of, so nothing is shown until a drag starts and the handle is
 * the only half that means anything.
 */
export enum HandleDisplay {
    /** Decide from whatever is driving the pointer right now, and keep deciding - a session that
     *  enters XR partway through switches over with it. */
    Auto = 0,
    /** Always shown, whatever the input. */
    Always = 1,
    /** Never shown. */
    Never = 2,
}

/**
 * Shows the user what a {@link DragControls} object will do **before** they drag it: a handle icon
 * under the pointer, and a matching mouse cursor, saying whether this spot moves the object, turns
 * it, or resizes it.
 *
 * A draggable object is otherwise opaque. With {@link DragControls.rotateOnEdgeGrab} and
 * {@link DragControls.scaleOnCornerGrab} the same object answers to three different gestures
 * depending on where it is taken hold of — the middle moves it, the sides turn it, the corners
 * resize it — and nothing on screen says so. The user finds out by dragging and undoing. This is
 * the affordance that free-transform tools in every image editor already provide, brought to a 3D
 * scene: point at a corner, see the resize arrows, know what will happen.
 *
 * Drop one of these anywhere in the scene. It watches the pointer, not any particular object, so a
 * single instance covers every draggable there is — including ones spawned later.
 *
 * One is also all a scene needs, and all it should have: two would draw two handles in the same
 * spot and overwrite each other's cursor every frame. Only the instance enabled first does the
 * work; any other stands by in case that one goes away, and says so once in the console.
 *
 * | What the pointer is over | Icon | Cursor |
 * |---|---|---|
 * | the body of a movable object, or {@link DragMode.Slide} | four-way arrows, aligned to the slide axis where there is one | `move` |
 * | a side, with {@link DragControls.rotateOnEdgeGrab} on — or a turn mode | a circular arrow | `grab` |
 * | a corner, with {@link DragControls.scaleOnCornerGrab} on — or {@link DragMode.Scale} | a box with an arrow growing out of it, pointing out of the nearest corner | `nwse-resize` / `neswresize` |
 * | nothing draggable | hidden | restored |
 *
 * Assign the four icons below from the shared Icons folder — DragHandleMove, DragHandleSlide,
 * DragHandleTurn, DragHandleResize — or your own art in their place. Any icon left empty simply
 * shows no handle for that gesture; the cursor still changes.
 *
 * Which of the two halves is used is by default decided by the input, and re-decided as it changes
 * — the cursor for a mouse, the in-scene icon for XR and touch. See {@link HandleDisplay}.
 *
 * @example Cursor only, whatever the input
 * ```ts
 * const handles = scene.addComponent(DragHandleVisualizer);
 * handles.showIcon = HandleDisplay.Never;
 * handles.useCursor = HandleDisplay.Always;
 * ```
 */
export class DragHandleVisualizer extends Behaviour {

    /** Show the handle icon in the scene, under the pointer. On Auto it appears for every input
     *  except a mouse, which is better served by the cursor below. */
    @serializable()
    showIcon: HandleDisplay = HandleDisplay.Auto;

    /**
     * Set the mouse cursor to match the gesture. On Auto it is used for mouse input only - there is
     * no cursor to set in XR, and none worth setting on a touch screen.
     *
     * Restored to whatever it was as soon as the pointer leaves a draggable, on disable, and the
     * moment Auto stops choosing it - so this never leaves a stuck cursor behind.
     */
    @serializable()
    useCursor: HandleDisplay = HandleDisplay.Auto;

    /** How big the icon is drawn, in screen pixels. Constant at any distance: a handle is a piece
     *  of interface, and a piece of interface that shrinks into the distance stops being clickable
     *  long before it stops being drawn. */
    @serializable()
    iconSize: number = 44;

    /**
     * Nudge the icon away from the spot it marks, in screen pixels: X to the right, Y up.
     *
     * Screen pixels rather than world units so the nudge holds its distance at any depth and any
     * zoom, exactly as the icon size does. A world-space offset would drift as the camera moved and
     * would have to be retuned for every object it was used on.
     *
     * Useful mainly to get the icon out from under the mouse cursor, which sits at that same spot
     * and otherwise covers it. Something like 0, 28 puts the handle just above the pointer.
     */
    @serializable(Vector2)
    screenOffset: Vector2 = new Vector2(0, 0);

    /** Icon tint. Multiplies the assigned art, so white leaves it exactly as authored. The supplied
     *  icons have a near-black plate behind the glyph, which a tint leaves neutral. */
    @serializable(Color)
    color: Color = new Color(1, 1, 1);

    /** How solid the icon is. */
    @serializable()
    opacity: number = 0.9;

    /** Keep showing the handle while a drag is actually running. On by default: the icon tracks the
     *  live pointer through the drag and is the clearest confirmation that the gesture the user
     *  aimed for is the one they got. */
    @serializable()
    showWhileDragging: boolean = true;

    /** Art for free movement, shown on the body of an object that can be carried anywhere.
     *  DragHandleMove in the shared Icons folder. */
    @serializable(Texture)
    moveIcon: Texture | null = null;

    /** Art for movement along one axis, turned onto that axis at runtime. DragHandleSlide. */
    @serializable(Texture)
    slideIcon: Texture | null = null;

    /** Art for rotation. DragHandleTurn. */
    @serializable(Texture)
    turnIcon: Texture | null = null;

    /** Art for resizing, turned onto the corner being grabbed. DragHandleResize, whose arrow is
     *  drawn pointing up and to the right - see the note on the icon angle if you replace it. */
    @serializable(Texture)
    resizeIcon: Texture | null = null;

    /**
     * Only show handles for objects under this one. Leave empty to watch the whole scene, which is
     * the usual setup — set it when only part of a scene is meant to look editable.
     */
    @serializable(Object3D)
    root: Object3D | null = null;

    // #region lifecycle

    onEnable(): void {
        if (!_owners.has(this.context)) _owners.set(this.context, this);
        this._sprite = this._createSprite();
        this.context.scene.add(this._sprite);
        // Passive: this only ever reads the event's type, and saying so lets the browser keep
        // scrolling off the main thread.
        const el = this.context.domElement as HTMLElement | undefined;
        el?.addEventListener("pointermove", this._onPointerEvent, { passive: true });
        el?.addEventListener("pointerdown", this._onPointerEvent, { passive: true });
    }

    onDisable(): void {
        if (_owners.get(this.context) === this) _owners.delete(this.context);
        this._sprite?.removeFromParent();
        this._sprite = null;
        this._restoreCursor();
        const el = this.context.domElement as HTMLElement | undefined;
        el?.removeEventListener("pointermove", this._onPointerEvent);
        el?.removeEventListener("pointerdown", this._onPointerEvent);
    }

    onDestroy(): void {
        if (_owners.get(this.context) === this) _owners.delete(this.context);
        // onDisable has usually run already, but a component removed outright never sees it, and a
        // cursor left as a resize arrow over a scene with no handles in it is a visible bug.
        this._restoreCursor();
        // The material is ours; the textures on it are assets shared with whatever else uses them.
        this._sprite?.material.dispose();
    }

    update(): void {
        if (!this._owns()) {
            this._hide();
            return;
        }
        const found = this._resolve();
        if (!found) {
            this._hide();
            return;
        }
        this._show(found.gesture, found.point, found.drag);
    }

    /**
     * Whether this is the instance doing the work - see the note on the class.
     *
     * Asked every frame rather than settled once on enable, so that whichever instance is left
     * takes over the moment the one holding it is disabled or removed, rather than the scene
     * losing its handles for good.
     */
    private _owns(): boolean {
        const owner = _owners.get(this.context);
        if (owner === this) return true;
        // An owner that is disabled or destroyed counts as gone. Checked here rather than trusted
        // to have released the claim on its way out, because a component removed outright can skip
        // both onDisable and onDestroy — and a claim left pointing at a dead instance would leave
        // the scene with no handles at all, which is worse than the duplicate this guards against.
        if (!owner || !owner.activeAndEnabled) {
            _owners.set(this.context, this);
            return true;
        }
        if (!this._warnedDuplicate) {
            this._warnedDuplicate = true;
            console.warn("[DragHandleVisualizer] More than one in the scene: the one on "
                + owner.gameObject.name + " is showing the handles, the one on " + this.gameObject.name
                + " is standing by. A single instance already covers every draggable object.");
        }
        return false;
    }
    private _warnedDuplicate: boolean = false;

    // #endregion

    // #region what is under the pointer

    /**
     * The gesture available right now, and where.
     *
     * A drag in flight answers first and answers itself: once the object is moving, the question is
     * no longer what is under the pointer — the pointer has usually left the object entirely — but
     * what this drag is doing, and {@link DragControls.pointerState} is what knows. Only when
     * nothing is being dragged does this fall back to a raycast.
     */
    private _resolve(): { gesture: GrabGesture, point: Vector3, drag: DragControls } | null {
        const active = this._activeDrag();
        if (active) {
            if (!this.showWhileDragging) return null;
            const state = active.pointerState;
            // Attached and the two-pointer gestures resolve no single point; the object itself is
            // the honest place to put the handle then.
            const point = state?.point ?? (active.draggedObject ?? active.dragObject)?.worldPosition;
            if (!point) return null;
            const gesture = this._gestureOfRunningDrag(active);
            return gesture === null ? null : { gesture, point, drag: active };
        }

        const hits = this.context.physics.raycast({
            targets: this.root ? [this.root] : undefined,
        });
        for (const hit of hits) {
            if (!hit.object || hit.object === this._sprite) continue;
            const drag = GameObject.getComponentInParent(hit.object, DragControls);
            if (!drag || !drag.activeAndEnabled) continue;
            const gesture = drag.getGestureAt(hit.point);
            if (gesture === null) continue;
            return { gesture, point: hit.point, drag };
        }
        return null;
    }

    /** The DragControls currently dragging something, if any. Cheap: the scene is only walked while
     *  the last known one has stopped, and a drag is the moment when that is least likely. */
    private _activeDrag(): DragControls | null {
        if (this._lastActive?.pointerState) return this._lastActive;
        const all = GameObject.getComponentsInChildren(this.root ?? this.context.scene, DragControls);
        for (const drag of all ?? []) {
            if (drag.pointerState) { this._lastActive = drag; return drag; }
        }
        this._lastActive = null;
        return null;
    }
    private _lastActive: DragControls | null = null;

    /**
     * What a running drag is doing.
     *
     * Read from the mode the drag actually resolved rather than from the point, because an edge
     * grab has already made its decision: the drag is turning the object whatever the pointer has
     * since wandered over, and re-reading the zone under a pointer that has left the object would
     * flicker the icon through every gesture on the way out.
     */
    private _gestureOfRunningDrag(drag: DragControls): GrabGesture | null {
        switch (drag.pointerState?.mode ?? drag.dragMode) {
            case DragMode.None: return null;
            case DragMode.Scale: return GrabGesture.Resize;
            case DragMode.HingeRotate:
            case DragMode.Rotate:
            case DragMode.ScaleAndRotate: return GrabGesture.Turn;
            default: return GrabGesture.Move;
        }
    }

    // #endregion

    // #region presentation

    private _show(gesture: GrabGesture, point: Vector3, drag: DragControls): void {
        if (this._enabled(this.useCursor, _cursorSuitsInput)) this._setCursor(this._cursorFor(gesture, point, drag));
        // Not merely skipped: Auto can stop choosing the cursor mid-session, when a headset is put
        // on, and the one already set would otherwise stay on the canvas for good.
        else this._restoreCursor();

        const sprite = this._sprite;
        if (!sprite || !this._enabled(this.showIcon, _iconSuitsInput)) {
            if (sprite) sprite.visible = false;
            return;
        }

        const material = sprite.material as SpriteMaterial;
        material.map = this._textureFor(gesture, drag);
        material.opacity = this.opacity;
        material.color.copy(this.color);
        material.needsUpdate = true;

        sprite.position.copy(point);
        sprite.visible = true;
        // Screen-space turn, so a slide's arrows lie along the axis the object actually travels and
        // a corner's arrows point out of the corner they belong to.
        material.rotation = this._screenRotationFor(gesture, point, drag);
        this._placeOnScreen(sprite, point);
    }

    private _hide(): void {
        if (this._sprite) this._sprite.visible = false;
        this._restoreCursor();
    }

    /** Whether a half of the display is on, resolving {@link HandleDisplay.Auto} through `suits`. */
    private _enabled(setting: HandleDisplay, suits: (xr: boolean, mouse: boolean) => boolean): boolean {
        if (setting === HandleDisplay.Always) return true;
        if (setting === HandleDisplay.Never) return false;
        return suits(this._isXR(), this._isMouse());
    }

    /** Whether an XR session is running. Asked every frame rather than cached at start-up: a page
     *  begins on a flat screen and enters XR later, and the answer has to change with it. */
    private _isXR(): boolean {
        return this.context.isInXR === true;
    }

    /**
     * Whether the pointer being used is a mouse.
     *
     * Taken from the DOM events directly rather than from `context.input.getIsMouse`, which records
     * the pointer's type only when a button goes **down**. This component works entirely on hover —
     * everything it does happens before anything is pressed — so that answer is always no here, and
     * a mouse would never once be recognised as one.
     *
     * Before any pointer has moved there is nothing to have observed, so the device is asked what
     * kind of pointer it primarily has. That is the right question at that moment and the wrong one
     * afterwards: a laptop with a touchscreen reports a fine hovering pointer whichever the user is
     * actually reaching for, which is why an observed event always wins.
     */
    private _isMouse(): boolean {
        if (this._lastPointerType !== null) return this._lastPointerType === "mouse";
        return globalThis.matchMedia?.("(hover: hover) and (pointer: fine)").matches === true;
    }
    private _lastPointerType: string | null = null;
    private readonly _onPointerEvent = (e: Event) => {
        const type = (e as PointerEvent).pointerType;
        if (type) this._lastPointerType = type;
    };

    /**
     * Give the sprite its size and its nudge, both of which are asked for in screen pixels and so
     * both of which come from the same number: how much world one pixel is worth where the icon is
     * standing.
     */
    private _placeOnScreen(sprite: Sprite, point: Vector3): void {
        const cam = this.context.mainCamera as Camera | null;
        const perPixel = this._worldPerPixel(point);
        if (!cam || perPixel <= 0) return;

        const size = this.iconSize * perPixel;
        sprite.scale.set(size, size, 1);

        const offset = this.screenOffset;
        if (!offset || (offset.x === 0 && offset.y === 0)) return;
        // The camera's own right and up in world space: the two directions the screen's x and y
        // actually lie along, whatever the camera is doing. Reading them from the matrix means a
        // tilted or rolled camera moves the icon the way the screen would, not the way the world
        // would.
        _camRight.setFromMatrixColumn(cam.matrixWorld, 0).normalize();
        _camUp.setFromMatrixColumn(cam.matrixWorld, 1).normalize();
        sprite.position
            .addScaledVector(_camRight, offset.x * perPixel)
            .addScaledVector(_camUp, offset.y * perPixel);
    }

    /**
     * How much world space one screen pixel covers at `point`, or 0 when that cannot be worked out.
     *
     * The world height of the viewport at the icon's depth, divided by the viewport's height in
     * pixels. An orthographic camera's viewport height does not depend on distance at all, which is
     * the whole difference between the two branches.
     */
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
     * How far to turn the icon on screen, in radians.
     *
     * A slide follows its own axis, so the arrows lie along the track the object actually runs on.
     * Resize points out of the corner being grabbed, which is the convention a free-transform box
     * already sets. Move is a cross and Turn a circle; both read the same at every angle and are
     * left alone.
     *
     * Each result has the angle the icon is **drawn** at subtracted from it: the arrows are baked
     * into the bitmap pointing somewhere already, and rotating by the target angle alone would add
     * the two together. Only the resize icon is drawn off-axis, on the 45 degree diagonal.
     */
    private _screenRotationFor(gesture: GrabGesture, point: Vector3, drag: DragControls): number {
        const cam = this.context.mainCamera;
        if (!cam) return 0;

        if (gesture === GrabGesture.Move && drag.dragMode === DragMode.Slide) {
            const axis = drag.getModeAxis(_axis);
            if (!axis) return 0;
            _from.copy(point).addScaledVector(axis, -0.5);
            _to.copy(point).addScaledVector(axis, 0.5);
            // The slide arrows are drawn along 0, so the screen angle is already the turn.
            return this._screenAngle(_from, _to, cam);
        }

        if (gesture === GrabGesture.Resize) {
            const object = drag.draggedObject ?? drag.dragObject;
            if (!object) return 0;
            // Out of the object's centre through the grabbed corner: the direction the corner is
            // pulled to grow the object, which is the direction the arrows should lie along. Less
            // the diagonal they are drawn on, or the icon ends up a right angle away from it.
            const angle = this._screenAngle((object as Object3D).getWorldPosition(_from), point, cam);
            return angle - _resizeIconScreenAngle;
        }

        return 0;
    }

    /** The on-screen angle of the segment `from`→`to`, measured the way `SpriteMaterial.rotation`
     *  measures it. */
    private _screenAngle(from: Vector3, to: Vector3, cam: Camera): number {
        _a.copy(from).project(cam);
        _b.copy(to).project(cam);
        // The viewport is rarely square, and an angle measured in normalized device coordinates on
        // a wide viewport points somewhere the user is not looking.
        const aspect = (this.context.domWidth || 1) / (this.context.domHeight || 1);
        const dx = (_b.x - _a.x) * aspect;
        const dy = _b.y - _a.y;
        if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return 0;
        return Math.atan2(dy, dx);
    }

    // #endregion

    // #region cursor

    private _cursorFor(gesture: GrabGesture, point: Vector3, drag: DragControls): string {
        switch (gesture) {
            // The one gesture CSS has no cursor for. Move has `move` and a resize has the four
            // `*-resize` arrows, all of which say what they mean; rotation has nothing, and `grab`
            // - an open hand - says only that the thing can be picked up. So the assigned art is
            // used as the cursor itself where there is any, which is also the only way the turn
            // icon is ever seen on a desktop: Auto shows the cursor there and not the handle.
            case GrabGesture.Turn: return this._imageCursor(this.turnIcon) ?? "grab";
            case GrabGesture.Resize: {
                // Which way the corner lies on screen, picked from the four resize cursors by
                // octant — the same set, and the same split, a free-transform box uses. The icon's
                // own drawn angle is added back because what is wanted here is the direction
                // itself, not the turn that gets the bitmap onto it.
                const angle = this._screenRotationFor(gesture, point, drag) + _resizeIconScreenAngle;
                // Into 0..180: a direction and its opposite call for the same cursor. Measured in
                // normalized device coordinates, where y runs up — so 45 degrees slopes up and to
                // the right, which is the north-east/south-west diagonal.
                const deg = ((angle * 180 / Math.PI) % 180 + 180) % 180;
                if (deg < 22.5 || deg >= 157.5) return "ew-resize";
                if (deg < 67.5) return "nesw-resize";
                if (deg < 112.5) return "ns-resize";
                return "nwse-resize";
            }
            default: return "move";
        }
    }

    /**
     * A CSS cursor drawn from an icon texture, or `null` where there is no usable image yet.
     *
     * Browsers cap a custom cursor at well under the icon's own resolution, so it is redrawn at
     * {@link _cursorPixels} with its hotspot in the middle — which is where a rotation glyph points
     * from. The keyword after the comma is what the browser falls back to if it refuses the image.
     *
     * Only successes are cached: a texture whose bitmap has not finished decoding answers `null`
     * now and the real thing a frame or two later, and caching that first `null` would mean the
     * cursor never appeared at all.
     */
    private _imageCursor(texture: Texture | null): string | null {
        if (!texture) return null;
        const cached = this._cursorCache.get(texture);
        if (cached) return cached;
        const image = texture.image as CanvasImageSource & { width?: number, naturalWidth?: number } | null;
        if (!image || !(image.naturalWidth || image.width)) return null;
        try {
            const size = _cursorPixels;
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = size;
            canvas.getContext("2d")?.drawImage(image, 0, 0, size, size);
            const value = `url(${canvas.toDataURL("image/png")}) ${size / 2} ${size / 2}, grab`;
            this._cursorCache.set(texture, value);
            return value;
        }
        catch {
            // A texture from another origin taints the canvas and toDataURL throws. Nothing to be
            // done about it here, and the keyword cursor is a fine answer.
            return null;
        }
    }
    private readonly _cursorCache: Map<Texture, string> = new Map();

    /** Sets the cursor, remembering what was there so {@link _restoreCursor} can put it back.
     *  Whether the cursor is wanted at all is decided by the caller. */
    private _setCursor(cursor: string): void {
        const el = this.context.domElement as HTMLElement | undefined;
        if (!el || this._cursor === cursor) return;
        if (this._cursor === null) this._previousCursor = el.style.cursor;
        el.style.cursor = cursor;
        this._cursor = cursor;
    }

    /**
     * Put the cursor back exactly once, and only if it is still the one we set.
     *
     * Anything else in the page may have set its own cursor since — a UI overlay, another
     * interaction script — and stamping our remembered value over theirs would be the same bug in
     * the other direction.
     */
    private _restoreCursor(): void {
        if (this._cursor === null) return;
        const el = this.context.domElement as HTMLElement | undefined;
        if (el && el.style.cursor === this._cursor) el.style.cursor = this._previousCursor;
        this._cursor = null;
    }
    private _cursor: string | null = null;
    private _previousCursor: string = "";

    // #endregion

    // #region the sprite and its icons

    private _sprite: Sprite | null = null;

    private _createSprite(): Sprite {
        const material = new SpriteMaterial({
            transparent: true,
            // A handle is interface, not scenery: it belongs in front of the thing it labels, and
            // half of it disappearing into a sofa arm would say the wrong thing about where it is.
            depthTest: false,
            depthWrite: false,
            toneMapped: false,
        });
        const sprite = new Sprite(material);
        sprite.visible = false;
        sprite.renderOrder = 10000;
        // Off the raycast layer, or the handle sits under the pointer and shadows the very object
        // it is describing — the icon would be the only thing ever hit.
        sprite.layers.set(2);
        // Deliberately not the component's own name: a GameObject carrying this component is very
        // likely called that too, and a scene with both in it makes getObjectByName ambiguous —
        // which silently hands back whichever the traversal reaches first.
        sprite.name = _spriteName;
        return sprite;
    }

    /**
     * The icon for this gesture, or `null` when none has been assigned — in which case the cursor
     * still changes and only the in-scene handle is missing.
     *
     * {@link DragMode.Slide} splits off from the rest of Move because it does not move freely: it
     * runs on one axis, and a four-way cross over a drawer promises two directions of travel that
     * do not exist. It falls back to {@link moveIcon} where no slide art is assigned, which is
     * wrong in the same small way but better than showing nothing.
     */
    private _textureFor(gesture: GrabGesture, drag: DragControls): Texture | null {
        if (gesture === GrabGesture.Turn) return this.turnIcon;
        if (gesture === GrabGesture.Resize) return this.resizeIcon;
        if (drag.dragMode === DragMode.Slide) return this.slideIcon ?? this.moveIcon;
        return this.moveIcon;
    }

    // #endregion
}

/**
 * The diagonal the resize icon's arrow already points along, measured the way the screen measures
 * angles — which has to be taken off the direction wanted before the sprite is turned onto it,
 * since rotating art that already points somewhere adds the two together.
 *
 * Positive because the arrow runs from the image's bottom-left box out to its top-right corner, and
 * image rows go **down** while screen angles go up: the same diagonal is minus 45 degrees in the
 * image and plus 45 on screen. Getting this sign wrong leaves the icon a right angle away from the
 * direction it means to point along — which still looks like a plausible arrow, and is why it is
 * named here rather than inlined.
 *
 * The arrow points one way only, so this is the whole 360 degrees and not just the diagonal:
 * replacing DragHandleResize with art pointing anywhere else means putting that angle here.
 */
const _resizeIconScreenAngle = Math.PI * 0.25;

/**
 * {@link HandleDisplay.Auto} for the cursor: a mouse, and nothing else.
 *
 * XR has no cursor at all, and a touch screen has one only in the sense that the browser will let
 * you set a property nobody will ever see.
 */
/** Scene-graph name for the handle sprite. Distinct from the component's own name on purpose —
 *  see where it is assigned. */
/**
 * The instance showing the handles, per context. Every instance watches the whole scene, so a
 * second one has nothing of its own to do and would only fight the first for the canvas cursor.
 * Claimed on enable and released on disable and destroy, but never trusted: the holder is checked
 * for being alive on every read, so a claim can never strand the scene without handles.
 */
const _owners: Map<object, DragHandleVisualizer> = new Map();

const _spriteName = "DragHandle.Icon";

/** Side of a custom mouse cursor, in pixels. Browsers cap these — Chrome refuses anything over 128
 *  and the practical size every platform draws well is this one. */
const _cursorPixels = 32;

const _cursorSuitsInput = (xr: boolean, mouse: boolean) => !xr && mouse;

/**
 * {@link HandleDisplay.Auto} for the icon: everything except a mouse.
 *
 * A mouse already carries the answer in its own cursor, and a second copy of it floating in the
 * scene an inch away is noise. Every other input has nowhere else to put it.
 */
const _iconSuitsInput = (xr: boolean, mouse: boolean) => xr || !mouse;

const _camPos = new Vector3();
const _camRight = new Vector3();
const _camUp = new Vector3();
const _axis = new Vector3();
const _from = new Vector3();
const _to = new Vector3();
const _a = new Vector3();
const _b = new Vector3();
