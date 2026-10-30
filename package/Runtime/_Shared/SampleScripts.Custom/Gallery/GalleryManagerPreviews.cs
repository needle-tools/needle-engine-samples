// Hand-written - NOT auto-generated.
//
// Settings for the Render POI Previews button of GalleryManagerEditor. They only matter in the
// editor; GalleryManager.ts does not read them. Drawn by GalleryManagerEditor next to the button.
namespace Needle.Typescript.GeneratedComponents
{
	public partial class GalleryManager
	{
		[UnityEngine.HideInInspector]
		[UnityEngine.Tooltip("Clear the preview images with Preview Background Color instead of the skybox of the camera.")]
		public bool previewSolidBackground = false;

		[UnityEngine.HideInInspector]
		[UnityEngine.Tooltip("Background of the preview images when Preview Solid Background is on.")]
		public UnityEngine.Color previewBackgroundColor = new UnityEngine.Color(0.93f, 0.93f, 0.92f, 1f);

		[UnityEngine.HideInInspector]
		[UnityEngine.Tooltip("Layers drawn in the preview images, combined with the culling mask of the camera. Put objects on an unticked layer to leave them out, like the walls and floor of a room.")]
		public UnityEngine.LayerMask previewLayers = ~0;
	}
}
