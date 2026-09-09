// Hand-written - NOT auto-generated.
//
// ObjectBoundAnchor.ts opts out of the component compiler with `//@dont-generate-component`
// (see https://engine.needle.tools/docs/explanation/core-concepts/component-compiler.html), so
// this file is never touched by codegen and is safe to edit directly. It still has to live in the
// `Needle.Typescript.GeneratedComponents` namespace under this exact class name - that is how the
// exporter matches this Unity-side authoring component to its TypeScript runtime counterpart and
// serializes the fields below onto it.
//
// It deliberately lives OUTSIDE SampleScripts.codegen (and outside SampleScripts~, which Unity's
// asset database ignores because of the trailing `~`): this file used to sit inside
// SampleScripts.codegen and the component compiler deleted it - the folder is compiler-managed and
// anything in it that doesn't correspond to a currently-generatable component gets treated as
// stale output, hand-written or not. SampleScripts.Custom is a plain, uncompiled-against folder
// the compiler never touches, for exactly this kind of file.

using System.Collections.Generic;
using UnityEngine;

#if UNITY_EDITOR
using System.Reflection;
using Needle.Engine;
using Needle.Engine.Gltf;
#endif

namespace Needle.Typescript.GeneratedComponents
{
	/// <summary>
	/// A side, edge or corner of an axis-aligned box - the Unity-side mirror of the TypeScript enum
	/// of the same name in ObjectBoundAnchor.ts. Names and underlying values must stay identical
	/// between the two: the runtime indexes its per-axis sign table by this value.
	/// </summary>
	public enum ObjectBoundAnchorPosition
	{
		Center = 0,
		PositiveX = 1,
		NegativeX = 2,
		PositiveY = 3,
		NegativeY = 4,
		PositiveZ = 5,
		NegativeZ = 6,
		PositiveXPositiveY = 7,
		PositiveXNegativeY = 8,
		NegativeXPositiveY = 9,
		NegativeXNegativeY = 10,
		PositiveYPositiveZ = 11,
		PositiveYNegativeZ = 12,
		NegativeYPositiveZ = 13,
		NegativeYNegativeZ = 14,
		PositiveXPositiveZ = 15,
		PositiveXNegativeZ = 16,
		NegativeXPositiveZ = 17,
		NegativeXNegativeZ = 18,
		PositiveXPositiveYPositiveZ = 19,
		PositiveXPositiveYNegativeZ = 20,
		PositiveXNegativeYPositiveZ = 21,
		PositiveXNegativeYNegativeZ = 22,
		NegativeXPositiveYPositiveZ = 23,
		NegativeXPositiveYNegativeZ = 24,
		NegativeXNegativeYPositiveZ = 25,
		NegativeXNegativeYNegativeZ = 26,
	}

	/// <summary>
	/// Keeps this object sitting on one side, edge or corner of another object's bounds - a face
	/// centre, an edge midpoint, or one of its 8 corners, picked with <see cref="anchor"/>.
	/// <para>
	/// Mirrors <c>ObjectBoundAnchor.ts</c> field for field. Bounds are measured once, from every
	/// <see cref="Renderer"/> under <see cref="target"/> (excluding this object's own subtree, so a
	/// handle authored as a child of its target doesn't skew the box it belongs to), and kept in
	/// <see cref="target"/>'s local space; every frame - and every editor repaint, via
	/// <see cref="ExecuteAlways"/> - only has to turn that cached point through <see cref="target"/>'s
	/// current transform, so a plain drag handle costs one transform per frame, not a walk of the
	/// target's renderers.
	/// </para>
	/// </summary>
	[ExecuteAlways]
	public class ObjectBoundAnchor : MonoBehaviour
	{
		[Tooltip("The object whose bounds this anchors to. Defaults to this object's parent.")]
		public Transform target;

		[Tooltip("Which side, edge or corner of the target's bounds to sit on.")]
		public ObjectBoundAnchorPosition anchor = ObjectBoundAnchorPosition.Center;

		[Tooltip("Pushes the anchor point outward along its own axes, in world units - a constant distance regardless of the target's scale, unlike the bounds themselves. 0 sits exactly on the bounds; a positive value clears the surface, which is normally what a drag handle wants so it doesn't sit flush inside the mesh it belongs to. Has no effect on Center, which has no axis to push along.")]
		public float margin = 0f;

		[Tooltip("Also take on the target's rotation, instead of keeping whatever rotation this object already has. Off by default - most handles (spheres, cubes) don't care, and a handle that should stay world-axis-aligned while the target spins needs this off.")]
		public bool matchRotation = false;

