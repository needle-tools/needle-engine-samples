
using System;
using Needle.CardGame;
using Needle.Engine;
using UnityEngine;

[Serializable]
public class CardModel
{
	public ImageReference Image;

	[FileReferenceType(typeof(GameObject), ".glb", ".prefab", ".gltf")]
	public FileReference Model;

	public Ability[] Abilities;
} 


// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class Deck : UnityEngine.MonoBehaviour
	{
		public float @minCards = 3f;
		public bool @isActive = false;
		public void onInitialize(object @cb){}
		public void createCard(string @model, string @cardImage){}
		public UnityEngine.Transform @prefab;
		public UnityEngine.RectTransform @container;
		[UnityEngine.SerializeField]
		private CardModel[] @cardModels = new CardModel[]{ };
		public void awake(){}
		public void start(){}
		public void activate(){}
		public void deactivate(){}
		public void update(){}
		public void initializeDeck(){}
		public void addToDeck(Needle.Typescript.GeneratedComponents.Card @card){}
		public void createCard(){}
		public void getModel(string @id){}
	}
}

// NEEDLE_CODEGEN_END