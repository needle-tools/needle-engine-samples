#if UNITY_EDITOR

using System;
using UnityEditor;
using UnityEngine;

namespace Needle.Typescript.GeneratedComponents
{
    [CustomEditor(typeof(Hotspot)), CanEditMultipleObjects]
    public class HotspotEditor : Editor
    {
        // ---- Inspector -----

        SerializedProperty titleProperty;
        SerializedProperty contentProperty;
        SerializedProperty viewAngleProperty;

        void OnEnable()
        {
            titleProperty = serializedObject.FindProperty("titleText");
            contentProperty = serializedObject.FindProperty("contentText");
            viewAngleProperty = serializedObject.FindProperty("viewAngle");
        }

        public override void OnInspectorGUI()
        {
            serializedObject.Update();

            titleProperty.stringValue = EditorGUILayout.TextField(titleProperty.stringValue);

            var oldState = EditorStyles.textField.wordWrap;
            EditorStyles.textField.wordWrap = true;
            contentProperty.stringValue = EditorGUILayout.TextArea(contentProperty.stringValue, GUILayout.Height(80));
            EditorStyles.textField.wordWrap = oldState;

            EditorGUILayout.LabelField("", GUI.skin.horizontalSlider);

            viewAngleProperty.floatValue = EditorGUILayout.Slider("View angle: ", viewAngleProperty.floatValue, 0, 180);

            serializedObject.ApplyModifiedProperties();
        }

        // ---- Scene -----

        const float GizmosConeLength = 5;
        const int GizmosConeSegments = 50;

        Hotspot hotspot => target as Hotspot;
        Transform transform => hotspot.transform;

        private void OnSceneGUI()
        {
            Handles.color = Color.blue;
            Handles.DrawDottedLine(transform.position, transform.position + transform.forward * 2, 5);

            DrawCone(transform, Color.red, hotspot.viewAngle);
        }

        void DrawCone(Transform transform, Color color, float angle, int segments = GizmosConeSegments) =>
            DrawCone(transform.position, transform.forward, transform.up, color, angle, segments);
        void DrawCone(Vector3 origin, Vector3 fwd, Vector3 up, Color color, float angle, int segments = GizmosConeSegments)
        {
            //Circle
            Handles.color = color;
            Draw((a, b) => Handles.DrawLine(a, b),
                 origin, fwd, up, angle, segments);

            //Cone
            Handles.color = color * .4f;
            Draw((a, b) => Handles.DrawLine(origin, a),
                 origin, fwd, up, angle, segments);
        }

        void Draw(Action<Vector3, Vector3> drawElement, Vector3 origin, Vector3 direction, Vector3 up, float angle, int segments)
        {
            angle = Mathf.Clamp(angle, 0, 180);

            var angledDir = Quaternion.AngleAxis(angle, up) * direction;

            Vector3 CalculatePoint(int index) => origin + (Quaternion.AngleAxis((360f / segments) * index, direction) * angledDir) * GizmosConeLength;

            for (int i = 0; i < segments; i++)
                drawElement(CalculatePoint(i), CalculatePoint(i + 1));
        }
    }
}

#endif