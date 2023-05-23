using Needle.Engine;
using Needle.Engine.Core;
using Needle.Engine.Deployment;
using Needle.Engine.Utils;
using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Networking;

using Object = UnityEngine.Object;

[CustomEditor(typeof(BulkFTPDeploy))]
internal class BulkFTPDeployEditor : Editor
{
    bool stagingToggle
    {
        get => EditorPrefs.GetBool("BulkFTPDeploy_stagingToggle", false);
        set => EditorPrefs.SetBool("BulkFTPDeploy_stagingToggle", value);
    }
    static string search = "";
    static Vector2 scrollState = new Vector2();

    bool isDeployRunning
    {
        get => EditorPrefs.GetBool("BulkFTPDeploy_isRunning", false);
        set => EditorPrefs.SetBool("BulkFTPDeploy_isRunning", value);
    }

    public override void OnInspectorGUI()
    {
        var bulkDeploy = target as BulkFTPDeploy;
        if (!bulkDeploy)
            return;

        if (isDeployRunning && GUILayout.Button("ABORT"))
            isDeployRunning = false;

        serializedObject.Update();

        DrawLine(stagingToggle ? Color.red : Color.green);
        stagingToggle = EditorGUILayout.Toggle("Staging: ", stagingToggle);

        DrawLine(Color.black, thickness: 1);

        search = EditorGUILayout.TextField("Search: ", search);

        DrawLine(Color.gray, thickness: 3);

        scrollState = GUILayout.BeginScrollView(scrollState, GUILayout.MaxHeight(Screen.height - 300));


        foreach (var sample in bulkDeploy.SamplesToBuild)
        {
            var so = new SerializedObject(sample);

            var nameProp = so.FindProperty("DisplayName");
            if (nameProp == null)
                continue;
            var name = nameProp?.stringValue;
            var displayName = $"{name} ({sample.name})";

            var liveProp = so.FindProperty("LiveUrl");
            var url = liveProp?.stringValue;

            var searchTerm = search.Replace(" ", "").ToLower();
            var searchName = displayName.Replace(" ", "").ToLower();

            if (!string.IsNullOrEmpty(search) && !searchName.Contains(searchTerm))
                continue;

            using (new GUILayout.HorizontalScope())
            {
                GUILayout.Label(displayName, GUILayout.Width(300));

                if (GUILayout.Button("Open live"))
                {
                    if (stagingToggle)
                        url = url.Replace("/samples", "/samples/staging");

                    Debug.Log(url);
                    Application.OpenURL(url);
                }
                if (GUILayout.Button("Deploy"))
                {
                    DeployAll(bulkDeploy, new Object[] { sample });
                }
                if (GUILayout.Button("Open"))
                {
                    var scene = so.FindProperty("Scene")?.objectReferenceValue as SceneAsset;
                    if (scene)
                        EditorSceneManager.OpenScene(AssetDatabase.GetAssetPath(scene));
                }

                GUILayout.FlexibleSpace();
            }
        }

        GUILayout.EndScrollView();

        DrawLine(Color.gray);

        using (new GUILayout.HorizontalScope())
        {
            if (GUILayout.Button("Find all samples"))
                FindSamples(bulkDeploy, false);
            if (GUILayout.Button("Find valid samples"))
                FindSamples(bulkDeploy, true);
        }

        GUILayout.Space(20);

        if (bulkDeploy.SamplesToBuild.Length > 0 && GUILayout.Button("Deploy All"))
            DeployAll(bulkDeploy);


        serializedObject.ApplyModifiedProperties();
    }

    public static void DrawLine(Color color, int thickness = 2, int padding = 10)
    {
        Rect r = EditorGUILayout.GetControlRect(GUILayout.Height(padding + thickness));
        r.height = thickness;
        r.y += padding / 2;
        r.x -= 2;
        r.width += 6;
        EditorGUI.DrawRect(r, color);
    }

    void FindSamples(BulkFTPDeploy bulkDeploy, bool validOnly = true)
    {
        bulkDeploy.SamplesToBuild = AssetDatabase.FindAssets($"t:sampleinfo")
                                         .Select(AssetDatabase.GUIDToAssetPath)
                                         .Select(path => AssetDatabase.LoadAssetAtPath<Object>(path))
                                         .Where(x => x)
                                         .Where(x =>
                                         {
                                             var so = new SerializedObject(x);
                                             var sceneProp = so.FindProperty("Scene");
                                             var liveProp = so.FindProperty("LiveUrl");
                                             var imageProp = so.FindProperty("Thumbnail");

                                             if (validOnly && sceneProp != null && liveProp != null && imageProp != null)
                                             {
                                                 return sceneProp.objectReferenceValue != null &&
                                                        !string.IsNullOrWhiteSpace(liveProp.stringValue) &&
                                                        imageProp.objectReferenceValue != null;
                                             }
                                             else
                                                 return true;

                                         })
                                         .ToArray();

        serializedObject.Update();
    }

