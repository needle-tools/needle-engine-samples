import { Camera, Matrix4, Object3D } from "three";
import { Matrix } from "@mediapipe/tasks-vision"
import { Context, getIconElement, showBalloonMessage } from "@needle-tools/engine";

export namespace NeedleMediaPipeUtils {

    const tempMatrix = new Matrix4();

    export function applyFaceLandmarkMatrixToObject3D(obj: Object3D, mat: Matrix, camera: Camera) {
        const matrix = tempMatrix.fromArray(mat.data);
        obj.matrixAutoUpdate = false;
        obj.matrix.copy(matrix);
        obj.matrix.elements[12] *= 0.01;
        obj.matrix.elements[13] *= 0.01;
        obj.matrix.elements[14] *= 0.01;
        if (obj.parent !== camera)
            camera.add(obj);
    }
}


export class NeedleRecordingHelper {

    private static button: HTMLButtonElement | null = null;

    private static readonly chunks: Blob[] = [];
    private static recorder: MediaRecorder | null = null;

    static createButton(ctx: Context) {
        if (!this.button) {
            this.button = document.createElement("button");
            this.button.innerText = "Record";
            const startIcon = getIconElement("screen_record");
            const stopIcon = getIconElement("stop_circle");
            this.button.prepend(startIcon);
            this.button.addEventListener("click", () => {
                showBalloonMessage("State: " + this.recorder?.state);
                if (this.chunks.length > 0) {
                    this.button!.innerText = "Record";
                    this.button!.prepend(startIcon);
                    this.stopRecording();
                } else {
                    this.button!.innerText = "Stop";
                    this.button!.prepend(stopIcon);
                    this.startRecording(ctx.renderer.domElement);
                }
            });
        }
        ctx.menu.appendChild(this.button);
    }

    static startRecording(canvas: HTMLCanvasElement) {
        const stream = canvas.captureStream();
        this.recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        this.recorder.ondataavailable = (e) => {
            showBalloonMessage("Recording data " + e.data.type + " " + e.data.size + ", " + this.chunks.length);
            if (e.data?.size > 0)
                this.chunks.push(e.data);
        };
        this.recorder.onerror = (e) => {
            console.error(e);
        }
        this.recorder.start(100);
    }
    static stopRecording() {
        this.recorder?.requestData();
        showBalloonMessage("Recording stopped " + this.chunks.length);
        this.recorder!.onstop = () => {
            showBalloonMessage("Recording stopped2 " + this.chunks.length);
            let format = "video/webm";
            const blob = new Blob(this.chunks, { type: format });
            this.chunks.length = 0;
            const ext = format.split("/")[1];
            const downloadName = "facefilter." + ext;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = downloadName;
            a.click();
            URL.revokeObjectURL(url)
        };
        this.recorder!.stop();
    }
}