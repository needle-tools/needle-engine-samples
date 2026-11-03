// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class RecordPlayer : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("The DragTarget the record is dropped onto.")]
		public Needle.Engine.Components.DragTarget @platter;
		[UnityEngine.Tooltip("The object that spins. Defaults to the platter.")]
		public UnityEngine.Transform @spinner;
		[UnityEngine.Tooltip("The tonearm, turning about its local Y axis from where it rests at start. Its hinge range sets which way it can go.")]
		public UnityEngine.Transform @tonearm;
		[UnityEngine.Tooltip("The tonearm is on the record between this angle and maxPlayAngle, in degrees from its rest.")]
		public float @minPlayAngle = 14f;
		[UnityEngine.Tooltip("See minPlayAngle.")]
		public float @maxPlayAngle = 40f;
		[UnityEngine.Tooltip("The music.")]
		public UnityEngine.AudioSource @audioSource;
		[UnityEngine.Tooltip("Platter speed in turns per minute.")]
		public float @rpm = 33.3f;
		[UnityEngine.Tooltip("Seconds the platter takes to come up to speed, and to stop.")]
		public float @spinUpTime = 0.8f;
		public void Start() {}
		public void OnDisable() {}
		public void Update() {}
	}
}

// NEEDLE_CODEGEN_END