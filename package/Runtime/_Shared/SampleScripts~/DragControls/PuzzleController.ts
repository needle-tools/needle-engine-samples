import { Behaviour, serializable, registerType, getParam } from "@needle-tools/engine";
import { DragTarget } from "@needle-tools/engine";

const debug = getParam("debugpuzzle");

@registerType
export class PuzzleController extends Behaviour {
	@serializable(DragTarget)
	dragTarget?: DragTarget;

	onEnable(): void {
		if (!this.dragTarget) return;

		// Hook into DragTarget's beforeDrop event to enforce puzzle matching rules.
		// Requires DragTargetMode.Slots, with the slot transforms assigned in `dragTarget.slots` -
		// that array is only populated in Slots mode, so this looks up the named slot object by
		// the index the event resolved rather than assuming a fixed slot count or order.
		this.dragTarget.beforeDrop.addEventListener((e: any) => {
			const slot = this.dragTarget?.slots?.[e.slot];
			const isValid = this.validatePuzzlePiece(e.object, slot);

			if (!isValid) {
				e.disallow();
			}
		});
	}

	private validatePuzzlePiece(draggedObject: any, slot: any): boolean {
		if (!draggedObject || !slot) return false;

		const draggedSuffix = this.extractSuffix(draggedObject.name);
		const slotSuffix = this.extractSuffix(slot.name);

		const isValid = draggedSuffix !== "" && draggedSuffix === slotSuffix;

		if (debug) {
			console.log(
				`[PuzzleController] Validation: "${draggedObject.name}" (${draggedSuffix}) → "${slot.name}" (${slotSuffix}) = ${isValid ? "✓ ALLOWED" : "✗ BLOCKED"}`
			);
		}

		return isValid;
	}

	private extractSuffix(name: string): string {
		// Extract the trailing 3-digit index, with or without a preceding dot - at runtime Needle
		// strips the "." from these names, even though the source asset has e.g. "PuzzleTile.006".
		const match = name.match(/\.?(\d{3})$/);
		const suffix = match ? match[1] : "";

		if (debug) {
			console.log(`[PuzzleController] extractSuffix: "${name}" → "${suffix}"`);
		}

		return suffix;
	}
}
