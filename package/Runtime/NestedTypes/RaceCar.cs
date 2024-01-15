using System;
using UnityEngine;

namespace Needle.Samples
{
    [Serializable]
    public class RaceCar
    {
        public string name;
        public GameObject model;
        public float speed;
        public string controls = "WASD";
    }
}
