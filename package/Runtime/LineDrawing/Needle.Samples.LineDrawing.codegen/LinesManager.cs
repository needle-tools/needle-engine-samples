using UnityEngine;

// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class LinesManager : UnityEngine.MonoBehaviour
	{
		public Needle.Typescript.GeneratedComponents.BrushModel[] @brushes = new Needle.Typescript.GeneratedComponents.BrushModel[]{ };
		public void getBrush(string @name){}
		public void startLine(UnityEngine.GameObject @parent, string @brushName){}
		public void updateLine(object @handle, object @args){}
		public void endLine(object @handle, bool @send){}
		public void getLine(object @handle){}
		public void awake(){}
	}
}

// NEEDLE_CODEGEN_END

namespace Needle.Typescript.GeneratedComponents
{
	[System.Serializable]
	public class BrushModel
	{
		public string name = "brush-01";
		public float width = 1;
		public float opacity = 1;
		public Texture2D map;
		public Texture2D alphaMap;
		public Vector2 repeat = new Vector2(1, 1);
        public bool additive = false;
	}
	
	public partial class LinesManager
	{
		
	}
}