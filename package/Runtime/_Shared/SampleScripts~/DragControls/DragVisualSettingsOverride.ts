import { Behaviour, DragControls, DragVisualSettings, HandleDisplay, LimitAreaDisplay, serializable } from "@needle-tools/engine";
import { Color, Texture, Vector2 } from "three";

// Documentation → https://docs.needle.tools/scripting

//@dont-generate-component
// Hand-written C# counterpart in SampleScripts.Custom/DragControls/DragVisualSettingsOverride.cs,
// with a grouped inspector.
/**
 * Sets how every DragControls in the scene shows what it will do: handle icons, cursor, rim zones,
 * limit area outline, drop and swap icons and the blocker glow.
 *
 * Writes its values into DragControls.VisualSettings while enabled and puts the previous values
 * back when disabled. One per scene is enough; with several, the last one enabled wins.
 */
export class DragVisualSettingsOverride extends Behaviour {

    /** Show the handle visuals at all. */
    @serializable()
    showVisuals: boolean = true;

    /** Show the handle icon under the pointer. Auto: every input except a mouse. Hidden while the cursor shows the gesture. */
    @serializable()
    showIcon: HandleDisplay = HandleDisplay.Always;

    /** Set the mouse cursor to match the gesture. Auto: mouse only. */
    @serializable()
    useCursor: HandleDisplay = HandleDisplay.Auto;

    /** Keep showing the handle while a drag is running. */
    @serializable()
    showWhileDragging: boolean = true;

    /** Show the drop icon while a drag is over a DragTarget that would take the object. */
    @serializable()
    showDrop: boolean = true;

    /** Show the swap icon over the object a drop would swap out. */
    @serializable()
    showSwap: boolean = true;

    /** Show a timer ring in place of the drop icon while a DragTarget turns the dragged object on a timer (Auto Rotate). */
    @serializable()
    showAutoRotate: boolean = true;

    /** Icon size as a fraction of the shorter screen side, at least 720 pixels. */
    @serializable()
    iconSize: number = 0.05;

    /** Icon offset from the pointer as a fraction of the shorter screen side, X right and Y up. */
    @serializable(Vector2)
    screenOffset: Vector2 = new Vector2(0, 0);

    /** Icon tint; white leaves the art unchanged. */
    @serializable(Color)
    color: Color = new Color(0xffffff);

    /** Icon opacity. */
    @serializable()
    opacity: number = 1;

    /** Draw the edge and corner zones on hovered objects that rotate or scale from their rim. */
    @serializable()
    showRim: boolean = true;

    /** Rim color for the zones that rotate. */
    @serializable(Color)
    turnColor: Color = new Color(0xbffb4f);

    /** Rim color for the zones that resize. */
    @serializable(Color)
    resizeColor: Color = new Color(0xc8c0fe);

    /** Line width of the rim and the limit area outline as a fraction of the shorter screen side. */
    @serializable()
    rimWidth: number = 0.001;

    /** Emissive intensity of the rim and the limit area outline. Above 1 they glow with Bloom. */
    @serializable()
    rimIntensity: number = 0.8;

    /** Strength of the glow from the rim lines into the face. 0 turns it off. */
    @serializable()
    rimGlow: number = 0.4;

    /** Opacity of the dark edge around the rim and limit area lines. 0 turns it off. */
    @serializable()
    rimOutline: number = 0.5;

    /** When the limit area of a plane-mode DragControls is outlined. */
    @serializable()
    showLimitArea: LimitAreaDisplay = LimitAreaDisplay.WhileDragging;

    /** Outline colour of the limit area. */
    @serializable(Color)
    limitAreaColor: Color = new Color(0xffffff);

    /** Glow the object that holds a drag back. Needs Check For Collider on the DragControls. */
    @serializable()
    showBlocker: boolean = true;

    /** Emissive tint of the blocking object, and of the limit area sides the object touches. */
    @serializable(Color)
    blockerColor: Color = new Color(0xff0051);

    /** Emissive intensity of the blocking object. */
    @serializable()
    blockerIntensity: number = 1;

    /** Show the name of the blocking object in a label over the canvas. */
    @serializable()
    showBlockerLabel: boolean = false;

    /** Free movement. Empty uses the built-in icon. */
    @serializable(Texture)
    moveIcon: Texture | null = null;

    /** Movement along one axis, drawn along X. Empty uses the built-in icon. */
    @serializable(Texture)
    slideIcon: Texture | null = null;

    /** Rotation. Empty uses the built-in icon. */
    @serializable(Texture)
    turnIcon: Texture | null = null;

    /** Resizing, drawn pointing up and to the right. Empty uses the built-in icon. */
    @serializable(Texture)
    resizeIcon: Texture | null = null;

    /** Shown over the object a drop would swap out. Empty uses the built-in icon. */
    @serializable(Texture)
    swapIcon: Texture | null = null;

    /** Shown inside the timer ring while the object is turned on a timer. Empty uses the built-in icon. */
    @serializable(Texture)
    autoRotateIcon: Texture | null = null;

    /** Shown while a drag is over a DragTarget that would take the object. Empty uses the built-in icon. */
    @serializable(Texture)
    dropIcon: Texture | null = null;

    /** Shown while a drag cannot be let go where it is. Empty uses the built-in icon. */
    @serializable(Texture)
    forbiddenIcon: Texture | null = null;

    private _previous: DragVisualSettings | null = null;

    onEnable(): void {
        this._previous ??= DragControls.VisualSettings.clone();
        this._apply();
    }

    onDisable(): void {
        if (!this._previous) return;
        DragControls.VisualSettings.copy(this._previous);
        this._previous = null;
    }

    /** Called when a value changes in the editor while the scene runs. */
    onValidate(): void {
        if (this.enabled && this.activeAndEnabled) this._apply();
    }

    private _apply(): void {
        const target = DragControls.VisualSettings;
        target.enabled = this.showVisuals;
        target.showIcon = this.showIcon;
        target.useCursor = this.useCursor;
        target.showWhileDragging = this.showWhileDragging;
        target.showDrop = this.showDrop;
        target.showSwap = this.showSwap;
        target.showAutoRotate = this.showAutoRotate;
        target.iconSize = this.iconSize;
        target.screenOffset.copy(this.screenOffset);
        target.color.copy(this.color);
        target.opacity = this.opacity;
        target.showRim = this.showRim;
        target.turnColor.copy(this.turnColor);
        target.resizeColor.copy(this.resizeColor);
        target.rimWidth = this.rimWidth;
        target.rimIntensity = this.rimIntensity;
        target.rimGlow = this.rimGlow;
        target.rimOutline = this.rimOutline;
        target.showLimitArea = this.showLimitArea;
        target.limitAreaColor.copy(this.limitAreaColor);
        target.showBlocker = this.showBlocker;
        target.blockerColor.copy(this.blockerColor);
        target.blockerIntensity = this.blockerIntensity;
        target.showBlockerLabel = this.showBlockerLabel;
        target.moveIcon = this.moveIcon ?? null;
        target.slideIcon = this.slideIcon ?? null;
        target.turnIcon = this.turnIcon ?? null;
        target.resizeIcon = this.resizeIcon ?? null;
        target.swapIcon = this.swapIcon ?? null;
        target.autoRotateIcon = this.autoRotateIcon ?? null;
        target.dropIcon = this.dropIcon ?? null;
        target.forbiddenIcon = this.forbiddenIcon ?? null;
    }
}
