using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[RequireComponent(typeof(TextMesh))]
public class TextGeometry : MonoBehaviour
{
    public string text => textMesh.text;

    [Header("Geometry")] 
    public int curveSegments = 4;
    public float size => (textMesh.fontSize == 0 ? 16 : textMesh.fontSize) * textMesh.characterSize * 0.01f;
    public Color fontColor => textMesh.color;
    public float lineSpacing => textMesh.lineSpacing;
    public float characterSpacing = 1.0f;

    [Header("Extrude")]
    public bool extrudeEnabled = true;
    public float extrudeHeight = 0.1f;
    
    [Header("Bevel")]
    public bool bevelEnabled = true;
    public float bevelThickness = 0.005f;
    public float bevelSize = 0.004f;
    
    private TextMesh textMesh;
    
    private void OnValidate()
    {
        textMesh = GetComponent<TextMesh>();
    }
    
    private void OnDrawGizmos()
    {
        Gizmos.matrix = transform.localToWorldMatrix;
        Gizmos.DrawLine(Vector3.zero, Vector3.forward * extrudeHeight);
    }
    
    // generated
	public void awake(){}
	public void loadFont(){}
	public void createGeometryText(){}
	public void refreshText(){}
}
