#if UNITY_EDITOR

using System;
using UnityEditor;
using UnityEngine;

namespace Needle.Typescript.GeneratedComponents
{
    [CustomEditor(typeof(Hotspot)), CanEditMultipleObjects]
    public class HotspotEditor : Editor
    {
        SerializedProperty titleProperty;
        SerializedProperty contentProperty;
        SerializedProperty viewAngleProperty;

        private void OnEnable()
        {
            titleProperty = serializedObject.FindProperty("titleText");
            contentProperty = serializedObject.FindProperty("contentText");
            viewAngleProperty = serializedObject.FindProperty("viewAngle");
        }

        public override void OnInspectorGUI()
        {
            serializedObject.Update();

            EditorGUILayout.PropertyField(titleProperty);
            EditorGUILayout.PropertyField(contentProperty);
            EditorGUILayout.Slider(viewAngleProperty, 0, 180);

            serializedObject.ApplyModifiedProperties();
        }

        private const float GizmosConeLength = 5;
        private const int GizmosConeSegments = 50;
        private Hotspot hotspot => target as Hotspot;
        private Transform transform => hotspot.transform;

        private void OnSceneGUI()
        {
            Handles.color = Color.blue;
            Handles.DrawDottedLine(transform.position, transform.position + transform.forward * 2, 5);

            DrawCone(transform, Color.red, hotspot.viewAngle);
        }

        private void DrawCone(Transform transform, Color color, float angle, int segments = GizmosConeSegments)
        {
            DrawCone(transform.position, transform.forward, transform.up, color, angle, segments);
        }
        
        private void DrawCone(Vector3 origin, Vector3 fwd, Vector3 up, Color color, float angle, int segments = GizmosConeSegments)
        {
            //Circle
            Handles.color = color;
            Draw((a, b) => Handles.DrawLine(a, b), origin, fwd, up, angle, segments);

            //Cone
            Handles.color = color * .4f;
            Draw((a, b) => Handles.DrawLine(origin, a), origin, fwd, up, angle, segments);
        }

        private void Draw(Action<Vector3, Vector3> drawElement, Vector3 origin, Vector3 direction, Vector3 up, float angle, int segments)
        {
            angle = Mathf.Clamp(angle, 0, 180);
            var angledDir = Quaternion.AngleAxis(angle, up) * direction;

            Vector3 CalculatePoint(int index)
            {
                return origin + (Quaternion.AngleAxis((360f / segments) * index, direction) * angledDir) * GizmosConeLength;
            }

            for (var i = 0; i < segments; i++)
                drawElement(CalculatePoint(i), CalculatePoint(i + 1));
        }
    }
}

#endif