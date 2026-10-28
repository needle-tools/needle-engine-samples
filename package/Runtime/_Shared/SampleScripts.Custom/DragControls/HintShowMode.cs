// Hand-written - NOT auto-generated.
//
// The component compiler generates the HintBubble partial class in
// SampleScripts.codegen/HintBubble.cs (from SampleScripts~/DragControls/HintBubble.ts) with a field
// of this type, showWhen, but it does not emit enum declarations from TypeScript enums - only class
// members. So the enum itself has to exist on the C# side by hand, same rationale as HandleDisplay.cs.
//
// Keep names and values identical to HintShowMode in HintBubble.ts.
namespace Needle.Typescript.GeneratedComponents
{
	public enum HintShowMode
	{
		/// <summary>Until the hint has been used, see hideAfterDrag.</summary>
		Always = 0,
		/// <summary>Only while the user drags something the DragTarget on this object accepts.</summary>
		WhileDraggingAccepted = 1,
		/// <summary>Only while a dragged object hovers one of the DragTarget's slots. Hints of this kind with the same text go away together once one is used.</summary>
		WhileHovering = 2,
	}
}
