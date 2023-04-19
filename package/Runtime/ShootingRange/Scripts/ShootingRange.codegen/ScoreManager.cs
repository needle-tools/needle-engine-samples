// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class ScoreManager : UnityEngine.MonoBehaviour
	{
		public float @hitRewards = 1f;
		public float @streakToMultiplier = 5f;
		public UnityEngine.UI.Text @scoreLabel;
		public UnityEngine.UI.Text @highscoreLabel;
		public UnityEngine.UI.Text @multiplierLabel;
		public Needle.Typescript.GeneratedComponents.TargetHitPointRenderer @hitPointRenderer;
		public void awake(){}
		public void resetStreak(){}
		public void incrementStreak(float @distance){}
		public void updateMultiplier(){}
		public void resetScore(){}
		public void update(){}
		public void updateLabel(){}
	}
}

// NEEDLE_CODEGEN_END


namespace Needle.Typescript.GeneratedComponents
{
	public partial class ScoreManager : UnityEngine.MonoBehaviour
	{
		// Originally by Marwie, adjusted by Kipash:
        // adding this manually here because otherwise the unity event can not call it with the generated arguments
        // and we just want to pass in the arguments dynamically from typescript code.
		// Used for the gun to report to the ScoreManager when it hits something
        public void onHitTarget() { }
    }
}