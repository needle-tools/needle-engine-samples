// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class CookingPot : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("The DragTarget vegetables are dropped into. Leave unset if this pot should be considered ready to cook even empty.")]
		public Needle.Engine.Components.DragTarget @ingredients;
		[UnityEngine.Tooltip("Seconds of heat at strength 1 needed to go from empty to fully cooked.")]
		public float @cookTimeSeconds = 6f;
		[UnityEngine.Tooltip("Raised once, the moment the pot locks in and actually starts cooking - not on every call, only when a fresh cook cycle begins.")]
		public UnityEngine.Events.UnityEvent @cookStarted = new UnityEngine.Events.UnityEvent();
		[UnityEngine.Tooltip("Raised once, the moment first reaches 1 - right before the vegetables are destroyed, dragging is re-enabled, and itself is put back to 0 so the pot is ready to cook again.")]
		public UnityEngine.Events.UnityEvent @cooked = new UnityEngine.Events.UnityEvent();
		[UnityEngine.Tooltip("Raised when the pot goes back to raw, to undo whatever switched on. That is either a cook being abandoned before it finished, or - after one that did finish - the moment the pot is next put to use, whichever comes first: fresh ingredients dropped in, or a new cook starting. Deliberately not raised the instant a cook finishes, since firing it in the same frame as would switch the finished state straight back off again. Named rather than - Unity treats as a reserved MonoBehaviour message (the editor-only callback fired when a component is added or reset from its context menu), so a generated component with a UnityEvent field literally called has that field's Inspector binding silently go nowhere at runtime.")]
		public UnityEngine.Events.UnityEvent @cookReset = new UnityEngine.Events.UnityEvent();
		public void OnEnable() {}
		public void OnDisable() {}
		public void addHeat(float @strength, float @deltaSeconds) {}
		public void Update() {}
		public void setCookProgress(float @value) {}
		public void clearFinishedCook() {}
		public void resetCooking() {}
	}
}

// NEEDLE_CODEGEN_END