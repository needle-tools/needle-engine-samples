// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class Gun : UnityEngine.MonoBehaviour
	{
		public UnityEngine.AudioSource @fireSound;
		public UnityEngine.ParticleSystem @muzzleFlash;
		public UnityEngine.ParticleSystem @ejectShell;
		public UnityEngine.ParticleSystem @impactEffect;
		public float @impactOffset = 0.3f;
		public float @fireRate = 0.1f;
		public UnityEngine.GameObject @raycastReference;
		public UnityEngine.Animator @gunAnimator;
		public string @fireAnimation = "Fire";
		public UnityEngine.Events.UnityEvent @onHitTarget;
		public UnityEngine.Events.UnityEvent @onMiss;
		public void fireWithMiss(){}
		public void fireIgnoreMiss(){}
		public void fire(bool @applyFireRate, bool @ignoreMiss){}
		public void fireVisually(UnityEngine.Vector3 @hitPoint){}
		public void firePhysically(bool @ignoreMiss){}
	}
}

// NEEDLE_CODEGEN_END