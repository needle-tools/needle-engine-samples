// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class OvenPlateController : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("The oven's drop target, in mode with one slot per plate.")]
		public Needle.Engine.Components.DragTarget @plates;
		[UnityEngine.Tooltip("One handle per plate, same order as .")]
		public Needle.Engine.Components.DragControls[] @handles;
		[UnityEngine.Tooltip("One renderer per plate, same order as , whose material is made to glow.")]
		public UnityEngine.Renderer[] @plateRenderers;
		[UnityEngine.Tooltip("Where dishes are put to bake - the shelf or rack inside the oven. Everything this target holds bakes together, in every slot it has. Leave unset for a hob with no oven.")]
		public Needle.Engine.Components.DragTarget @ovenTarget;
		[UnityEngine.Tooltip("The Hinge Rotation handle that turns the oven on, read the same way as a plate handle.")]
		public Needle.Engine.Components.DragControls @ovenHandle;
		[UnityEngine.Tooltip("Raised once, the moment the oven itself crosses and starts baking. Not raised by a plate turning on - only the oven compartment.")]
		public UnityEngine.Events.UnityEvent @onOvenActive = new UnityEngine.Events.UnityEvent();
		[UnityEngine.Tooltip("Raised once, the moment the oven itself drops back below . Not raised by a plate turning off - only the oven compartment.")]
		public UnityEngine.Events.UnityEvent @onOvenInactive = new UnityEngine.Events.UnityEvent();
		[UnityEngine.Tooltip("Material of the lamp that is lit while any plate is on. Its emission is driven directly, so assign the material the lamp actually uses.")]
		public UnityEngine.Material @platesLightMaterial;
		[UnityEngine.Tooltip("Material of the dashboard lamp that is lit while the oven is baking. Its emission is driven directly, so assign the material the lamp actually uses.")]
		public UnityEngine.Material @ovenLightMaterial;
		[UnityEngine.Tooltip("Material of the lamp inside the oven cavity, lighting the food while it bakes - the same on/off switch as , just a second, separate material to drive. Optional; leave unset for an oven with no interior light.")]
		public UnityEngine.Material @ovenInteriorLightMaterial;
		[UnityEngine.Tooltip("Emissive tint of the hob's indicator lamp at full strength.")]
		public UnityEngine.Color @platesLightColor = new UnityEngine.Color(1f, 0.15f, 0.05f);
		[UnityEngine.Tooltip("Emissive tint of the oven's dashboard indicator lamp at full strength.")]
		public UnityEngine.Color @ovenLightColor = new UnityEngine.Color(1f, 0.45f, 0.05f);
		[UnityEngine.Tooltip("Emissive intensity of an indicator lamp while lit. 0 while off - there is nothing in between.")]
		public float @maxControlLightIntensity = 2f;
		[UnityEngine.Tooltip("HDR emissive colour of the oven's interior lamp while lit, black while off - there is nothing in between. An HDR colour rather than + : this one lights the inside of the cavity itself rather than a small dashboard lens, so it is set on as-is, with brightness baked into the colour instead of a shared intensity multiplier - pick components above 1 to push it brighter.")]
		public UnityEngine.Color @ovenInteriorLightColor = new UnityEngine.Color(3f, 1.4f, 0.3f);
		[UnityEngine.Tooltip("Handle position below this (0-1) counts as off: no glow, no cooking. Keeps a barely-nudged handle from lighting the plate up.")]
		public float @activeThreshold = 0.05f;
		[UnityEngine.Tooltip("Emissive tint at full strength. Faded towards black below that as the handle turns down.")]
		public UnityEngine.Color @glowColor = new UnityEngine.Color(1f, 0.35f, 0.05f);
		[UnityEngine.Tooltip("Emissive intensity at strength 1.")]
		public float @maxGlowIntensity = 4f;
		[UnityEngine.Tooltip("Seconds for a plate to go from cold to a handle's full strength once turned up.")]
		public float @glowRampSeconds = 1.5f;
		[UnityEngine.Tooltip("Seconds for a plate to fade back to cold once turned down again. Also how long it keeps cooking afterwards, at fading strength - residual heat, the way a real element behaves.")]
		public float @glowCooldownSeconds = 3f;
		public void OnEnable() {}
		public void Update() {}
		public void OnDisable() {}
		public float strengthAt(float @slot) { return default; }
	}
}

// NEEDLE_CODEGEN_END