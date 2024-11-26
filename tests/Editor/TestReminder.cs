using System.Threading.Tasks;
using UnityEditor;
using UnityEditor.TestTools.TestRunner;

namespace Needle.Tests
{
	public static class TestReminder
	{
		// [InitializeOnLoadMethod]
		private static async void Init()
		{
			var recompileCount = SessionState.GetInt("Needle.Tests.RecompileCount", 0);
			SessionState.SetInt("Needle.Tests.RecompileCount", ++recompileCount);
			if (recompileCount % 10 == 0)
			{
				while (EditorApplication.isUpdating || EditorApplication.isCompiling) await Task.Delay(1000);
				ShowTestReminder(recompileCount); 
			}
		}

		private static void ShowTestReminder(int recompileCount)
		{
			var msg = "Hey there 🌵,\nthis is your friendly reminder to run tests from time to time... thank youuuu";
			if (recompileCount > 20)
			{
				msg += "\n\nBtw wow you seem really busy today... I hope it's working well 🤘";
			}
			var dec = EditorUtility.DisplayDialog("Test Reminder",msg,
				"Open TestRunner ❤", "I hear you - but I don't care 🔥");
			if (dec)
			{
				var window = EditorWindow.GetWindow<TestRunnerWindow>();
				if(!window) window = EditorWindow.CreateWindow<TestRunnerWindow>();
				window.Show();
			}
		}
	}
}