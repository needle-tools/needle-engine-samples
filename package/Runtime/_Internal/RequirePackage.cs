using UnityEngine;
using System;
using System.Linq;
#if UNITY_EDITOR
using UnityEditor;
using PM = UnityEditor.PackageManager;
#endif

namespace Needle.Engine
{
    public class RequirePackage : MonoBehaviour
    {
        public string packageName;

        [ContextMenu("Add pacakge")]
        void AddPackage()
        {
#if UNITY_EDITOR
            PackageHelper.InstallPackage(packageName);
#endif
        }

        [ContextMenu("Remove pacakge")]
        void RemovePackage()
        {
#if UNITY_EDITOR
            PackageHelper.UninstallPackage(packageName);
#endif
        }
    }

#if UNITY_EDITOR

    [InitializeOnLoad]
    static class PackageHelper
    {
        public static string[] InstalledPackages = new string[0];

        static PM.Requests.Request currentRequest = null;
        static Action<PM.Requests.Request> handler = null;
        static PackageHelper()
        {
            EditorApplication.projectChanged += () => GetPackageList();
            EditorApplication.update += Update;
            GetPackageList();
        }

        public static bool IsProcessing => currentRequest != null && !currentRequest.IsCompleted;

        static void Update()
        {
            if (currentRequest != null && currentRequest.IsCompleted)
            {
                var req = currentRequest;
                currentRequest = null;

                handler?.Invoke(req);
                handler = null;
            }
        }

        static void ResolveRequest(Func<PM.Requests.Request> call, Func<PM.Requests.Request, bool> handle, int iteration = 0)
        {
            if (iteration > 2) return;
            if (IsProcessing) return;

            currentRequest = call();
            handler = (req) =>
            {
                if (req == null || req.Status != PM.StatusCode.Success || !handle(req))
                {
                    ResolveRequest(call, handle, ++iteration);
                }
            };
        }

        public static void GetPackageList(Action onCompleate = null, int iteration = 0)
        {
            ResolveRequest(
                call: () => PM.Client.List(false, true),
                handle: (req) =>
                {
                    var listReq = req as PM.Requests.ListRequest;
                    if (listReq == null) return false;

                    InstalledPackages = listReq.Result.Select(x => x.name).ToArray();
                    onCompleate?.Invoke();

                    return true;
                }
            );
        }

        public static void InstallPackage(string com, Action onCompleate = null, int iteration = 0)
        {
            ResolveRequest(
                call: () => PM.Client.Add(com),
                handle: (req) =>
                {
                    onCompleate?.Invoke();
                    return true;
                }
            );
        }

        public static void UninstallPackage(string com, Action onCompleate = null, int iteration = 0)
        {
            ResolveRequest(
                call: () => PM.Client.Remove(com),
                handle: (req) =>
                {
                    onCompleate?.Invoke();
                    return true;
                }
            );
        }
    }

    [CustomEditor(typeof(RequirePackage))]
    public class PackageRequiredEditor : Editor
    {
        bool? packageIsInstalled = null;

        string packageName => (target as RequirePackage)?.packageName ?? string.Empty;

        void OnEnable()
        {
            if (PackageHelper.InstalledPackages.Length == 0)
                PackageHelper.GetPackageList(decideInstallState);
            else
                decideInstallState();
        }

        void decideInstallState()
        {
            packageIsInstalled = PackageHelper.InstalledPackages.Contains(packageName);
        }

        public override void OnInspectorGUI()
        {
            if (PackageHelper.IsProcessing)
            {
                GUILayout.Label($"Processing...");
            }
            else if (packageIsInstalled == null)
            {
                GUILayout.Label($"Fetching...");
                decideInstallState();
            }
            else if (packageIsInstalled == true)
            {
                GUILayout.Label($"The package {packageName} is installed");
            }
            else if (packageIsInstalled == false)
            {
                GUILayout.Label($"This sample relies on {packageName}");

                if (GUILayout.Button("Install package"))
                {
                    PackageHelper.InstallPackage(packageName, () =>
                    {
                        PackageHelper.GetPackageList(decideInstallState);
                    });
                }
            }
        }
    }
#endif
}
