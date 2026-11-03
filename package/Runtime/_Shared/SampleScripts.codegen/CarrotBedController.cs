// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class CarrotBedController : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("The DragTarget whose slots seeds are planted in.")]
		public Needle.Engine.Components.DragTarget @bed;
		[UnityEngine.Tooltip("Pressing on this object, or anything below it, spawns a seed and starts dragging it. This component must be on this object or one of its parents to receive the press.")]
		public UnityEngine.Transform @seedPouch;
		[UnityEngine.Tooltip("The seed that gets cloned. Hidden at start. Gets a DragControls if it has none, so add one yourself to tune how seeds are dragged.")]
		public UnityEngine.Transform @seedTemplate;
		[UnityEngine.Tooltip("What a planted seed grows into, in order - for example the sprout, then the carrot. Hidden at start. Each stage is placed at the slot by its own origin. The DragControls of the last stage is what harvesting uses; one is added if it has none.")]
		public UnityEngine.Transform[] @stages;
		[UnityEngine.Tooltip("Seconds a planted seed waits before the first stage appears.")]
		public float @germinationTime = 1.5f;
		[UnityEngine.Tooltip("Seconds each stage takes to grow from its start scale to full size.")]
		public float @stageDuration = 8f;
		[UnityEngine.Tooltip("Size each stage appears at, as a fraction of its template's size.")]
		public float @startScale = 0.25f;
		[UnityEngine.Tooltip("Raised when a seed is dropped into a free slot.")]
		public UnityEngine.Events.UnityEvent @planted = new UnityEngine.Events.UnityEvent();
		[UnityEngine.Tooltip("Raised when a plant reaches the end of its last stage and can be harvested.")]
		public UnityEngine.Events.UnityEvent @ripened = new UnityEngine.Events.UnityEvent();
		[UnityEngine.Tooltip("Raised when a ripe plant is pulled out of the bed and its slot is free again.")]
		public UnityEngine.Events.UnityEvent @harvested = new UnityEngine.Events.UnityEvent();
		public void Awake() {}
		public void OnEnable() {}
		public void OnDisable() {}
		public void OnDestroy() {}
		public void onPointerDown(UnityEngine.EventSystems.PointerEventData @args) {}
		public void onPointerUp(UnityEngine.EventSystems.PointerEventData @args) {}
		public void Update() {}
	}
}

// NEEDLE_CODEGEN_END