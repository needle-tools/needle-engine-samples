using Needle.Engine;
using Needle.Engine.Utils;
using UnityEngine;

namespace Needle
{
    
    public class SampleInstaller : MonoBehaviour
    {
        // The package to install
        [Header("Npm")]
        public string PackageName;
        public string PackageVersion;

        // The scene guid to open
        [Header("Unity Package")]
        public string SceneGuid;
    }
}
