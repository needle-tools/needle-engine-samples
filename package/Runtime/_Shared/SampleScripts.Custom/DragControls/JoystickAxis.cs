// Hand-written - NOT auto-generated.
//
// The component compiler generates the JoystickToPosition partial class in
// SampleScripts.codegen/JoystickToPosition.cs (from SampleScripts~/DragControls/JoystickToPosition.ts)
// referencing this enum by name, but it does not emit enum declarations from TypeScript enums - only
// class members. So the enum itself has to exist on the C# side by hand, same rationale as
// SampleScripts.Custom/DragControls/ObjectBoundAnchor.cs and SampleScripts.Custom/ChessLogic/ChessLogicGizmos.cs.
//
// It deliberately lives here, in SampleScripts.Custom, rather than in SampleScripts.codegen: that
// folder is compiler-managed, and anything in it that isn't current generated output gets deleted as
// stale, hand-written or not. SampleScripts.Custom is never touched by codegen.
//
// Keep names and values identical to JoystickAxis in JoystickToPosition.ts.
namespace Needle.Typescript.GeneratedComponents
{
	public enum JoystickAxis
	{
		X = 0,
		Y = 1,
		Z = 2,
	}
}
