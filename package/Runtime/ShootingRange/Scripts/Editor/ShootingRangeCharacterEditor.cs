using Needle.Typescript.GeneratedComponents;
using System;
using System.Linq;
using UnityEditor;
using UnityEngine;

namespace Needle.Engine.Components.Experimental
{
    [CustomEditor(typeof(ShootingRangeCharacter), true)]
    public class ShootingRangeCharacterEditor : StandardCharacterEditor
    {
        private void OnEnable()
        {
            UpgradeModule(typeof(DesktopCharacterInput), typeof(DesktopShootingRangeControls));
            UpgradeModule(typeof(MobileCharacterInput), typeof(MobileShootingRangeControls));
        }
    }
}