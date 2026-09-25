// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class ChessLogic : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("Whether grid row 0 is White's home side (row 7 = Black). Flip if the scene is authored the other way.")]
		public bool @whiteOnRowZero = true;
		[UnityEngine.Tooltip("Whose turn it currently is. Visible/settable in the inspector for testing.")]
		public string @currentTurn = "white";
		[UnityEngine.Tooltip("Size of a highlight quad, as a fraction of the grid's cell spacing (1 = fills a whole square).")]
		public float @highlightSize = 2f;
		[UnityEngine.Tooltip("Highlight color for an empty, legal destination square.")]
		public UnityEngine.Color @highlightMoveColor = new UnityEngine.Color(0.2f, 0.8f, 0.33f);
		[UnityEngine.Tooltip("Highlight color for a legal destination square that holds a capturable opponent piece.")]
		public UnityEngine.Color @highlightCaptureColor = new UnityEngine.Color(0.867f, 0.267f, 0.2f);
		[UnityEngine.Tooltip("Highlight color marking every piece belonging to whoever's turn it currently is.")]
		public UnityEngine.Color @activePieceColor = new UnityEngine.Color(1f, 0.85f, 0.2f);
		[UnityEngine.Tooltip("Optional UI Text kept updated with whose turn it is, e.g. White to move. Left unset, nothing happens.")]
		public UnityEngine.UI.Text @turnLabel;
		[UnityEngine.Tooltip("While true, chess rules and turn order are enforced. While false, any piece can be dropped on any square, freely — use setPlayModeActive() to toggle this from a UI event.")]
		public bool @playModeActive = true;
		public void OnEnable() {}
		public void OnDisable() {}
		public void setPlayModeActive(bool @active) {}
	}
}

// NEEDLE_CODEGEN_END