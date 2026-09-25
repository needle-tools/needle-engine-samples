// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class DragTargetEventProcessing : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("Duplicate the dropped object and place the copy at {")]
		public bool @duplicateOnDrop = false;
		[UnityEngine.Tooltip("Where the duplicate is placed. Only used when {")]
		public UnityEngine.Transform @duplicateTarget;
		[UnityEngine.Tooltip("Move the dropped object to {")]
		public bool @setPositionOnDrop = false;
		[UnityEngine.Tooltip("Where the dropped object is moved to. Only used when {")]
		public UnityEngine.Transform @setPositionTarget;
		[UnityEngine.Tooltip("Reparent the dropped object under {")]
		public bool @reparentOnDrop = false;
		[UnityEngine.Tooltip("The new parent for the dropped object. Only used when {")]
		public UnityEngine.Transform @reparentTarget;
		[UnityEngine.Tooltip("Destroy the dropped object. Runs last, after any duplicate/move/reparent above.")]
		public bool @deleteOnDrop = false;
		[UnityEngine.Tooltip("Tags a dragged object is allowed to have to be accepted here. Empty means: any tag is fine. The dragged object must carry one of these tags (its , set via ).")]
		public string[] @allowedTags;
		public void OnEnable() {}
		public void OnDisable() {}
	}
}

// NEEDLE_CODEGEN_END