    async void DeployAll(BulkFTPDeploy bulkDeploy, Object[] samples = null)
    {
        isDeployRunning = true;

        if (samples == null)
            samples = bulkDeploy.SamplesToBuild;

        for (int i = 0; i < samples.Length && isDeployRunning; i++)
        {
            var sample = samples[i];
            if (sample == null)
            {
                Debug.LogError($"[FTP Bulk deploy] null sample at index {i}", bulkDeploy);
                continue;
            }

            await DeploySample(bulkDeploy, sample);
        }

        isDeployRunning = false;

        Debug.Log("[FTP Bulk deploy] Deploy finished!");
        await Task.Delay(0);

    }

    async Task DeploySample(BulkFTPDeploy bulkDeploy, Object sampleInfo)
    {
        Debug.Log($"[FTP Bulk deploy] Deploying... {sampleInfo.name}");

        var so = new SerializedObject(sampleInfo);

        var sceneProp = so.FindProperty("Scene");
        if (sceneProp == null)
            return;

        var scene = sceneProp.objectReferenceValue as SceneAsset;
        if (!scene)
        {
            Debug.LogError("[FTP Bulk deploy] No scene set", sampleInfo);
            return;
        }

        var s = EditorSceneManager.OpenScene(AssetDatabase.GetAssetPath(scene));
        EditorSceneManager.SetActiveScene(s);

        if (EditorSceneManager.GetActiveScene() != s)
            Debug.LogError("[FTP Bulk deploy] Scene is not loaded synchronously!");

        var projInfo = FindObjectOfType<ExportInfo>(true);
        if (!projInfo)
        {
            Debug.LogError($"[FTP Bulk deploy] Scene doesn't contain ExportInfo at {scene.name}", scene);
            return;
        }

        if (!isDeployRunning) return;

        Debug.Log("[FTP Bulk deploy] InstallCurrentProject...");
        var installProjectTask = await Actions.InstallCurrentProject();
        Debug.Log($"[FTP Bulk deploy] done installing project:  {(installProjectTask ? "Sucess" : "Fail")}");

        if (!isDeployRunning) return;

        Debug.Log("[FTP Bulk deploy] InstallPackage...");
        var installPackageTask = await Actions.InstallPackage(true, silent: true);
        Debug.Log($"[FTP Bulk deploy] done installing package:  {(installPackageTask ? "Sucess" : "Fail")}");

        if (!isDeployRunning) return;

        /*Debug.Log("[FTP Bulk deploy] ExportAndBuildProduction...");
        var buildTask = await Actions.ExportAndBuildProduction();
        Debug.Log($"[FTP Bulk deploy] done bulding prod! {(buildTask ? "Sucess" : "Fail")}");*/

        if (!projInfo.IsInstalled())
        {
            Debug.LogError($"[FTP Bulk deploy] Sample is not installed: {scene.name}", scene);
            return;
        }

        var deployToFTP = projInfo.GetComponent<DeployToFTP>();
        if (!deployToFTP)
        {
            Debug.LogError($"[FTP Bulk deploy] There's no DeployToFTP on ExportInfo at {scene.name}", scene);
            return;
        }

        if (stagingToggle)
            deployToFTP.Path = $"/staging/{deployToFTP.Path}";

        await FTPDeploy.Deploy(deployToFTP, projInfo, true);
    }
}

// Copied from DeployToFTPEditor
internal class FTPDeploy
{
    public static async Task Deploy(DeployToFTP ftp, IProjectInfo project, bool deployOnly)
    {
        UseGizp.Enabled = ftp.UseGzipCompression;

        ftp.Path = ftp.Path?.TrimStart('.');
        if (string.IsNullOrWhiteSpace(ftp.Path)) ftp.Path = "/";

        var server = ftp.FTPServer;
        string key = default;
        if (server)
            server.TryGetKey(out key);
        var password = SecretsHelper.GetSecret(key);

        var hasPassword = !string.IsNullOrWhiteSpace(password);

        if (!server || !hasPassword)
        {
            Debug.LogError($"[FTP Bulk deploy] FTP deploy failed! {ftp.gameObject.scene.name} - Server: {(server ? "valid" : "invalid")} || Has Pass: {hasPassword}");
            return;
        }

        await HandleUpload(ftp, project, server!.Servername, server.Username, password, deployOnly, false);
    }

    private static Task<bool> currentTask;
    private static CancellationTokenSource cancel;

