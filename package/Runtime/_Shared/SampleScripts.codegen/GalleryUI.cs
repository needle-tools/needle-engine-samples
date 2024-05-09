// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class GalleryUI : UnityEngine.MonoBehaviour
	{
		public Needle.Typescript.GeneratedComponents.GalleryUICategory[] @categories = new Needle.Typescript.GeneratedComponents.GalleryUICategory[]{ };
		public void awake(){}
		public void addNewCategory(Needle.Typescript.GeneratedComponents.GalleryUICategory @category){}
	}
}

// NEEDLE_CODEGEN_END

namespace Needle.Typescript.GeneratedComponents
{
	[System.Serializable]
    public class GalleryUICategory
    {
        public string @title = "Title";
        public Engine.FileReference @icon;
        public UnityEngine.Events.UnityEvent @select;
        public UnityEngine.Events.UnityEvent @deselect;
        public GalleryUIItem[] items;

    }
    [System.Serializable]
    public class GalleryUIItem
    {
        public string @name = "Name";
        public Engine.FileReference @icon;
        public UnityEngine.Events.UnityEvent @click;

    }
}