// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class Gun : UnityEngine.MonoBehaviour
	{
		public bool @enableMobileInput = true;
		public bool @enableDesktopInput = true;
		public Needle.Engine.XRHandedness @vrSide;
		public float @fireRate = 0.1f;
		public UnityEngine.GameObject @raycastReference;
		public UnityEngine.Animator @gunAnimator;
		public string @fireAnimation = "Fire";
		public UnityEngine.AudioSource @fireSound;
		public UnityEngine.ParticleSystem @muzzleFlash;
		public UnityEngine.ParticleSystem @ejectShell;
		public UnityEngine.ParticleSystem @impactEffect;
		public void onUpdateXR(object @args){}
		public void OnEnable(){}
		public void OnDisable(){}
		public void fireWithMiss(){}
		public void fireIgnoreMiss(){}
		public void fire(bool @applyFireRate, bool @ignoreMiss){}
		public void fireVisually(UnityEngine.Vector3 @hitPoint){}
		public void firePhysically(bool @ignoreMiss){}
	}
}

// NEEDLE_CODEGEN_END