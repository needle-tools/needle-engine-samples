#if UNITY_EDITOR

using System;
using UnityEditor;
using UnityEngine;

namespace Needle.Typescript.GeneratedComponents
{
    [CustomEditor(typeof(HotspotBehaviour)), CanEditMultipleObjects]
    public class HotspotEditor : Editor
    {
        private const float GizmosConeLength = 5;
        private const int GizmosConeSegments = 50;
        private HotspotBehaviour hotspot => target as HotspotBehaviour;
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
            var v = transform.lossyScale;
            var scale = Mathf.Max(v.x, v.y, v.z);

            //Circle
            Handles.color = color;
            Draw((a, b) => Handles.DrawLine(a, b), origin, fwd, up, angle, segments, scale);

            //Cone
            Handles.color = color * .4f;
            Draw((a, b) => Handles.DrawLine(origin, a), origin, fwd, up, angle, segments, scale);
        }

        private void Draw(Action<Vector3, Vector3> drawElement, Vector3 origin, Vector3 direction, Vector3 up, float angle, int segments, float scale)
        {
            angle = Mathf.Clamp(angle, 0, 180);
            var angledDir = Quaternion.AngleAxis(angle, up) * direction;

            Vector3 CalculatePoint(int index)
            {
                return origin + (Quaternion.AngleAxis((360f / segments) * index, direction) * angledDir) * GizmosConeLength * scale;
            }

            for (var i = 0; i < segments; i++)
                drawElement(CalculatePoint(i), CalculatePoint(i + 1));
        }
    }
}

#endif