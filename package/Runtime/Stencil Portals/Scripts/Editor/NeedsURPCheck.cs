using System;
using System.Runtime.CompilerServices;
using Needle.Engine.Core;
using UnityEditor;
using UnityEngine.Rendering;
using Object = UnityEngine.Object;

namespace Needle
{
	internal static class NeedsURPCheck
	{
		[InitializeOnLoadMethod]
		static void Init()
		{
			Builder.BuildStarting += () =>
			{
				var needsUrpComponent = Object.FindObjectOfType<NeedsURP>();
				if (needsUrpComponent)
				{
					if (!GraphicsSettings.currentRenderPipeline ||
					    GraphicsSettings.currentRenderPipeline.GetType().Name.Contains("Universal", StringComparison.InvariantCultureIgnoreCase) == false)
					{
						EditorGUIUtility.PingObject(needsUrpComponent);
						throw new Exception(
							"This scene requires the Universal Render Pipeline. Please switch to URP in Project Settings → Graphics\nIf you think this is a mistake you can remove the \"NeedsURP\" component from the scene");
					}
				}
			};
		}
	}
}