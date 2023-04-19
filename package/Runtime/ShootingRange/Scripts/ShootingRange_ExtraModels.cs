using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace Needle.Typescript.GeneratedComponents
{
    [Serializable]
    public class GunEffects
    {
        public AudioSource fireSound;
        public ParticleSystem muzzleFlash;
        public ParticleSystem ejectShell;
        public ParticleSystem impactEffect;
        public float impactOffset = 0.3f;
    }

    [Serializable]
    public class GunStats
    {
        public float fireRate = 0.1f;
    }

    [Serializable]
    public class GunReferences
    {
        public Transform raycastReference;
        public float scaleInVR = 0.1f;
    }

    [Serializable]
    public class GunAnimation
    {
        public Animator gunAnimator;
        public string fireAnimation = "Fire";
    }

    public enum GunInputEnum
    {
        Left = 0,
        Solo = 0,
        Right = 2,
    }
}
