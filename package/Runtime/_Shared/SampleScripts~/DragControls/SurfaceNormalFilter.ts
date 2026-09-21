import {
    Behaviour, DragAllowDropEventArgs, DragControls, DragMode, DragSurfaceData, DragUpdatedEventArgs,
    getParam, Gizmos, MaterialPropertyBlock, Mathf, Renderer, serializable,
} from "@needle-tools/engine";
import { Color, MathUtils, MeshStandardMaterial, Object3D, Quaternion, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

/** Draw what this component is judging, with `?debugsurfacenormal` in the URL. */
const debug = getParam("debugsurfacenormal");

const _worldUp = new Vector3(0, 1, 0);
const _worldDown = new Vector3(0, -1, 0);
const _tip = new Vector3();
const _ring = new Vector3();

/** Scratch for {@link SurfaceNormalFilter.applyUpright}. */
const _uprightQuaternion = new Quaternion();

/** Radius of the sphere every debug gizmo is drawn on, in world units. Furniture scale - raise it
 *  for a larger scene. */
const GIZMO_LENGTH = 0.5;

/** The allowed-region boundaries, in a colour that reads as scenery next to the verdict's own
 *  green and red - these say where the limits are, not what was decided. */
const REGION_COLOR = 0x5577ff;

/**
 * Restricts {@link DragMode.SnapToSurfaces} to the surface orientations it allows - the floor, the
 * walls, the ceiling - each switched on its own and each with its own tolerance from the ideal
 * direction.
 *
 * Put this next to a {@link DragControls} set to {@link DragMode.SnapToSurfaces}. It installs
 * itself as that component's {@link DragControls.surfaceNormalFilter}, which is asked about each
 * candidate surface *before* the object is moved onto it - so a forbidden face is not somewhere the
 * object goes and is then sent back from, it is somewhere the drag never reaches. Aim at a wall
 * with walls switched off and the object stays where it last had a floor, following the pointer
 * again the moment one comes back under it.
 *
 * Let go while there is nowhere allowed under it and the object returns to where the drag picked it
 * up, eased over {@link DragControls.returnDuration}. That is {@link DragControls.allowDrop}
 * refusing the release, and it is what stops a refused drag from quietly leaving the object
 * standing at the last legal spot it passed over - somewhere the user let go well away from and did
 * not choose. It also catches the one case the filter cannot see: a drag that *began* with the
 * object already standing on a forbidden face never offered that face to the filter, so the release
 * is the only place left to notice.
 *
 * Which way a surface faces is read from its normal in world space, so this asks about *faces*
 * rather than objects - the distinction that matters, because a room's floor, walls and ceiling are
 * usually one mesh and {@link DragControls.surfaceObjects} cannot tell them apart.
 *
 * With {@link keepUpright} on, the object stays standing for as long as it is being dragged - its
 * own up axis held on world up, whatever surface it is over - and an object picked up already
 * leaning stands itself up. The way it is *turned* is left exactly as it was: only the lean is
 * taken out, by keeping the twist of its rotation about vertical and dropping the swing.
 *
 * It deliberately does not turn the object to face away from a wall, which sounds like the natural
 * companion to this and is not something that can be worked out. Which side of a mesh is its front
 * is an authoring fact, not a geometric one, and a rule that assumed an answer would face half of
 * all assets into the wall. Point it with the object's own rotation, or with
 * {@link DragControls.customAnchor}, both of which say it rather than guess it.
 *
 * This is the opposite instruction to {@link DragControls.alignToSurfaceNormal}, so the two are not
 * meant to be on together: that one lays the object down onto the surface and its standoff from
 * the surface is measured for the lying-down pose, which is then stood back up here - leaving the
 * object the right way up at the wrong distance.
 *
 * While a drag is running the object can also tint itself - green while letting go would leave it
 * where it is, red while letting go would send it back. That is written
 * as an emissive override through a {@link MaterialPropertyBlock}, so the material itself is never
 * touched and objects sharing one are unaffected. {@link Highlight} writes the same override, so
 * put the two on different renderers rather than the same one.
 *
 * Add `?debugsurfacenormal` to the URL to see the decision as it is made, drawn at the contact
 * point: the surface normal as an arrow with a disc lying in the face's own plane, world up beside
 * it so the measured angle is an angle you can see, a blue ring for each family that is switched on
 * marking exactly where its threshold falls, and a label reading the angle, the family it fell into
 * and the verdict - green for allowed, red for refused.
 *
 * All of it sits on one sphere around the contact point, which is what makes it quick to read: the
 * arrow's tip lands on that sphere and so do the rings, so a tip inside a ring is a surface that
 * family accepts. Worth reaching for the moment this looks like it is doing nothing, because it
 * shows which of the two nothings it is: no rings at all means every family is switched off and so
 * everything is refused, while rings wide enough to leave no gap between them mean the families
 * between them cover the whole sphere and so nothing ever is.
 */
export class SurfaceNormalFilter extends Behaviour {

    /** The DragControls this filters. Found on this object automatically if left unassigned. */
    @serializable(DragControls)
    dragControls?: DragControls;

    /** Allow the object to rest on up-facing surfaces, like a floor or a tabletop. */
    @serializable()
    allowFloor: boolean = true;

    /** How far a surface may tilt from straight up and still count as floor, in degrees. */
    @serializable()
    floorAngle: number = 45;

    /** Allow the object to rest on roughly vertical surfaces, like a wall. Off by default, which
     *  with the floor left on is the common case - furniture that stays on the ground instead of
     *  climbing the walls. Leave every family switched on and nothing is ever refused. */
    @serializable()
    allowWall: boolean = false;

    /** How far either side of exactly vertical a surface may sit and still count as a wall, in
     *  degrees. */
    @serializable()
    wallAngle: number = 45;

    /** Allow the object to rest on down-facing surfaces, like a ceiling or the underside of a
     *  shelf. */
    @serializable()
    allowRoof: boolean = false;

    /** How far a surface may tilt from straight down and still count as roof, in degrees. */
    @serializable()
    roofAngle: number = 45;

    /** Keep the object standing upright while it is dragged: its own up axis is held on world up,
     *  so it never tips to lie flat against a wall or hang off a ceiling, and an object picked up
     *  already leaning stands itself up. Only the tilt is taken away - whichever way the object was
     *  turned, it stays turned that way. Best paired with the DragControls option Align To Surface
     *  Normal switched off, since that one is the opposite instruction. */
    @serializable()
    keepUpright: boolean = false;

    /** Tint the object while it is being dragged, to show in advance what letting go would do.
     *  Needs a renderer, and leaves the object alone the rest of the time. */
    @serializable()
    tintWhileDragging: boolean = true;

    /** The renderer to tint. Found on this object automatically if left unassigned. */
    @serializable(Renderer)
    tintRenderer?: Renderer;

    /** Emissive tint while letting go would leave the object where it is. */
    @serializable(Color)
    allowedColor: Color = new Color(0, 1, 0);

    /** Emissive tint while letting go would send it back to where the drag began. */
    @serializable(Color)
    refusedColor: Color = new Color(1, 0, 0);

    /** How strongly the tint glows. 0 switches the tint off as surely as the toggle does. */
    @serializable()
    tintIntensity: number = 1;

    private readonly _unsubscribes: Function[] = [];
    /** Held so {@link onDisable} can take back exactly the rule it installed, and no other. */
    private readonly _rule = (worldNormal: Vector3, point: Vector3) => this.judge(worldNormal, point);
    private _block?: MaterialPropertyBlock<MeshStandardMaterial>;
    /** Which tint is currently written, or `null` for none - so the override is only rewritten when
     *  the answer actually changes, and only cleared when there is something to clear. */
    private _tinted: boolean | null = null;
    /** The last upright rotation {@link applyUpright} was able to work out, and whether there is
     *  one yet - what the object is held at on the frames that have no yaw to read. Per-instance
     *  rather than scratch, because it has to survive from one frame to the next. */
    private readonly _upright = new Quaternion();
    private _hasUpright = false;

    onEnable(): void {
        this.dragControls ??= this.gameObject.getComponent(DragControls) ?? undefined;
        if (!this.dragControls) {
            console.warn(`${this.name}: SurfaceNormalFilter found no DragControls on this object`, this.gameObject);
            return;
        }
        // The two say opposite things about the object's rotation, and the one that loses still
        // gets a vote on its position - see keepUpright. Worth a word, because the result reads as
        // a placement bug rather than as a settings clash.
        if (this.keepUpright && this.dragControls.alignToSurfaceNormal) {
            console.warn(`${this.name}: SurfaceNormalFilter.keepUpright and DragControls.alignToSurfaceNormal `
                + `are both on. The object will stand up, but its distance from the surface is measured `
                + `for the lying-down pose. Switch off alignToSurfaceNormal.`, this.gameObject);
        }

        // The rule that stops the object reaching a forbidden face at all.
        this.dragControls.surfaceNormalFilter = this._rule;
        // And the backstop: a drag that began already standing on one has no candidate surface to
        // have been refused, so only the release is left to catch it.
        this._unsubscribes.push(
            this.dragControls.allowDrop.addEventListener(e => this.onAllowDrop(e)),
            this.dragControls.dragUpdated.addEventListener(e => this.onDragUpdated(e)),
            // Both endings, because a drag can also be called off without ever being released.
            this.dragControls.dragEnded.addEventListener(() => this.clearTint()),
        );

        this.tintRenderer ??= this.gameObject.getComponent(Renderer) ?? undefined;
    }

    onDisable(): void {
        for (const unsubscribe of this._unsubscribes) unsubscribe();
        this._unsubscribes.length = 0;
        // Overrides outlive this behaviour otherwise, leaving the object stuck at whatever colour
        // it was last tinted.
        this.clearTint();
        // Only if it is still ours - another component may have taken over in the meantime.
        if (this.dragControls?.surfaceNormalFilter === this._rule) this.dragControls.surfaceNormalFilter = null;
    }

    /**
     * The rule itself, asked once per candidate surface before the object is moved onto it.
     *
     * Drawing the gizmo from here rather than from the drop hook is deliberate: this is the only
     * place that sees the faces that were *refused*, since a refused one never becomes the drag's
     * surface and so is never reported back through the events.
     */
    private judge(worldNormal: Vector3, point: Vector3): boolean {
        const angleFromUp = this.angleFromUp(worldNormal);
        const allowed = this.isAllowed(angleFromUp);
        if (debug) this.drawVerdict(point, worldNormal, angleFromUp, allowed);
        return allowed;
    }

    /**
     * Tints the object for the frame just resolved.
     *
     * Read through the same test the release is decided by, so the colour is a promise rather than
     * a hint: green means "let go now and the object stays here", red means "let go now and it goes
     * back to where you picked it up".
     */
    private onDragUpdated(e: DragUpdatedEventArgs): void {
        if (e.mode !== DragMode.SnapToSurfaces) return;
        this.applyTint(this.hasAllowedSurface(e.surfaceData));
        if (this.keepUpright) this.applyUpright(e.object);
    }

    /**
     * Takes the tilt out of the object's rotation for the frame just resolved, leaving the way it
     * is turned alone.
     *
     * This is a swing-twist decomposition about world up, keeping only the twist. A rotation about
     * the up axis has its whole vector part *on* that axis, so zeroing the other two components and
     * renormalising leaves exactly the turn around vertical and drops the lean - which is what
     * "keep it standing" means, stated as arithmetic rather than as a guess.
     *
     * Nothing here asks which way the object faces, and that is the point: no amount of geometry
     * can say which side of a mesh is its front, so a rule that needed to know would have to be
     * told, and would be wrong for half the assets it met. The way the object is already turned is
     * data we have; its front is not.
     *
     * Runs after {@link DragControls.update} has positioned - and, under
     * {@link DragControls.alignToSurfaceNormal}, tilted - the object for this frame, so this is the
     * last word on its rotation. Applying it repeatedly is exactly stable: the twist of an
     * already-upright rotation is that same rotation.
     */
    private applyUpright(object: Object3D): void {
        const q = object.worldQuaternion;
        _uprightQuaternion.set(0, q.y, 0, q.w);

        // Zero length means there is no turn around vertical left to keep: the object is exactly
        // upside down, a half turn about some horizontal axis, and every way up it could be stood
        // is an equally good reading of it. Renormalising would divide by zero, and picking one
        // would make a ceiling spin the object to an arbitrary heading. So hold the last one that
        // did have an answer - and if none has yet, leave the object as it is rather than inventing
        // a heading for it.
        if (_uprightQuaternion.lengthSq() > 1e-8) {
            _uprightQuaternion.normalize();
            this._upright.copy(_uprightQuaternion);
            this._hasUpright = true;
        }
        else if (this._hasUpright) _uprightQuaternion.copy(this._upright);
        else return;

        object.worldQuaternion = _uprightQuaternion;
        object.updateMatrix();
    }

    private applyTint(allowed: boolean): void {
        if (!this.tintWhileDragging) return;
        const block = this.tintBlock();
        if (!block) return;

        // Written only when it changes: overriding is not free, and a drag spends most of its
        // frames on the same side of the answer as the frame before.
        if (this._tinted === allowed) return;
        this._tinted = allowed;
        block.setOverride("emissive", allowed ? this.allowedColor : this.refusedColor);
        block.setOverride("emissiveIntensity", this.tintIntensity);
    }

    private clearTint(): void {
        if (this._tinted === null) return;
        this._tinted = null;
        this.tintBlock()?.clearAllOverrides();
    }

    /** The property block for {@link tintRenderer}, resolved once. Overriding through a block
     *  leaves the shared material untouched, so tinting one object cannot colour every other
     *  object that happens to use the same material. */
    private tintBlock(): MaterialPropertyBlock<MeshStandardMaterial> | undefined {
        if (!this.tintRenderer) return undefined;
        return this._block ??= MaterialPropertyBlock.get<MeshStandardMaterial>(this.tintRenderer.gameObject);
    }

    /**
     * Refuses the release whenever the object does not have an allowed surface under it, which
     * sends it back to where the drag picked it up.
     *
     * The negative is the whole rule, and that is deliberate. A face this component refused never
     * becomes the drag's surface, so "aimed at a forbidden wall" arrives here as no surface at all,
     * exactly like "aimed at open sky" - and neither is a place this object may be left. Refusing
     * only a surface that *is* present would therefore refuse almost nothing: the object would be
     * quietly left standing wherever it last had a legal floor, which is a spot the user let go
     * some distance away from and did not choose.
     *
     * Note the raise is per-frame as well as at the release, so this also drives
     * {@link DragUpdatedEventArgs.dropAllowed} - the drag can say in advance what letting go would do.
     */
    private onAllowDrop(e: DragAllowDropEventArgs): void {
        if (e.mode !== DragMode.SnapToSurfaces) return;
        // The veto is one-way - once refused, nothing can put the object back, so there is nothing
        // left for this listener to decide.
        if (!e.allowed) return;

        if (!this.hasAllowedSurface(e.surfaceData)) e.disallow();
    }

    /**
     * Whether the frame just resolved has somewhere allowed under the object.
     *
     * The angle is re-tested rather than trusted from the presence of a surface alone, because a
     * drag that *began* with the object already standing on a forbidden face never offered that
     * face to the filter - nothing was refused, so nothing was missing - and the release is the
     * only place left to catch it.
     */
    private hasAllowedSurface(surface: DragSurfaceData | null): boolean {
        if (!surface) return false;
        return this.isAllowed(this.angleFromUp(surface.normal));
    }

    /** How far the surface tilts from world up, in degrees - the one measurement every rule below
     *  is expressed against. */
    private angleFromUp(worldNormal: Vector3): number {
        const dot = Mathf.clamp(worldNormal.dot(_worldUp), -1, 1);
        return MathUtils.radToDeg(Math.acos(dot));
    }

    private isAllowed(angleFromUp: number): boolean {
        if (this.allowFloor && angleFromUp <= this.floorAngle) return true;
        if (this.allowRoof && angleFromUp >= 180 - this.roofAngle) return true;
        if (this.allowWall && Math.abs(angleFromUp - 90) <= this.wallAngle) return true;
        return false;
    }

    /**
     * Which family the surface falls into by its angle alone, ignoring whether that family is
     * switched on - `none` when it falls in a gap between the three.
     *
     * Kept apart from {@link isAllowed} on purpose, and tested in the same order: the label is then
     * able to say *geometry* and *policy* separately, which is the difference between "that is not a
     * wall" and "that is a wall and you are allowing walls".
     */
    private familyName(angleFromUp: number): string {
        if (angleFromUp <= this.floorAngle) return "floor";
        if (angleFromUp >= 180 - this.roofAngle) return "roof";
        if (Math.abs(angleFromUp - 90) <= this.wallAngle) return "wall";
        return "none";
    }

    /**
     * Draws the surface this component is judging and the verdict it reached.
     *
     * Everything here is drawn on one sphere of radius {@link GIZMO_LENGTH} around the contact
     * point, and that is what makes the picture readable rather than merely decorative: the normal
     * arrow's tip lands on that sphere, and so does every boundary ring, so "is this surface
     * allowed" becomes the one thing the eye is good at - whether a point is inside a ring or
     * outside it. The numbers in the label then only confirm what the shape already showed.
     */
    private drawVerdict(point: Vector3, normal: Vector3, angleFromUp: number, allowed: boolean): void {
        const color = allowed ? 0x00ff00 : 0xff0000;

        // The allowed regions first, so the arrow and the disc draw over them rather than under.
        this.drawAllowedRegions(point);

        // World up from the contact point, so the angle the rules are stated in is a visible angle
        // between two drawn lines rather than a number to be taken on trust.
        Gizmos.DrawLine(point, _tip.copy(point).addScaledVector(_worldUp, GIZMO_LENGTH), REGION_COLOR, 0, false);

        Gizmos.DrawWireSphere(point, GIZMO_LENGTH * 0.06, color, 0, false);

        // The face's own plane, as a disc lying in it. The arrow alone leaves which way the surface
        // is turned to be inferred from a single line; the disc shows it directly, and a face seen
        // edge-on - the case where an arrow pointing nearly at the camera tells you least - is
        // exactly the case where the disc is widest.
        Gizmos.DrawCircle(point, normal, GIZMO_LENGTH * 0.35, color, 0, false);

        _tip.copy(point).addScaledVector(normal, GIZMO_LENGTH);
        Gizmos.DrawArrow(point, _tip, color, 0, false);

        // ASCII only - a degree sign renders the whole label as an empty box.
        const text = `${Math.round(angleFromUp)} deg / ${this.familyName(angleFromUp)} / ${allowed ? "allowed" : "refused"}`;
        Gizmos.DrawLabel(_tip, text, GIZMO_LENGTH * 0.06, 0, color, undefined, undefined, false);
    }

    /**
     * Draws the boundary of every family that is currently switched on.
     *
     * These are where the thresholds actually fall, which is the thing a bare arrow and an angle
     * cannot show: the label says a surface came in at 52 degrees, but only the ring says whether
     * that was comfortably inside the limit or a degree the wrong side of it. Nothing is drawn for
     * a family that is switched off - an absent ring is itself the reading, and the usual cause of
     * "this refuses everything" is seeing no rings at all.
     */
    private drawAllowedRegions(point: Vector3): void {
        if (this.allowFloor) this.drawBoundaryRing(point, _worldUp, this.floorAngle);
        if (this.allowRoof) this.drawBoundaryRing(point, _worldDown, this.roofAngle);
        // A band around the horizon rather than a cap on an axis, so it takes both of its edges -
        // measured from up, like every other angle here, so the two rings are the same measurement
        // as the others rather than a second convention to hold in mind.
        if (this.allowWall) {
            this.drawBoundaryRing(point, _worldUp, 90 - this.wallAngle);
            this.drawBoundaryRing(point, _worldUp, 90 + this.wallAngle);
        }
    }

    /**
     * Draws the rim of the cone that opens `halfAngle` degrees around `axis`, as a ring lying on
     * the gizmo sphere - so a normal arrow whose tip falls inside the ring is one this family
     * accepts, and the comparison needs no arithmetic.
     */
    private drawBoundaryRing(point: Vector3, axis: Vector3, halfAngle: number): void {
        const theta = MathUtils.degToRad(Mathf.clamp(halfAngle, 0, 180));
        const radius = Math.sin(theta) * GIZMO_LENGTH;
        // A cone opened to nothing, or all the way round to a half turn, has no rim: at one end the
        // family accepts nothing, at the other it accepts everything, and neither has a boundary to
        // draw. Drawing the degenerate ring anyway would put a dot at the pole, which reads as a
        // pinhole of an allowed region - wrong in the first case and backwards in the second.
        if (radius < 1e-4) return;
        _ring.copy(point).addScaledVector(axis, Math.cos(theta) * GIZMO_LENGTH);
        Gizmos.DrawCircle(_ring, axis, radius, REGION_COLOR, 0, false);
    }
}
