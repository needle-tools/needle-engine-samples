using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[Flags]
public enum PersonMode {
    none = 0,
    FirstPerson = 1,
    ThirdPerson = 2,
    All = FirstPerson | ThirdPerson,
}