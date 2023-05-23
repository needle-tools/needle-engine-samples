using Needle.Engine.Deployment;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(menuName = "Needle/Create Bulk FTP Deploy", fileName = "Bulk FTP Deploy")]
public class BulkFTPDeploy : ScriptableObject
{
    public Object[] SamplesToBuild;
}
