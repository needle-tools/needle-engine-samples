// Hand-written - NOT auto-generated.
//
// The component compiler generates the DragHandleVisualizer partial class in
// SampleScripts.codegen/DragHandleVisualizer.cs (from SampleScripts~/DragControls/DragHandleVisualizer.ts)
// with two fields of this type, showIcon and useCursor, but it does not emit enum declarations from
// TypeScript enums - only class members. So the enum itself has to exist on the C# side by hand,
// same rationale as SampleScripts.Custom/DragControls/JoystickAxis.cs.
//
// It deliberately lives here, in SampleScripts.Custom, rather than in SampleScripts.codegen: that
// folder is compiler-managed, and anything in it that isn't current generated output gets deleted as
// stale, hand-written or not. SampleScripts.Custom is never touched by codegen.
//
// Keep names and values identical to HandleDisplay in DragHandleVisualizer.ts.
namespace Needle.Typescript.GeneratedComponents
{
	public enum HandleDisplay
	{
		/// <summary>Decide from whatever is driving the pointer right now - cursor for a mouse, in-scene icon for XR and touch.</summary>
		Auto = 0,
		/// <summary>Always shown, whatever the input.</summary>
		Always = 1,
		/// <summary>Never shown.</summary>
		Never = 2,
	}
}
