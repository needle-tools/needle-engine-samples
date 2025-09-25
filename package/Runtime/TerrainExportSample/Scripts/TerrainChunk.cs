using UnityEngine;

namespace Needle.Terrain
{

    public class TerrainChunk : MonoBehaviour
    {
        public Texture2D splatMap;

        public Texture2D[] baseMaps;

        public Texture2D[] normalMaps;

        public Vector2[] tiling;

        public Vector2[] offset;
    }
}
