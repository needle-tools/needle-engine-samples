import { Context, getIconElement, showBalloonMessage } from "@needle-tools/engine";


export class NeedleRecordingHelper {

    static debug = false;

    private static button: HTMLButtonElement | null = null;

    private static readonly chunks: Blob[] = [];
    private static recorder: MediaRecorder | null = null;
    private static recordingFormat: string = "";

    static createButton(ctx: Context) {
        if (!this.button) {
            this.button = document.createElement("button");
            this.button.innerText = "Record";
            const startIcon = getIconElement("screen_record");
            const stopIcon = getIconElement("stop_circle");
            this.button.prepend(startIcon);
            this.button.addEventListener("click", () => {
                if (this.debug) showBalloonMessage("State: " + this.recorder?.state);
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

        if (this.debug) {
            setTimeout(() => {
                this.startRecording(ctx.renderer.domElement);
                setTimeout(() => {
                    this.stopRecording();
                }, 2000)
            }, 1000)
        }
    }

    static startRecording(canvas: HTMLCanvasElement) {
        const stream = canvas.captureStream(30);
        this.recordingFormat = "video/webm";

        const options: MediaRecorderOptions = {
            mimeType: this.recordingFormat,
        }
        options.videoBitsPerSecond = 2500000 * 4; // 4x higher than the default 2.5mbps
        this.recorder = new MediaRecorder(stream, options);
        this.recorder.ondataavailable = (e) => {
            if (this.debug) showBalloonMessage("Recording data " + e.data.type + " " + e.data.size + ", " + this.chunks.length);
            if (e.data?.size > 0)
                this.chunks.push(e.data);
        };
        this.recorder.onerror = (e: any) => {
            console.error(e.error.name + ": " + e.error.message);
        }
        this.recorder.start(100);
    }
    static stopRecording() {
        this.recorder?.requestData();
        if (this.debug) showBalloonMessage("Recording stopped " + this.chunks.length);
        this.recorder!.onstop = () => {
            this.download();
        };
        this.recorder!.stop();
    }
    private static download() {
        if (this.chunks.length === 0) {
            return false;
        }
        const format = this.recordingFormat || "video/webm";
        const blob = new Blob(this.chunks, { type: format });
        this.chunks.length = 0;
        const ext = format.split("/")[1];
        const downloadName = "needle-engine-facefilter." + ext;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = downloadName;
        a.click();
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 10);
        return true;
    }
}