// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class GalleryUI : UnityEngine.MonoBehaviour
	{
		public Needle.Typescript.GeneratedComponents.GalleryUICategory[] @categories;
		[UnityEngine.Tooltip("Open categories with preview images in the preview view. A view the visitor picked in the menu is remembered and wins.")]
		public bool @startWithPreviews = false;
		[UnityEngine.Tooltip("Width of the menu in px while it shows previews. Narrowed to fit the page. 0 keeps the width of the list.")]
		public float @previewMenuWidth = 0f;
		[UnityEngine.Tooltip("Smallest width of a preview in px. The menu fits as many columns as its width allows, and the previews share the rest of the row.")]
		public float @previewMinWidth = 120f;
		[UnityEngine.Tooltip("Height of a preview image in px, cropped to fit. 0 keeps the 16:9 shape of rendered previews.")]
		public float @previewHeight = 0f;
		public void Awake() {}
		public void addNewCategory(Needle.Typescript.GeneratedComponents.GalleryUICategory @category) {}
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
        [UnityEngine.Tooltip("Image shown in the preview view of the menu. The view can only be picked in categories with at least one preview.")]
        public Engine.ImageReference @preview;

    }
}