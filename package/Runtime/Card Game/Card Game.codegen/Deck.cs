

using System;
using Needle.Engine;

[Serializable]
public class CardModel
{
	public ImageReference Image;
	public AssetReference Model;
}


// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class Deck : UnityEngine.MonoBehaviour
	{
		public UnityEngine.Transform @prefab;
		public Needle.Engine.ImageReference[] @textures = new Needle.Engine.ImageReference[]{ };
		public CardModel[] @cardModels = new CardModel[]{ };
		public UnityEngine.Transform @container;
		public void awake(){}
		public void update(){}
		public void createCard(){}
	}
}

// NEEDLE_CODEGEN_END
