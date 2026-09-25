// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class ArrowStickTarget : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("Only objects on one of these layers are stuck. (Everything) accepts anything that hits it with a {")]
		public UnityEngine.LayerMask @layerMask = -1;
		[UnityEngine.Tooltip("Minimum impact speed, in m/s, required to stick. A gentle touch just bounces off instead.")]
		public float @minImpactSpeed = 0.5f;
		public bool @setKinematicOnStick = true;
		public void OnDisable() {}
		public void OnCollisionEnter(UnityEngine.Collision @col) {}
	}
}

// NEEDLE_CODEGEN_END