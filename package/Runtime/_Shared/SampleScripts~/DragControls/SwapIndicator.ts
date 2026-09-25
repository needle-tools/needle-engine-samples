import {
    Behaviour, DragTarget, DragTargetEventArgs, getBoundingBox, getWorldPosition, serializable,
} from "@needle-tools/engine";
import { Box3, Color, Object3D, Sprite, SpriteMaterial, Texture, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

const _box = new Box3();
const _position = new Vector3();

/**
 * Shows a swap icon floating above the object currently sitting in a slot, for as long as a drag
 * is hovering that slot and letting go there would swap it out - see
 * {@link DragTarget.swapOnFullSlot}.
 *
 * Add this next to the {@link DragTarget} it should watch - found automatically on this same
 * object if left unassigned. Driven entirely by {@link DragTarget.targetEntered} and
 * {@link DragTarget.targetExited} rather than polling: a slot only becomes enterable while
 * occupied when a swap is actually on offer, so an occupant found on entry is already the whole
 * answer. A {@link DragTargetMode.Stacked} slot with room left in it is not a swap -
 * something would simply stack on top - so entries there are ignored until the stack is full,
 * which for a stack is the one case a further drop is refused outright rather than swapped.
 *
 * Assign the Swap icon from the shared Icons folder to {@link icon}, or your own art in its place.
 */

export class SwapIndicator extends Behaviour {

    /** The slot target to watch for occupied-slot hovers. Found on this object automatically if left unassigned. */
    @serializable(DragTarget)
    target?: DragTarget;

    /** The icon shown above an occupied slot while a drag is hovering it, offering a swap. */
    @serializable(Texture)
    icon: Texture | null = null;

    /** Icon size, in world units. */
    @serializable()
    size: number = 0.15;

    /** How far above the occupant it floats, in world units on top of its measured height. */
    @serializable()
    heightOffset: number = 0.05;

    /** Icon tint. Multiplies the assigned art, so white leaves it exactly as authored. */
    @serializable(Color)
    color: Color = new Color(1, 1, 1);

    /** How solid the icon is. */
    @serializable()
    opacity: number = 0.9;

    private _sprite: Sprite | null = null;
    private _occupant: Object3D | null = null;
    private _occupantTop: number = 0;
    private _unsubscribe: Function[] = [];

    onEnable(): void {
        this.target ??= this.gameObject.getComponent(DragTarget) ?? undefined;
        if (!this.target) {
            console.warn(`${this.name}: SwapIndicator requires a DragTarget on the same object`, this.gameObject);
            return;
        }
        this._sprite = this._createSprite();
        this.context.scene.add(this._sprite);
        this._unsubscribe.push(this.target.targetEntered.addEventListener(args => this._onEntered(args)));
        this._unsubscribe.push(this.target.targetExited.addEventListener(() => this._hide()));
    }

    onDisable(): void {
        for (const unsubscribe of this._unsubscribe) unsubscribe();
        this._unsubscribe.length = 0;
        this._sprite?.removeFromParent();
        this._sprite = null;
        this._occupant = null;
    }

    onDestroy(): void {
        this._sprite?.material.dispose();
    }

    update(): void {
        const sprite = this._sprite;
        const occupant = this._occupant;
        if (!sprite?.visible || !occupant) return;
        // The occupant leaving mid-hover - destroyed, or pulled out some other way - is the one
        // case targetExited cannot report, and nothing else here would notice it.
        if (!occupant.parent) {
            this._hide();
            return;
        }
        getWorldPosition(occupant, sprite.position);
        sprite.position.y += this._occupantTop + this.heightOffset;
    }

    private _onEntered(args: DragTargetEventArgs): void {
        const target = this.target!;
        const occupant = target.getOccupant(args.slot);
        if (!occupant) return;
        // A stack that still has room left is not being swapped - the drop would simply add to
        // it, so an occupant here is not the same question a single-occupancy slot asks.
        if (target.getSlotLoad(args.slot) < target.slotCapacity) return;

        this._occupant = occupant;
        getBoundingBox(occupant, undefined, undefined, _box);
        this._occupantTop = _box.isEmpty() ? 0 : _box.max.y - getWorldPosition(occupant, _position).y;
        this._show();
    }

    private _show(): void {
        const sprite = this._sprite;
        if (!sprite) return;
        const material = sprite.material as SpriteMaterial;
        material.map = this.icon;
        material.color.copy(this.color);
        material.opacity = this.opacity;
        material.needsUpdate = true;
        sprite.scale.set(this.size, this.size, 1);
        sprite.visible = true;
    }

    private _hide(): void {
        this._occupant = null;
        if (this._sprite) this._sprite.visible = false;
    }

    private _createSprite(): Sprite {
        const material = new SpriteMaterial({
            transparent: true,
            // Interface, not scenery: it belongs in front of whatever it is floating over.
            depthTest: false,
            depthWrite: false,
            toneMapped: false,
        });
        const sprite = new Sprite(material);
        sprite.visible = false;
        sprite.renderOrder = 10000;
        // Off the raycast layer, or the icon would sit under the pointer and shadow the very
        // object it is labelling.
        sprite.layers.set(2);
        sprite.name = "SwapIndicator.Icon";
        return sprite;
    }
}
