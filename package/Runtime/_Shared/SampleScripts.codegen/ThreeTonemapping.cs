// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class ThreeTonemapping : UnityEngine.MonoBehaviour
	{
		public Needle.Typescript.GeneratedComponents.ThreeTonemappingMethod @method;
		public float @exposure = 1f;
		public void awake(){}
		public void update(){}
		public void toggle(){}
		public void set(Needle.Typescript.GeneratedComponents.ThreeTonemappingMethod @method, float @exposure){}
	}
}

// NEEDLE_CODEGEN_END


namespace Needle.Typescript.GeneratedComponents
{
    public enum ThreeTonemappingMethod
    {
        NoToneMapping = 0,
        LinearToneMapping = 1,
        ReinhardToneMapping = 2,
        CineonToneMapping = 3,
        ACESFilmicToneMapping = 4,
        CustomToneMapping = 5,
        AgXToneMapping = 6,
        NeutralToneMapping = 7
    }
}