using System;
using System.Collections.Generic;
using Needle.Engine.Utils;
using UnityEngine;

namespace Needle.MultiLightmaps
{
	public class LightmapBaker : MonoBehaviour
	{
		private static readonly int[] emissionColorProperties = new int[]
		{
			Shader.PropertyToID("_EmissiveColor"),
			Shader.PropertyToID("_EmissionColor"),
			Shader.PropertyToID("_Emission"),
			Shader.PropertyToID("emissiveFactor"),
		};
		
		[Serializable]
		public class LightmapConfiguration
		{
			public string Name;
			public Texture2D BakedLightmap;
			public List<GameObject> Objects;
			public List<Renderer> Emissive;

			public void Enable(IEnumerable<LightmapConfiguration> all)
			{
				var disabledEmissionBlock = new MaterialPropertyBlock();
				foreach (var config in all)
				{
					if (config == this) continue;
					foreach (var lt in config.Objects)
					{
						if (lt)
							lt.SetActive(false);
					}
					foreach (var rend in config.Emissive)
					{
						rend.GetPropertyBlock(disabledEmissionBlock);
						foreach(var id in emissionColorProperties)
							disabledEmissionBlock.SetColor(id, Color.black);
						rend.SetPropertyBlock(disabledEmissionBlock);
					}
				}
				foreach (var lt in Objects)
				{
					if (lt)
						lt.SetActive(true);
				}
				foreach (var rend in Emissive)
				{
					rend.SetPropertyBlock(null);
				}

				if (this.BakedLightmap)
				{
					var lightmaps = LightmapSettings.lightmaps;
					if (lightmaps.Length > 0)
					{
						lightmaps[0].lightmapColor = this.BakedLightmap;
					}
					LightmapSettings.lightmaps = lightmaps;
				}
			}
		}

		public List<LightmapConfiguration> Configurations;
#if UNITY_EDITOR
		private readonly LightmapBakingRunner runner = new LightmapBakingRunner();

		private int bakeId = 0;
		internal LightmapConfiguration currentlyBaking { get; private set; }

		[ContextMenu(nameof(Bake))]
		public async void Bake()
		{
			var id = ++bakeId;
			var list = new List<IMultiLightmapScript>();
			ObjectUtils.FindObjectsOfType(list);

			for (var index = 0; index < Configurations.Count; index++)
			{
				var config = Configurations[index];
				if (config == null) continue;
				config.Enable(Configurations);
				currentlyBaking = config;
				Debug.Log("Now baking <b>" + config.Name + "</b>");
				var tex = await runner.Bake(this, config.Name);
				tex.name = "Lightmap-" + config.Name;
				config.BakedLightmap = tex;
				currentlyBaking = null;	
				foreach (var el in list) el.OnBakedLightmap(this, tex, index, Configurations.Count);
				if (id != bakeId)
					return;
			}
			Debug.Log("<b>Finished baking</b>", this);
		}

		internal async void Bake(int index)
		{
			if (index >= this.Configurations.Count) return;
			var list = new List<IMultiLightmapScript>();
			ObjectUtils.FindObjectsOfType(list);
			var config = Configurations[index];
			if (config == null) return;
			config.Enable(Configurations);
			currentlyBaking = config;
			Debug.Log("Now baking <b>" + config.Name + "</b>");
			var tex = await runner.Bake(this, config.Name);
			config.BakedLightmap = tex;
			currentlyBaking = null;
			foreach (var el in list) el.OnBakedLightmap(this, tex, index, Configurations.Count);
		}

#endif
	}
}