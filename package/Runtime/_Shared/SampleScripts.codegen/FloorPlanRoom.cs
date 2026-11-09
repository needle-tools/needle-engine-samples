// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class FloorPlanRoom : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("Name on the room label.")]
		public string @roomName = "Room";
		[UnityEngine.Tooltip("Real metres per model metre. 10 means the model is built at 1:10.")]
		public float @planScale = 10f;
		[UnityEngine.Tooltip("Grid the room edges snap to on release, in model units. 0 turns snapping off.")]
		public float @snap = 0.05f;
		[UnityEngine.Tooltip("Wall height in model units.")]
		public float @wallHeight = 0.035f;
		[UnityEngine.Tooltip("Wall thickness in model units.")]
		public float @wallThickness = 0.012f;
		public UnityEngine.Color @wallColor = new UnityEngine.Color(0.89f, 0.87f, 0.83f);
		[UnityEngine.Tooltip("Height of one label line in model units. 0 hides the label.")]
		public float @labelSize = 0.04f;
		public void Awake() {}
		public void OnEnable() {}
		public void OnDisable() {}
		public void onBeforeRender() {}
		public UnityEngine.Vector3 footprint(UnityEngine.Vector3 @target) { return default; }
		public void snapToGrid() {}
	}
}

// NEEDLE_CODEGEN_END