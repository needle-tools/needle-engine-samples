// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class CarPlayer : Needle.Engine.Components.Experimental.Player
	{
		public bool @autoSetupWheels = true;
		public UnityEngine.GameObject[] @wheelModels = new UnityEngine.GameObject[]{ };
		public UnityEngine.GameObject @wheelPrefab;
		public void awake(){}
		public void update(){}
	}
}

// NEEDLE_CODEGEN_END
#if UNITY_EDITOR
namespace Needle.Typescript.GeneratedComponents
{
    [UnityEditor.CustomEditor(typeof(CarPlayer), isFallback = true)]
    public class CarPlayerEditor : Needle.Engine.Components.Experimental.PlayerEditor
    {
        protected override (System.Type type, string description)[] mandatoryModules { get; set; } = {
            (typeof(CarPhysics), "Responsible for car physics simulation."),
        };
        protected override (System.Type type, string description)[] optionalModules { get; set; } = { };

        public override void OnInspectorGUI()
        {
            base.OnInspectorGUI();
            DrawAdvancedSettings();
        }
    }
}
#endif