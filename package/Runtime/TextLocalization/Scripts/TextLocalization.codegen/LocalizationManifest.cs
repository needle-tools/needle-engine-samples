// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class LocalizationManifest : UnityEngine.MonoBehaviour
	{
		public Needle.Typescript.GeneratedComponents.LocalizationManifestEntry[] @entries;
		public string @defaultLanguage = "eng";
		public void start(){}
		public void getKey(string @key){}
	}
}

// NEEDLE_CODEGEN_END

namespace Needle.Typescript.GeneratedComponents
{
    [System.Serializable]
    public class LocalizedEntry
    {
        public string key = "";
        [UnityEngine.TextArea] public string value = "";
    }

    [System.Serializable]
    public class LocalizationManifestEntry
    {
        public string key = "";
        public LocalizedEntry[] value = new LocalizedEntry[0];
    }
}