		[Tooltip("Recompute the target's local bounds every frame instead of once and caching the result. The cache is what keeps this cheap, and is correct as long as the target's geometry doesn't change shape after start - moving, rotating or scaling the target is handled by the cheap per-frame path regardless of this setting. Turn this on only for a target that deforms in place: a skinned mesh, morph targets, procedurally rebuilt geometry. Call Refresh() instead where the change is a one-off (a mesh swap, a resize triggered by code).")]
		public bool recomputeBoundsContinuously = false;

		/// <summary>Colour the wire box and anchor point gizmo are drawn in. Editor-only, not exported.</summary>
		public Color gizmoColor = new Color(0f, 1f, 1f, 1f);

		/// <summary><see cref="target"/>'s bounds, in its own local space. Valid once <see cref="Refresh"/> has run.</summary>
		private Bounds _localBounds;
		private bool _boundsValid;

		// Scratch buffer for the renderer walk - reused across calls, not per frame, since bounds are
		// normally computed once at start rather than every frame.
		private static readonly List<Renderer> _rendererBuffer = new List<Renderer>();

		private void OnEnable()
		{
			if (!target && transform.parent) target = transform.parent;
			if (!target)
			{
				Debug.LogWarning($"{name}: ObjectBoundAnchor has no target and no parent to fall back to", this);
				return;
			}
			Refresh();
		}

		private void Update()
		{
			if (!target) return;
			if (recomputeBoundsContinuously || !_boundsValid) ComputeLocalBounds();
			ApplyAnchor();
		}

		/// <summary>Recomputes the target's local bounds and immediately re-applies <see cref="anchor"/>.
		/// Call this after changing <see cref="target"/>, or after anything else that changes its
		/// shape while <see cref="recomputeBoundsContinuously"/> is off.</summary>
		public void Refresh()
		{
			ComputeLocalBounds();
			ApplyAnchor();
		}

		/// <summary>
		/// Measures every <see cref="Renderer"/> under <see cref="target"/> in world space (skipping
		/// this handle's own subtree so it can't skew the box it's meant to sit on), then turns that
		/// world-axis box into a box in <see cref="target"/>'s local space by transforming its 8
		/// corners through <see cref="Transform.InverseTransformPoint"/>.
		/// <para>
		/// That's a double axis-alignment - re-fitting an already axis-aligned box after rotating it -
		/// so a rotated target ends up with a local box a little larger than its true local bounds.
		/// Cheap and never optimistic, which is what a handle that only needs to sit at the
		/// *extremes* of the box actually cares about; the TypeScript side measures its bounds the
		/// same way, for the same reason.
		/// </para>
		/// </summary>
		private void ComputeLocalBounds()
		{
			if (!target) return;

			_rendererBuffer.Clear();
			target.GetComponentsInChildren(true, _rendererBuffer);

			var hasBounds = false;
			var worldBounds = new Bounds();
			foreach (var renderer in _rendererBuffer)
			{
				if (!renderer || !renderer.enabled) continue;
				// Exclude this handle's own renderers (and anything parented under it) so a handle
				// authored as a child of its target - the common case - never contributes to the box
				// it is being positioned against.
				if (renderer.transform == transform || renderer.transform.IsChildOf(transform)) continue;

				if (!hasBounds)
				{
					worldBounds = renderer.bounds;
					hasBounds = true;
				}
				else worldBounds.Encapsulate(renderer.bounds);
			}

			if (!hasBounds)
			{
				_localBounds = new Bounds(Vector3.zero, Vector3.zero);
				_boundsValid = true;
				return;
			}

			var localBounds = new Bounds(target.InverseTransformPoint(worldBounds.center), Vector3.zero);
			var min = worldBounds.min;
			var max = worldBounds.max;
			for (var i = 0; i < 8; i++)
			{
				var corner = new Vector3(
					(i & 1) != 0 ? max.x : min.x,
					(i & 2) != 0 ? max.y : min.y,
					(i & 4) != 0 ? max.z : min.z);
				localBounds.Encapsulate(target.InverseTransformPoint(corner));
			}
			_localBounds = localBounds;
			_boundsValid = true;
		}

		/// <summary>Turns the cached local bounds and <see cref="anchor"/> into a world position (and,
		/// with <see cref="matchRotation"/>, a world rotation) for this object.</summary>
		private void ApplyAnchor()
		{
			if (!target || !_boundsValid) return;

			var sign = AxisSign(anchor);
			var half = _localBounds.extents;
			var localPoint = _localBounds.center + new Vector3(
				sign.x * half.x,
				sign.y * half.y,
				sign.z * half.z);

			var worldPoint = target.TransformPoint(localPoint);

			// A constant world-space push, not a local one: applying it before TransformPoint above
			// would scale it right along with the bounds, so a handle on a 10x-scaled target would
			// clear the surface by 10x the authored margin. Rotation still applies - the push should
			// follow the face it's pushing off of - but scale deliberately does not.
			if (margin != 0f && sign != Vector3Int.zero)
			{
				var localDir = new Vector3(sign.x, sign.y, sign.z).normalized;
				var worldDir = (target.rotation * localDir).normalized;
				worldPoint += worldDir * margin;
			}

			transform.position = worldPoint;
			if (matchRotation) transform.rotation = target.rotation;
		}

