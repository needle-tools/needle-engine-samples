using UnityEditor;
using UnityEditor.TestTools.TestRunner;

namespace Needle.Tests
{
	public static class TestReminder
	{
		[InitializeOnLoadMethod]
		private static void Init()
		{
			var recompileCount = SessionState.GetInt("Needle.Tests.RecompileCount", 0);
			SessionState.SetInt("Needle.Tests.RecompileCount", ++recompileCount);
			if (recompileCount % 10 == 0)    
			{
				ShowTestReminder(); 
			}
		}

		private static void ShowTestReminder()
		{
			var dec = EditorUtility.DisplayDialog("Test Reminder",
				"Hi,\nthis is a friendly reminder to run tests from time to time...",
				"Open TestRunner");
			if (dec)
			{
				var window = EditorWindow.GetWindow<TestRunnerWindow>();
				if(!window) window = EditorWindow.CreateWindow<TestRunnerWindow>();
				window.Show();
			}
		}
	}
}