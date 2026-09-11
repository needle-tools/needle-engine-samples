import {
    Behaviour, DragControls, DragTarget, DragTargetEventArgs, DragStartedEventArgs,
    DragAllowDropEventArgs, DragEndedEventArgs, GameObject, getWorldPosition,
    setWorldPosition, setWorldQuaternion, serializable, Text,
} from "@needle-tools/engine";
import { Color, Mesh, MeshBasicMaterial, Object3D, PlaneGeometry, Quaternion, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

type PieceColor = "white" | "black";
type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
interface PieceInfo { type: PieceType; color: PieceColor; }

const NAME_PATTERN = /^(King|Queen|Castle|Knight|Bishop|Pawn_Body)_([BW])\d*$/;
const TYPE_MAP: Record<string, PieceType> = {
    King: "king", Queen: "queen", Castle: "rook", Knight: "knight", Bishop: "bishop", Pawn_Body: "pawn",
};

const KNIGHT_OFFSETS: [number, number][] = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
const KING_OFFSETS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const DIAGONAL_DIRS: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ORTHOGONAL_DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const _scratchPos = new Vector3();
const _scratchQuat = new Quaternion();

/**
 * Chess move-validation sample sitting next to a {@link DragTarget} in {@link DragTargetMode.Grid}
 * (8x8) mode. Restricts drops to legal squares per piece type, highlights legal destinations while
 * dragging, and handles captures — driven entirely off {@link DragTarget}/{@link DragControls}
 * events, no engine changes required.
 *
 * Pieces are identified by GameObject name: `King_W/B`, `Queen_W/B`, `Castle_W/B` (rook),
 * `Knight_W/B`, `Bishop_W/B`, `Pawn_Body_W/B` (optionally suffixed with a number, e.g. `Pawn_Body_W3`).
 * Each piece must have its own {@link DragControls}.
 *
 * Scope: basic legal moves, path-blocking for sliding pieces, captures and turn order.
 * Not implemented (TODO): check/checkmate detection, castling, en passant, pawn promotion.
 */
export class ChessLogic extends Behaviour {

    /** Whether grid row 0 is White's home side (row 7 = Black). Flip if the scene is authored the other way. */
    @serializable()
    whiteOnRowZero: boolean = true;

    /** Whose turn it currently is. Visible/settable in the inspector for testing. */
    @serializable()
    currentTurn: string = "white";

    /** Size of a highlight quad, as a fraction of the grid's cell spacing (1 = fills a whole square). */
    @serializable()
    highlightSize: number = 2;

    /** Highlight color for an empty, legal destination square. */
    @serializable(Color)
    highlightMoveColor: Color = new Color(0.2, 0.8, 0.33);

    /** Highlight color for a legal destination square that holds a capturable opponent piece. */
    @serializable(Color)
    highlightCaptureColor: Color = new Color(0.867, 0.267, 0.2);

    /** Highlight color marking every piece belonging to whoever's turn it currently is. */
    @serializable(Color)
    activePieceColor: Color = new Color(1, 0.85, 0.2);

    /** Optional UI Text kept updated with whose turn it is, e.g. White to move. Left unset, nothing happens. */
    @serializable(Text)
    turnLabel?: Text;

    private _dragTarget: DragTarget | null = null;
    private _pieceInfo: Map<Object3D, PieceInfo> = new Map();
    private _slotOf: Map<Object3D, number> = new Map();
    private _unsubscribe: Function[] = [];

    private _activeMover: Object3D | null = null;
    private _activeFromSlot: number = -1;
    private _activeLegalSlots: Set<number> = new Set();
    private _pendingCaptureVictim: Object3D | null = null;

    private _highlightPool: Mesh[] = [];
    private _highlightGeometry: PlaneGeometry | null = null;
    private _moveMaterial: MeshBasicMaterial | null = null;
    private _captureMaterial: MeshBasicMaterial | null = null;

    private _activeHighlightPool: Mesh[] = [];
    private _activePieceMaterial: MeshBasicMaterial | null = null;

    onEnable(): void {
        this._dragTarget = GameObject.getComponent(this.gameObject, DragTarget);
        if (!this._dragTarget) {
            console.warn(`${this.name}: ChessLogic requires a DragTarget component on the same object`, this.gameObject);
            return;
        }

        // Without these, pre-placed pieces never register as occupants and captures never work —
        // both default differently than chess needs, so force them rather than rely on scene authoring.
        if (!this._dragTarget.parentOnDrop) {
            console.info(`${this.name}: enabling DragTarget.parentOnDrop (was off, needed to track occupied squares)`);
            this._dragTarget.parentOnDrop = true;
        }
        if (!this._dragTarget.swapOnFullSlot) {
            console.info(`${this.name}: enabling DragTarget.swapOnFullSlot (was off, needed for captures)`);
            this._dragTarget.swapOnFullSlot = true;
        }

        this.buildPieceCache();
        this.ensureHighlightAssets();

        this._unsubscribe.push(this._dragTarget.objectDropped.addEventListener(args => this.onBoardObjectDropped(args)));

        for (const piece of this._pieceInfo.keys()) {
            const dc = GameObject.getComponent(piece, DragControls);
            if (!dc) {
                console.warn(`${this.name}: ${piece.name} has no DragControls, it cannot be dragged`, piece);
                continue;
            }
            this._unsubscribe.push(dc.dragStarted.addEventListener(args => this.onPieceDragStarted(piece, args)));
            this._unsubscribe.push(dc.allowDrop.addEventListener(args => this.onPieceAllowDrop(piece, args)));
            this._unsubscribe.push(dc.dragEnded.addEventListener(args => this.onPieceDragEnded(piece, args)));
        }

        this.refreshActivePieceHighlights();
        this.updateTurnLabel();
    }

    onDisable(): void {
        for (const unsub of this._unsubscribe) unsub();
        this._unsubscribe.length = 0;
        this.disposeHighlights();
        this._pieceInfo.clear();
        this._slotOf.clear();
        this._activeMover = null;
        this._activeFromSlot = -1;
        this._activeLegalSlots = new Set();
        this._pendingCaptureVictim = null;
        this._dragTarget = null;
    }

    // ---- piece identity -----------------------------------------------------------------------

    private parsePieceName(name: string): PieceInfo | null {
        const m = NAME_PATTERN.exec(name);
        if (!m) return null;
        return { type: TYPE_MAP[m[1]], color: m[2] === "W" ? "white" : "black" };
    }

    private buildPieceCache(): void {
        const controls = GameObject.getComponentsInChildren(this.gameObject, DragControls);
        for (const dc of controls) {
            const info = this.parsePieceName(dc.gameObject.name);
            if (!info) continue;
            this._pieceInfo.set(dc.gameObject, info);
            this._slotOf.set(dc.gameObject, this.computeInitialSlot(dc.gameObject));
        }
    }

    /** Inverse of {@link DragTarget.getSlotWorldPosition}'s grid formula, from the object's current world pose. */
    private computeInitialSlot(object: Object3D): number {
        const target = this._dragTarget!;
        const local = this.gameObject.worldToLocal(getWorldPosition(object).clone());
        const cols = Math.max(1, target.gridColumns);
        const rows = Math.max(1, target.gridRows);
        const spacing = target.gridSpacing || 1;
        const col = Math.round(local.x / spacing + (cols - 1) * 0.5);
        const row = Math.round(local.z / spacing + (rows - 1) * 0.5);
        return row * cols + col;
    }

    // ---- coordinate helpers ---------------------------------------------------------------------

    private slotToColRow(slot: number): { col: number; row: number } {
        return { col: slot % 8, row: Math.floor(slot / 8) };
    }

    private colRowToSlot(col: number, row: number): number | null {
        if (col < 0 || col > 7 || row < 0 || row > 7) return null;
        return row * 8 + col;
    }

    private forwardDirection(color: PieceColor): 1 | -1 {
        return (color === "white") === this.whiteOnRowZero ? 1 : -1;
    }

    /** The rank a pawn of this color starts on — used for the two-square first move. */
    private startRow(color: PieceColor): number {
        const whiteStart = this.whiteOnRowZero ? 1 : 6;
        const blackStart = this.whiteOnRowZero ? 6 : 1;
        return color === "white" ? whiteStart : blackStart;
    }

    private occupantAt(slot: number): PieceInfo | null {
        const o = this._dragTarget!.getOccupant(slot);
        return o ? this._pieceInfo.get(o) ?? null : null;
    }

    // ---- move generation --------------------------------------------------------------------------

    private computeLegalDestinations(info: PieceInfo, fromSlot: number): Set<number> {
        if (info.color !== this.currentTurn) return new Set();
        switch (info.type) {
            case "pawn": return this.legalPawnMoves(fromSlot, info.color);
            case "knight": return this.legalStepMoves(fromSlot, info.color, KNIGHT_OFFSETS);
            case "king": return this.legalStepMoves(fromSlot, info.color, KING_OFFSETS);
            case "bishop": return this.legalSlidingMoves(fromSlot, info.color, DIAGONAL_DIRS);
            case "rook": return this.legalSlidingMoves(fromSlot, info.color, ORTHOGONAL_DIRS);
            case "queen": return this.legalSlidingMoves(fromSlot, info.color, [...DIAGONAL_DIRS, ...ORTHOGONAL_DIRS]);
        }
    }

    private legalPawnMoves(fromSlot: number, color: PieceColor): Set<number> {
        const { col, row } = this.slotToColRow(fromSlot);
        const dir = this.forwardDirection(color);
        const out = new Set<number>();

        const oneStep = this.colRowToSlot(col, row + dir);
        if (oneStep !== null && this.occupantAt(oneStep) === null) {
            out.add(oneStep);
            if (row === this.startRow(color)) {
                const twoStep = this.colRowToSlot(col, row + 2 * dir);
                if (twoStep !== null && this.occupantAt(twoStep) === null) out.add(twoStep);
            }
        }

        for (const dc of [-1, 1]) {
            const target = this.colRowToSlot(col + dc, row + dir);
            if (target === null) continue;
            const occ = this.occupantAt(target);
            if (occ && occ.color !== color) out.add(target);
        }

        // TODO: en passant, promotion — out of scope for this sample
        return out;
    }

    private legalStepMoves(fromSlot: number, color: PieceColor, offsets: [number, number][]): Set<number> {
        const { col, row } = this.slotToColRow(fromSlot);
        const out = new Set<number>();
        for (const [dc, dr] of offsets) {
            const target = this.colRowToSlot(col + dc, row + dr);
            if (target === null) continue;
            const occ = this.occupantAt(target);
            if (!occ || occ.color !== color) out.add(target);
        }
        // King TODO: castling. Neither king nor any other piece here checks whether the move would
        // leave its own king in check — check/checkmate detection is out of scope for this sample.
        return out;
    }

    private legalSlidingMoves(fromSlot: number, color: PieceColor, directions: [number, number][]): Set<number> {
        const { col, row } = this.slotToColRow(fromSlot);
        const out = new Set<number>();
        for (const [dc, dr] of directions) {
            let c = col + dc;
            let r = row + dr;
            let target = this.colRowToSlot(c, r);
            while (target !== null) {
                const occ = this.occupantAt(target);
                if (!occ) {
                    out.add(target);
                    c += dc; r += dr;
                    target = this.colRowToSlot(c, r);
                    continue;
                }
                if (occ.color !== color) out.add(target);
                break;
            }
        }
        return out;
    }

    // ---- drag event wiring --------------------------------------------------------------------

    private onPieceDragStarted(piece: Object3D, _args: DragStartedEventArgs): void {
        const info = this._pieceInfo.get(piece);
        const fromSlot = this._slotOf.get(piece);
        if (!info || fromSlot === undefined) return;
        this._activeMover = piece;
        this._activeFromSlot = fromSlot;
        this._activeLegalSlots = this.computeLegalDestinations(info, fromSlot);
        this.showHighlights(this._activeLegalSlots);
    }

    private onPieceAllowDrop(piece: Object3D, args: DragAllowDropEventArgs): void {
        const target = args.dropTarget as DragTarget | null;
        if (!target || target !== this._dragTarget) {
            args.disallow();
            return;
        }
        const toSlot = target.currentSlot;
        if (toSlot < 0 || !this._activeLegalSlots.has(toSlot)) {
            args.disallow();
            return;
        }
        if (args.isRelease) {
            const occupant = target.getOccupant(toSlot);
            this._pendingCaptureVictim = occupant && occupant !== piece ? occupant : null;
        }
    }

    private onPieceDragEnded(_piece: Object3D, _args: DragEndedEventArgs): void {
        this.hideHighlights();
        this._activeMover = null;
        this._activeFromSlot = -1;
        this._activeLegalSlots = new Set();
    }

    private onBoardObjectDropped(args: DragTargetEventArgs): void {
        const object = args.object;

        if (object === this._pendingCaptureVictim) {
            // DragTarget's own swap bookkeeping is about to hand this piece back to the mover's old
            // square — we don't want a swap, we want it captured.
            this._pieceInfo.delete(object);
            this._slotOf.delete(object);
            this._pendingCaptureVictim = null;
            GameObject.destroy(object);
            return;
        }

        const info = this._pieceInfo.get(object);
        if (!info) return;
        const previousSlot = this._slotOf.get(object);
        this._slotOf.set(object, args.slot);
        this._pendingCaptureVictim = null;
        if (previousSlot === args.slot) return; // put back on its own square — not a move, keep the same turn
        this.currentTurn = this.currentTurn === "white" ? "black" : "white";
        this.refreshActivePieceHighlights();
        this.updateTurnLabel();
    }

    private updateTurnLabel(): void {
        if (!this.turnLabel) return;
        this.turnLabel.text = this.currentTurn === "white" ? "White to move" : "Black to move";
    }

    // ---- highlights -----------------------------------------------------------------------------

    private ensureHighlightAssets(): void {
        if (!this._highlightGeometry) {
            const spacing = this._dragTarget?.gridSpacing || 1;
            const size = spacing * this.highlightSize;
            this._highlightGeometry = new PlaneGeometry(size, size);
            this._highlightGeometry.rotateX(-Math.PI / 2);
        }
        if (!this._moveMaterial) {
            this._moveMaterial = new MeshBasicMaterial({ color: this.highlightMoveColor, transparent: true, opacity: 0.35, depthWrite: false });
        }
        if (!this._captureMaterial) {
            this._captureMaterial = new MeshBasicMaterial({ color: this.highlightCaptureColor, transparent: true, opacity: 0.35, depthWrite: false });
        }
        if (!this._activePieceMaterial) {
            this._activePieceMaterial = new MeshBasicMaterial({ color: this.activePieceColor, transparent: true, opacity: 0.35, depthWrite: false });
        }
    }

    private getPooledMesh(index: number): Mesh {
        while (this._highlightPool.length <= index) {
            const mesh = new Mesh(this._highlightGeometry!, this._moveMaterial!);
            mesh.visible = false;
            this.context.scene.add(mesh);
            this._highlightPool.push(mesh);
        }
        return this._highlightPool[index];
    }

    private showHighlights(slots: Set<number>): void {
        const target = this._dragTarget;
        if (!target) return;
        let i = 0;
        for (const slot of slots) {
            const mesh = this.getPooledMesh(i++);
            const pos = target.getSlotWorldPosition(slot, _scratchPos);
            if (!pos) continue;
            const quat = target.getSlotWorldQuaternion(slot, _scratchQuat);
            setWorldPosition(mesh, pos.clone().add(new Vector3(0, 0.002, 0)));
            setWorldQuaternion(mesh, quat);
            mesh.material = this.occupantAt(slot) ? this._captureMaterial! : this._moveMaterial!;
            mesh.visible = true;
        }
        for (; i < this._highlightPool.length; i++) this._highlightPool[i].visible = false;
    }

    private hideHighlights(): void {
        for (const mesh of this._highlightPool) mesh.visible = false;
    }

    /** Persistent marker (independent of the drag-time move/capture highlights) on every piece belonging to whoever's turn it currently is. */
    private refreshActivePieceHighlights(): void {
        const target = this._dragTarget;
        if (!target) return;
        let i = 0;
        for (const [piece, info] of this._pieceInfo) {
            if (info.color !== this.currentTurn) continue;
            const slot = this._slotOf.get(piece);
            if (slot === undefined) continue;
            const pos = target.getSlotWorldPosition(slot, _scratchPos);
            if (!pos) continue;
            const quat = target.getSlotWorldQuaternion(slot, _scratchQuat);
            const mesh = this.getActivePieceMesh(i++);
            setWorldPosition(mesh, pos.clone().add(new Vector3(0, 0.0015, 0)));
            setWorldQuaternion(mesh, quat);
            mesh.visible = true;
        }
        for (; i < this._activeHighlightPool.length; i++) this._activeHighlightPool[i].visible = false;
    }

    private getActivePieceMesh(index: number): Mesh {
        while (this._activeHighlightPool.length <= index) {
            const mesh = new Mesh(this._highlightGeometry!, this._activePieceMaterial!);
            mesh.visible = false;
            this.context.scene.add(mesh);
            this._activeHighlightPool.push(mesh);
        }
        return this._activeHighlightPool[index];
    }

    private disposeHighlights(): void {
        for (const mesh of this._highlightPool) mesh.removeFromParent();
        this._highlightPool.length = 0;
        for (const mesh of this._activeHighlightPool) mesh.removeFromParent();
        this._activeHighlightPool.length = 0;
        this._highlightGeometry?.dispose();
        this._moveMaterial?.dispose();
        this._captureMaterial?.dispose();
        this._activePieceMaterial?.dispose();
        this._highlightGeometry = null;
        this._moveMaterial = null;
        this._captureMaterial = null;
        this._activePieceMaterial = null;
    }
}
