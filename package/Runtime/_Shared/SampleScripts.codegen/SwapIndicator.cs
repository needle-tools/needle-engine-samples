// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class SwapIndicator : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("The slot target to watch for occupied-slot hovers. Found on this object automatically if left unassigned.")]
		public Needle.Engine.Components.DragTarget @target;
		[UnityEngine.Tooltip("The icon shown above an occupied slot while a drag is hovering it, offering a swap.")]
		public UnityEngine.Texture @icon;
		[UnityEngine.Tooltip("Icon size, in world units.")]
		public float @size = 0.15f;
		[UnityEngine.Tooltip("How far above the occupant it floats, in world units on top of its measured height.")]
		public float @heightOffset = 0.05f;
		[UnityEngine.Tooltip("Icon tint. Multiplies the assigned art, so white leaves it exactly as authored.")]
		public UnityEngine.Color @color = new UnityEngine.Color(1f, 1f, 1f);
		[UnityEngine.Tooltip("How solid the icon is.")]
		public float @opacity = 0.9f;
		public void OnEnable() {}
		public void OnDisable() {}
		public void OnDestroy() {}
		public void Update() {}
	}
}

// NEEDLE_CODEGEN_END