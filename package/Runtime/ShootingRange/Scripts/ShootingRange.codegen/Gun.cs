// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class Gun : UnityEngine.MonoBehaviour
	{
		public Needle.Typescript.GeneratedComponents.GunEffects @effects;
		public Needle.Typescript.GeneratedComponents.GunStats @stats;
		public Needle.Typescript.GeneratedComponents.GunReferences @references;
		public Needle.Typescript.GeneratedComponents.GunAnimation @animation;
		public bool @vrHideControllers = true;
		public bool @vrHideHands = true;
		public bool @enableOnlyRightWeaponOnMobile = true;
		public bool @enableMobileInput = true;
		public bool @enableDesktopInput = true;
		public Needle.Typescript.GeneratedComponents.GunInputEnum @gunInput = 0f;
		public UnityEngine.Events.UnityEvent @onHitTarget;
		public UnityEngine.Events.UnityEvent @onMiss;
		public void awake(){}
		public void update(){}
		public void onBeforeRender(){}
		public void onVRChanged(bool @isVR){}
		public void OnEnable(){}
		public void OnDisable(){}
		public void fireManual(){}
		public void fire(bool @applyFireRate, bool @ignoreMiss){}
		public void fireVisually(UnityEngine.Vector3 @hitPoint){}
		public void firePhysically(bool @ignoreMiss){}
	}
}

// NEEDLE_CODEGEN_END