// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class EverywhereConfigurator : UnityEngine.MonoBehaviour
	{
		public Needle.Typescript.GeneratedComponents.EverywhereConfiguratorElement[] @elements = new Needle.Typescript.GeneratedComponents.EverywhereConfiguratorElement[]{ };
		public float @fadeDuration = 0.2f;
		public bool @selectFirstOnStart = true;
		public void awake(){}
		public void createBehaviours(object @ext, object @_model, object @_context){}
		public void beforeCreateDocument(object @_ext, object @_context){}
		public void afterCreateDocument(object @_ext, object @_context){}
	}
}

// NEEDLE_CODEGEN_END

namespace Needle.Typescript.GeneratedComponents
{
	[System.Serializable]
	public class EverywhereConfiguratorElement
	{
		public UnityEngine.Transform[] contents;
		public UnityEngine.Transform[] triggers;
	}
}