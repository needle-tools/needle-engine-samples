using System;
using System.Collections.Generic;
using System.Linq;
using Needle.MultiLightmaps;
using UnityEngine;

namespace Needle.Typescript.GeneratedComponents
{
	public partial class LightmapConfigurations : IMultiLightmapScript
	{
		[Header("Synced to Runtime")] public List<LightmapSettings> settings = new List<LightmapSettings>();

		public void OnBakedLightmap(LightmapBaker baker, Texture2D res, int index, int length)
		{
			if (this.lightmaps.Count != length)
			{
				this.lightmaps = new List<Texture2D>();
				for (var i = 0; i < length; i++) 
					this.lightmaps.Add(null);
			}
			this.lightmaps[index] = res;

			settings.Clear();
			foreach (var config in baker.Configurations)
			{
				var setting = new LightmapSettings();
				settings.Add(setting);
				setting.Emissive ??= new List<Renderer>();
				setting.Emissive.AddRange(config.Emissive);
			}
		}

		[Serializable]
		public class LightmapSettings
		{
			public List<Renderer> Emissive;
		}
	}
}

// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class LightmapConfigurations : UnityEngine.MonoBehaviour
	{
		public List<UnityEngine.Texture2D> @lightmaps;

		public void onEnable()
		{
		}

		public void switchLightmaps()
		{
		}

		public void disableRendererEmission(UnityEngine.Renderer @renderer)
		{
		}
	}
}

// NEEDLE_CODEGEN_END