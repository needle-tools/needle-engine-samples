using System.Collections.Generic;
using UnityEngine;

namespace Needle.MultiLightmaps
{
	public interface IMultiLightmapScript
	{
		void OnBakedLightmap(LightmapBaker baker, Texture2D res, int index, int length);
	}
}