		/// <summary>Per-axis sign (-1, 0 or 1) for an <see cref="ObjectBoundAnchorPosition"/>, in this
		/// object's own authoring space - i.e. before the export's coordinate flip. See
		/// <see cref="ObjectBoundAnchorValueResolver"/> for the other half of that story.</summary>
		internal static Vector3Int AxisSign(ObjectBoundAnchorPosition value)
		{
			switch (value)
			{
				case ObjectBoundAnchorPosition.Center: return new Vector3Int(0, 0, 0);
				case ObjectBoundAnchorPosition.PositiveX: return new Vector3Int(1, 0, 0);
				case ObjectBoundAnchorPosition.NegativeX: return new Vector3Int(-1, 0, 0);
				case ObjectBoundAnchorPosition.PositiveY: return new Vector3Int(0, 1, 0);
				case ObjectBoundAnchorPosition.NegativeY: return new Vector3Int(0, -1, 0);
				case ObjectBoundAnchorPosition.PositiveZ: return new Vector3Int(0, 0, 1);
				case ObjectBoundAnchorPosition.NegativeZ: return new Vector3Int(0, 0, -1);
				case ObjectBoundAnchorPosition.PositiveXPositiveY: return new Vector3Int(1, 1, 0);
				case ObjectBoundAnchorPosition.PositiveXNegativeY: return new Vector3Int(1, -1, 0);
				case ObjectBoundAnchorPosition.NegativeXPositiveY: return new Vector3Int(-1, 1, 0);
				case ObjectBoundAnchorPosition.NegativeXNegativeY: return new Vector3Int(-1, -1, 0);
				case ObjectBoundAnchorPosition.PositiveYPositiveZ: return new Vector3Int(0, 1, 1);
				case ObjectBoundAnchorPosition.PositiveYNegativeZ: return new Vector3Int(0, 1, -1);
				case ObjectBoundAnchorPosition.NegativeYPositiveZ: return new Vector3Int(0, -1, 1);
				case ObjectBoundAnchorPosition.NegativeYNegativeZ: return new Vector3Int(0, -1, -1);
				case ObjectBoundAnchorPosition.PositiveXPositiveZ: return new Vector3Int(1, 0, 1);
				case ObjectBoundAnchorPosition.PositiveXNegativeZ: return new Vector3Int(1, 0, -1);
				case ObjectBoundAnchorPosition.NegativeXPositiveZ: return new Vector3Int(-1, 0, 1);
				case ObjectBoundAnchorPosition.NegativeXNegativeZ: return new Vector3Int(-1, 0, -1);
				case ObjectBoundAnchorPosition.PositiveXPositiveYPositiveZ: return new Vector3Int(1, 1, 1);
				case ObjectBoundAnchorPosition.PositiveXPositiveYNegativeZ: return new Vector3Int(1, 1, -1);
				case ObjectBoundAnchorPosition.PositiveXNegativeYPositiveZ: return new Vector3Int(1, -1, 1);
				case ObjectBoundAnchorPosition.PositiveXNegativeYNegativeZ: return new Vector3Int(1, -1, -1);
				case ObjectBoundAnchorPosition.NegativeXPositiveYPositiveZ: return new Vector3Int(-1, 1, 1);
				case ObjectBoundAnchorPosition.NegativeXPositiveYNegativeZ: return new Vector3Int(-1, 1, -1);
				case ObjectBoundAnchorPosition.NegativeXNegativeYPositiveZ: return new Vector3Int(-1, -1, 1);
				case ObjectBoundAnchorPosition.NegativeXNegativeYNegativeZ: return new Vector3Int(-1, -1, -1);
				default: return new Vector3Int(0, 0, 0);
			}
		}

		private void OnDrawGizmosSelected()
		{
			if (!target || !_boundsValid) return;

			var previousMatrix = Gizmos.matrix;
			var previousColor = Gizmos.color;

			Gizmos.matrix = target.localToWorldMatrix;
			Gizmos.color = gizmoColor;
			Gizmos.DrawWireCube(_localBounds.center, _localBounds.size);

			Gizmos.matrix = previousMatrix;
			Gizmos.DrawSphere(transform.position, GizmoSphereSize());

			Gizmos.color = previousColor;
		}

