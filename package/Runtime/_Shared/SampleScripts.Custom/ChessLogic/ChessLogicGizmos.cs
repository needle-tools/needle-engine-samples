using UnityEngine;
using Needle.Engine.Components;
#if UNITY_EDITOR
using UnityEditor;
#endif

namespace Needle.Typescript.GeneratedComponents
{
	// Hand-written companion to the codegen'd ChessLogic partial class in
	// SampleScripts.codegen/ChessLogic.cs (generated from SampleScripts~/ChessLogic.ts).
	//
	// It deliberately lives here, in SampleScripts.Custom, rather than in SampleScripts.codegen next
	// to the generated file: that folder is compiler-managed, and anything in it that isn't the
	// current output for a still-existing .ts source gets treated as stale and deleted - see
	// SampleScripts.Custom/DragControls/ObjectBoundAnchor.cs for the same rationale in more detail.
	// This file is never touched by codegen, so it is safe to edit directly.
	//
	// Purely an editor aid: tints each side's half of the board and highlights each color's two
	// home rows, using the same `whiteOnRowZero` convention as ChessLogic.ts, so the 32 piece
	// prefabs can be dragged onto the correct squares by eye instead of by trial and error.
	public partial class ChessLogic
	{
#if UNITY_EDITOR
		private static readonly Color WhiteSideTint = new Color(1f, 1f, 1f, 0.12f);
		private static readonly Color BlackSideTint = new Color(0f, 0f, 0f, 0.18f);
		private static readonly Color WhiteHomeRowColor = new Color(0.2f, 0.8f, 1f, 0.9f);
		private static readonly Color BlackHomeRowColor = new Color(1f, 0.35f, 0.2f, 0.9f);

		private void OnDrawGizmos()
		{
			var target = GetComponent<DragTarget>();
			if (target == null || target.mode != DragTargetMode.Grid) return;

			var cols = Mathf.Max(1, target.gridColumns);
			var rows = Mathf.Max(1, target.gridRows);
			var spacing = target.gridSpacing <= 0f ? 1f : target.gridSpacing;

			// Two home rows per side, nearest each edge - mirrors ChessLogic.ts's startRow()/
			// forwardDirection() so the gizmo always agrees with the runtime's own idea of sides.
			int whiteRowA, whiteRowB, blackRowA, blackRowB;
			if (whiteOnRowZero) { whiteRowA = 0; whiteRowB = 1; blackRowA = rows - 1; blackRowB = rows - 2; }
			else { blackRowA = 0; blackRowB = 1; whiteRowA = rows - 1; whiteRowB = rows - 2; }

			var matrix = Gizmos.matrix;
			Gizmos.matrix = transform.localToWorldMatrix;

			var half = rows / 2;
			DrawRowsTint(0, half - 1, cols, rows, spacing, whiteOnRowZero ? WhiteSideTint : BlackSideTint);
			DrawRowsTint(half, rows - 1, cols, rows, spacing, whiteOnRowZero ? BlackSideTint : WhiteSideTint);

			DrawRow(whiteRowA, cols, rows, spacing, WhiteHomeRowColor);
			DrawRow(whiteRowB, cols, rows, spacing, WhiteHomeRowColor);
			DrawRow(blackRowA, cols, rows, spacing, BlackHomeRowColor);
			DrawRow(blackRowB, cols, rows, spacing, BlackHomeRowColor);

			Gizmos.matrix = matrix;

			var edge = (cols - 1) * 0.5f * spacing + spacing;
			var whiteLabelRow = whiteOnRowZero ? 0 : rows - 1;
			var blackLabelRow = whiteOnRowZero ? rows - 1 : 0;
			Handles.Label(transform.TransformPoint(new Vector3(-edge, 0f, (whiteLabelRow - (rows - 1) * 0.5f) * spacing)), "White side");
			Handles.Label(transform.TransformPoint(new Vector3(-edge, 0f, (blackLabelRow - (rows - 1) * 0.5f) * spacing)), "Black side");
		}

		private static void DrawRowsTint(int fromRow, int toRow, int cols, int rows, float spacing, Color color)
		{
			if (toRow < fromRow) return;
			Gizmos.color = color;
			var width = cols * spacing;
			var depth = (toRow - fromRow + 1) * spacing;
			var centerRow = (fromRow + toRow) * 0.5f;
			var center = new Vector3(0f, 0f, (centerRow - (rows - 1) * 0.5f) * spacing);
			Gizmos.DrawCube(center, new Vector3(width, 0.01f, depth));
		}

		private static void DrawRow(int row, int cols, int rows, float spacing, Color color)
		{
			if (row < 0 || row >= rows) return;
			Gizmos.color = color;
			var size = new Vector3(spacing * 0.9f, 0.02f, spacing * 0.9f);
			for (var col = 0; col < cols; col++)
			{
				var pos = new Vector3((col - (cols - 1) * 0.5f) * spacing, 0.005f, (row - (rows - 1) * 0.5f) * spacing);
				Gizmos.DrawWireCube(pos, size);
			}
		}
#endif
	}
}