    private static async Task HandleUpload(DeployToFTP ftp, IProjectInfo projectInfo, string server, string username, string password, bool runBuild, bool devBuild)
    {
        Debug.Log("Begin uploading...");
        var webUrl = server;
        if (webUrl.StartsWith("ftp.")) webUrl = webUrl.Substring(4);
        webUrl = "http://" + webUrl;
        var serverResponse = await WebHelper.MakeHeaderOnlyRequest(webUrl);
        if (serverResponse.responseCode == 404)
        {
            Debug.LogError("Server not found: " + webUrl);
            return;
        }
        if (serverResponse.result == UnityWebRequest.Result.ConnectionError)
        {
            Debug.LogError("Could not connect to " + webUrl);
            return;
        }

        cancel?.Cancel();
        if (currentTask != null && currentTask.IsCompleted == false) await currentTask;
        const int maxUploadDurationInMilliseconds = 10 * 60 * 1000;
        cancel = new CancellationTokenSource(maxUploadDurationInMilliseconds);

        var progId = Progress.Start("FTP Upload", "", Progress.Options.Managed);
        Progress.RegisterCancelCallback(progId, () =>
        {
            if (!cancel.IsCancellationRequested)
            {
                Debug.Log("Cancelling FTP upload...");
                cancel.Cancel();
            }
            return true;
        });

        BuildContext buildContext;
        if (runBuild) buildContext = BuildContext.Distribution(!devBuild);
        else buildContext = BuildContext.PrepareDeploy;

        if (ftp.FTPServer.RemoteUrlIsValid)
            buildContext.LiveUrl = ftp.FTPServer.RemoteUrl + "/" + ftp.Path;

        var distDirectory = projectInfo.ProjectDirectory + "/dist";
        var buildResult = false;
        var postBuildMessage = default(string);
        if (runBuild)
        {
            Progress.SetDescription(progId, "Export and Build");
            var dev = NeedleEngineBuildOptions.DevelopmentBuild;
            Debug.Log("<b>Begin building distribution</b>");
            currentTask = Actions.ExportAndBuild(buildContext);
            buildResult = await currentTask;
            postBuildMessage = "<b>Successfully built distribution</b>";
        }
        else
        {
            currentTask = Actions.ExportAndBuild(buildContext);
            buildResult = await currentTask;
        }

        if (cancel.IsCancellationRequested)
        {
            Debug.LogWarning("Upload cancelled");
            return;
        }
        if (!buildResult)
        {
            Debug.LogError("Build failed, aborting FTP upload - see console for errors");
            return;
        }
        if (postBuildMessage != null) Debug.Log(postBuildMessage);

        Debug.Log("<b>Begin uploading</b> " + distDirectory);
        Progress.SetDescription(progId, "Upload " + Path.GetDirectoryName(projectInfo.ProjectDirectory) + " to FTP");


        var serverName = SanitizeServerUrl(server.Trim());
        var opts = new DeployToFTPUtils.UploadContext(serverName, username, password, ftp.Path, progId);
        opts.CancellationToken = cancel.Token;
        opts.DebugLog = true;
        currentTask = UploadDirectory(distDirectory, opts);
        var uploadResult = await currentTask;
        if (opts.IsCancelled())
            Debug.LogWarning("<b>FTP upload was cancelled</b>");
        else if (uploadResult)
        {
            Debug.Log($"<b>FTP upload {"succeeded".AsSuccess()}</b> " + distDirectory);
            if (!string.IsNullOrWhiteSpace(buildContext.LiveUrl))
            {
                Application.OpenURL(buildContext.LiveUrl);
                AnalyticsHelper.SendDeploy(buildContext.LiveUrl);
            }
            else
            {
                AnalyticsHelper.SendDeploy(serverName);
            }
        }
        else Debug.LogError("Uploading failed. Please see console for errors.\n" + distDirectory);
        if (Progress.Exists(progId))
            Progress.Finish(progId);
    }

    const int UploadRetryCount = 3;
    protected static Task<bool> UploadDirectory(string directory, DeployToFTPUtils.UploadContext context)
    {
        for (int i = 0; i < UploadRetryCount; i++)
        {
            try
            {
                return DeployToFTPUtils.StartUpload(directory, context);
            }
            catch (Exception e)
            {
                Debug.LogException(e);
                if (i + 1 < UploadRetryCount)
                    Debug.Log($"Retrying... {i + 1}");
            }
        }

        return new Task<bool>(() => false);
    }

    protected static string SanitizeServerUrl(string serverName)
    {
        // TODO: proper sftp support etc
        if (serverName.StartsWith("ftp."))
        {
            serverName = "ftp://" + serverName;
        }
        if (!serverName.StartsWith("ftp://ftp") && !serverName.StartsWith("sftp://sftp"))
            serverName = "ftp://ftp." + serverName;
        return serverName;
    }
}