		/// <summary>A small, roughly screen-size-independent radius for the anchor point sphere - a
		/// fixed size either disappears on a large object or swamps a small one.</summary>
		private float GizmoSphereSize()
		{
#if UNITY_EDITOR
			return UnityEditor.HandleUtility.GetHandleSize(transform.position) * 0.05f;
#else
			return 0.03f;
#endif
		}

#if UNITY_EDITOR
		/// <summary>
		/// Rewrites <see cref="anchor"/> from the coordinate system it was authored in (Unity, left-
		/// handed) into the one the exported glTF is in (right-handed) whenever it names an X side.
		/// <para>
		/// Everything else about this component survives the export on its own, because it is derived
		/// from <see cref="target"/> and <see cref="Component.transform"/>, and transforms are
		/// converted for us. <see cref="anchor"/> is not: it is a plain enum typed into an inspector,
		/// and a number carries no coordinate system with it.
		/// </para>
		/// <para>
		/// The export mirrors X - a position <c>(x, y, z)</c> becomes <c>(-x, y, z)</c> - so a value
		/// naming the target's <c>+X</c> face in the authored scene would, left untouched, still read
		/// as <c>+X</c> after export and end up on the mirrored (opposite) face of the exported mesh.
		/// This resolver swaps every X-positive name for its X-negative counterpart and back, and
		/// leaves every Y/Z-only name alone - the same rule Needle's own <c>DragControlsValueResolver</c>
		/// applies to <c>DragControls.axisMin</c> / <c>axisMax</c> for the same reason.
		/// </para>
		/// </summary>
		public class ObjectBoundAnchorValueResolver : GltfExtensionHandlerBase, IValueResolver
		{
			public override void OnBeforeExport(GltfExportContext context)
			{
				base.OnBeforeExport(context);
				context.RegisterValueResolver(this);
			}

			public bool TryGetValue(IExportContext ctx, object instance, MemberInfo member, ref object value)
			{
				if (!(instance is ObjectBoundAnchor)) return false;
				if (member.Name != nameof(ObjectBoundAnchor.anchor)) return false;
				if (!(value is ObjectBoundAnchorPosition position)) return false;

				value = MirrorX(position);
				return true;
			}

			private static ObjectBoundAnchorPosition MirrorX(ObjectBoundAnchorPosition value)
			{
				switch (value)
				{
					case ObjectBoundAnchorPosition.PositiveX: return ObjectBoundAnchorPosition.NegativeX;
					case ObjectBoundAnchorPosition.NegativeX: return ObjectBoundAnchorPosition.PositiveX;
					case ObjectBoundAnchorPosition.PositiveXPositiveY: return ObjectBoundAnchorPosition.NegativeXPositiveY;
					case ObjectBoundAnchorPosition.PositiveXNegativeY: return ObjectBoundAnchorPosition.NegativeXNegativeY;
					case ObjectBoundAnchorPosition.NegativeXPositiveY: return ObjectBoundAnchorPosition.PositiveXPositiveY;
					case ObjectBoundAnchorPosition.NegativeXNegativeY: return ObjectBoundAnchorPosition.PositiveXNegativeY;
					case ObjectBoundAnchorPosition.PositiveXPositiveZ: return ObjectBoundAnchorPosition.NegativeXPositiveZ;
					case ObjectBoundAnchorPosition.PositiveXNegativeZ: return ObjectBoundAnchorPosition.NegativeXNegativeZ;
					case ObjectBoundAnchorPosition.NegativeXPositiveZ: return ObjectBoundAnchorPosition.PositiveXPositiveZ;
					case ObjectBoundAnchorPosition.NegativeXNegativeZ: return ObjectBoundAnchorPosition.PositiveXNegativeZ;
					case ObjectBoundAnchorPosition.PositiveXPositiveYPositiveZ: return ObjectBoundAnchorPosition.NegativeXPositiveYPositiveZ;
					case ObjectBoundAnchorPosition.PositiveXPositiveYNegativeZ: return ObjectBoundAnchorPosition.NegativeXPositiveYNegativeZ;
					case ObjectBoundAnchorPosition.PositiveXNegativeYPositiveZ: return ObjectBoundAnchorPosition.NegativeXNegativeYPositiveZ;
					case ObjectBoundAnchorPosition.PositiveXNegativeYNegativeZ: return ObjectBoundAnchorPosition.NegativeXNegativeYNegativeZ;
					case ObjectBoundAnchorPosition.NegativeXPositiveYPositiveZ: return ObjectBoundAnchorPosition.PositiveXPositiveYPositiveZ;
					case ObjectBoundAnchorPosition.NegativeXPositiveYNegativeZ: return ObjectBoundAnchorPosition.PositiveXPositiveYNegativeZ;
					case ObjectBoundAnchorPosition.NegativeXNegativeYPositiveZ: return ObjectBoundAnchorPosition.PositiveXNegativeYPositiveZ;
					case ObjectBoundAnchorPosition.NegativeXNegativeYNegativeZ: return ObjectBoundAnchorPosition.PositiveXNegativeYNegativeZ;
					// Center and every Y/Z-only side or edge has no X component to mirror.
					default: return value;
				}
			}
		}
#endif
	}
}
