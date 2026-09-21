import {
    Behaviour, DragControls, IPointerEventHandler, Mathf, MaterialPropertyBlock,
    PointerEventData, Renderer, serializable,
} from "@needle-tools/engine";
import { Color, MeshStandardMaterial } from "three";

// Documentation → https://docs.needle.tools/scripting

/**
 * Glows {@link renderer}'s emission while the pointer hovers it, or while its {@link DragControls}
 * is being dragged - the same `MaterialPropertyBlock` approach {@link OvenPlateController} uses for
 * its plates, so the shared material itself is never cloned or touched. Works equally on a button
 * or any other clickable mesh, and needs no `DragControls` at all - that part only adds a second
 * reason to glow.
 *
 * Drop this on the object to highlight, or point {@link renderer} at a different one - useful when
 * the mesh that should light up isn't the one receiving the pointer events. {@link dragControls} is
 * found automatically on this object if left unassigned; assign one explicitly to highlight a
 * renderer for a `DragControls` that lives elsewhere. Keeping the glow on for the whole drag matters
 * in XR or a two-handed gesture, where the pointer is usually no longer over the object once the
 * drag is actually running.
 */
export class Highlight extends Behaviour implements IPointerEventHandler {

    /** The renderer to highlight. Found on this object automatically if left unassigned. */
    @serializable(Renderer)
    renderer?: Renderer;

    /** The `DragControls` that also triggers the highlight while dragging. Found on this object
     *  automatically if left unassigned; assign explicitly if it lives elsewhere, or leave both
     *  unset for a highlight that only reacts to hover. */
    @serializable(DragControls)
    dragControls?: DragControls;

    /** Emissive tint while fully highlighted. */
    @serializable(Color)
    highlightColor: Color = new Color(1, 1, 1);

    /** Emissive intensity while fully highlighted. */
    @serializable()
    highlightIntensity: number = 1;

    /** Seconds to fade the highlight in and out, so it doesn't hard-cut on and off. 0 switches it
     *  instantly. */
    @serializable()
    fadeSeconds: number = 0.1;

    private _block?: MaterialPropertyBlock<MeshStandardMaterial>;
    private _hovered: boolean = false;
    private _strength: number = 0;
    private _applied: boolean = false;

    onEnable(): void {
        this.renderer ??= this.gameObject.getComponent(Renderer) ?? undefined;
        this.dragControls ??= this.gameObject.getComponent(DragControls) ?? undefined;
        this._block = this.renderer
            ? MaterialPropertyBlock.get<MeshStandardMaterial>(this.renderer.gameObject)
            : undefined;
    }

    onDisable(): void {
        this._hovered = false;
        this._strength = 0;
        // Overrides outlive this behaviour otherwise - without this a disabled Highlight would leave
        // its renderer stuck glowing at whatever strength it was last at.
        this._block?.clearAllOverrides();
        this._applied = false;
    }

    onPointerEnter(_event: PointerEventData): void {
        this._hovered = true;
    }

    onPointerExit(_event: PointerEventData): void {
        this._hovered = false;
    }

    update(): void {
        const active = this._hovered || this.dragControls?.pointerState != null;
        const target = active ? 1 : 0;
        const step = this.fadeSeconds > 0 ? this.context.time.deltaTime / this.fadeSeconds : 1;
        this._strength = Mathf.moveTowards(this._strength, target, step);
        this.applyGlow();
    }

    private applyGlow(): void {
        const block = this._block;
        if (!block) return;
        if (this._strength <= 0) {
            // Cleared once on the way to 0, not every frame at 0 - clearing is not free and nothing
            // here changes again until the next hover or drag.
            if (this._applied) {
                block.clearAllOverrides();
                this._applied = false;
            }
            return;
        }
        block.setOverride("emissive", this.highlightColor);
        block.setOverride("emissiveIntensity", this._strength * this.highlightIntensity);
        this._applied = true;
    }
}
