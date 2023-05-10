

using System;
using Needle.Engine;
using UnityEngine;

[Serializable]
public class CardModel
{
	public ImageReference Image;
	[FileReferenceType(typeof(GameObject), ".glb", ".prefab", ".gltf")]
	public FileReference Model;
}


// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class Deck : UnityEngine.MonoBehaviour
	{
		public void onInitialize(object @cb){}
		public void createCard(string @model, string @cardImage){}
		public UnityEngine.Transform @prefab;
		public UnityEngine.Transform @container;
		public void awake(){}
		public void start(){}
		public void update(){}
		public void createCard(){}
	}
}

// NEEDLE_CODEGEN_END
