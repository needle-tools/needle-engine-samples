// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class GalleryManager : UnityEngine.MonoBehaviour
	{
		public Needle.Typescript.GeneratedComponents.GalleryPOI[] @pois = new Needle.Typescript.GeneratedComponents.GalleryPOI[]{ };
		public Needle.Typescript.GeneratedComponents.GalleryUI @galleryUI;
		public string @categoryName = "";
		public Needle.Engine.FileReference @icon;
		public bool @arrowKeysNavigation = true;
		public void awake(){}
		public void poiFocused(Needle.Typescript.GeneratedComponents.GalleryPOI @poi){}
		public void focusNext(){}
		public void focusPrevious(){}
		public void update(){}
	}
}

// NEEDLE_CODEGEN_END


namespace Needle.Typescript.GeneratedComponents
{
	public partial class GalleryManager : UnityEngine.MonoBehaviour
	{
		// TODO: draw index lables
        private void OnDrawGizmosSelected()
        {
			if (pois.Length < 2) return;

			var offset = new UnityEngine.Vector3();
			var nextOffset = new UnityEngine.Vector3();
            for (int i = 0; i < pois.Length - 1; i++)
            {
                var a = pois[i];
				var b = pois[i + 1];
				var t = (i + 1f) / (pois.Length - 1f);

                var color = UnityEngine.Color.HSVToRGB(t, 1, 1);
				nextOffset.y = t;
				
                DrawLine(a.transform.position + offset, b.transform.position + nextOffset, color);
				offset = nextOffset;
            }

			// loop
			var first = pois[0];
			var last = pois[pois.Length - 1];
			DrawLine(first.transform.position, last.transform.position + offset, UnityEngine.Color.black);
        }
		private void DrawLine(UnityEngine.Vector3 a, UnityEngine.Vector3 b, UnityEngine.Color color)
		{
			UnityEngine.Gizmos.color = color;
            UnityEngine.Gizmos.DrawLine(a, b);
        }
    }
}
