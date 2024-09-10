import { Context, disposeObjectResources, getIconElement, hasCommercialLicense, hasProLicense, isDevEnvironment, ObjectUtils, showBalloonError, showBalloonMessage, showBalloonWarning } from "@needle-tools/engine";
import { DoubleSide, MeshBasicMaterial, Object3D, PerspectiveCamera, Texture, TextureLoader, Vector3 } from "three";


declare type RecordingOptions = {
    context: Context;
    customLogo?: Texture | null;
    download_name?: string | null;
}
declare type FilterRecordingOptions = RecordingOptions & {
}

export class NeedleRecordingHelper {

    static debug = false;

    private static button: HTMLButtonElement | null = null;
    private static isRecording = false;
    private static readonly chunks: Blob[] = [];
    private static recorder: MediaRecorder | null = null;
    private static recordingFormat: string = "";

    static createButton(options: FilterRecordingOptions): HTMLButtonElement {

        const ctx = options.context;

        // Watermark.add(ctx, options.customLogo || null);

        if (!this.button) {
            this.button = document.createElement("button");
            this.button.innerText = "Record";
            const startIcon = getIconElement("screen_record");
            const stopIcon = getIconElement("stop_circle");
            this.button.prepend(startIcon);
            let recordingStartTime = 0;
            let shouldRecord = false;
            this.button.addEventListener("click", () => {
                if (this.debug) showBalloonMessage("State: " + this.recorder?.state);

                // Stop recording
                if (this.chunks.length > 0 || this.isRecording || shouldRecord) {
                    shouldRecord = false;
                    this.button!.innerText = "Record";
                    this.button!.prepend(startIcon);
                    this.stopRecording(options);
                }// Start recording
                else {
                    shouldRecord = true;
                    let isWaitingForStart = true;
                    const waitDuration = 3000;
                    const clickTime = Date.now();
                    stopIcon.style.color = "";
                    // This is called every few seconds to update the button text
                    const update = () => {
                        if (!shouldRecord) {
                            return;
                        }
                        // Show a countdown before starting
                        if (isWaitingForStart) {
                            const duration = waitDuration - (Date.now() - clickTime);
                            this.button!.innerText = "Start in " + Math.max(0, (duration / 1000)).toFixed(0) + "s";
                            this.button!.prepend(stopIcon);
                        }
                        // The recording has started, show how much time has passed
                        else if (this.isRecording) {
                            const duration = Date.now() - recordingStartTime;
                            stopIcon.style.color = "#ff5555";
                            this.button!.innerText = "Recording Video " + (duration / 1000).toFixed(0) + "s";
                            this.button!.prepend(stopIcon);
                        }
                        setTimeout(update, 500);

                    };
                    update();

                    // Wait for a short moment before actually starting the recording
                    setTimeout(() => {
                        isWaitingForStart = false;
                        if (shouldRecord) {
                            recordingStartTime = Date.now();
                            this.startRecording(ctx.renderer.domElement, options);
                        }
                    }, waitDuration);
                }
            });
        }
        ctx.menu.appendChild(this.button);

        if (this.debug) {
            setTimeout(() => {
                this.startRecording(ctx.renderer.domElement, options);
                setTimeout(() => {
                    this.stopRecording(options);
                }, 2000)
            }, 1000)
        }

        return this.button;
    }

    static startRecording(canvas: HTMLCanvasElement, opts: FilterRecordingOptions) {
        this.recordingFormat = "video/webm";
        const availableFormats = [
            "video/webm",
            "video/webm;codecs=vp9",
            "video/webm;codecs=vp8",
            "video/webm;codecs=h264",
            "video/mp4",
        ]
        for (const format of availableFormats) {
            if (MediaRecorder.isTypeSupported(format)) {
                this.recordingFormat = format;
                break;
            }
        }

        const recorderOptions: MediaRecorderOptions = {
            mimeType: this.recordingFormat,
        }
        recorderOptions.videoBitsPerSecond = 2500000 * 4; // 4x higher than the default 2.5mbps
        const stream = canvas.captureStream(30);
        this.recorder = new MediaRecorder(stream, recorderOptions);
        this.recorder.ondataavailable = (e) => {
            if (this.debug) showBalloonMessage("Recording data " + e.data.type + " " + e.data.size + ", " + this.chunks.length);
            if (e.data?.size > 0)
                this.chunks.push(e.data);
        };
        this.recorder.onerror = (e: any) => {
            this.isRecording = false;
            console.error(e.error.name + ": " + e.error.message);
            showBalloonError(e.error.name + ": " + e.error.message);
        }
        this.isRecording = true;
        Watermark.add(opts.context, opts.customLogo || null);
        this.recorder.start(100);
    }
    static stopRecording(opts?: RecordingOptions) {
        this.isRecording = false;
        Watermark.remove();
        this.recorder?.requestData();
        if (this.debug) showBalloonMessage("Recording stopped " + this.chunks.length);
        this.recorder!.onstop = () => {
            this.download(opts);
        };
        this.recorder!.stop();
    }
    private static async download(opts?: RecordingOptions) {
        if (this.chunks.length === 0) {
            return false;
        }
        const format = this.recordingFormat || "video/webm";
        const blob = new Blob(this.chunks, { type: format });
        this.chunks.length = 0;
        const ext = format.split("/")[1];

        let downloadName = "needle-engine-facefilter";
        if (opts?.download_name?.length) {
            if (hasProLicense())
                downloadName = opts.download_name;
            else {
                console.warn("Needle Engine Pro is required to set a custom download name");
            }
        }
        downloadName += "." + ext;
        console.debug("Downloading recording as " + downloadName);

        const url = URL.createObjectURL(blob);

        // Share doesnt work with a blob url
        // if("share" in navigator) {
        //     await navigator.share({
        //         title: "Needle Engine Facefilter",
        //         text: "Facefilter recording",
        //         url: url,
        //     }).catch((e) => {
        //         console.warn(e);
        //         return false;
        //     });
        // }
        // else 
        {
            const a = document.createElement("a");
            a.href = url;
            a.download = downloadName;
            a.click();

        }

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 10);
        return true;
    }
}


class Watermark {
    private static active: boolean = false;
    private static object: Object3D | null = null;
    private static texture: Texture | null = null;

    static async add(context: Context, logo: Texture | null) {
        this.active = true;
        if (!this.object) {
            const allowCustomLogo = hasProLicense();
            if (!logo || !allowCustomLogo) {
                const url = "https://cdn.needle.tools/static/branding/logo_needle_white_no_padding.png";
                const textureLoader = new TextureLoader();
                this.texture = await textureLoader.loadAsync(url);
                if (logo) {
                    const msg = "\n\nTo use a custom logo in your face filter please upgrade to Needle Engine Pro for custom branding: https://needle.tools/pricing\n\n";
                    console.warn(msg);
                }
            }
            else {
                this.texture = logo;
                this.texture.repeat.set(1, -1); // flip y
            }
            this.texture.colorSpace = context.renderer.outputColorSpace;
            const quad = ObjectUtils.createPrimitive("Quad", {
                texture: this.texture,
                material: new MeshBasicMaterial({
                    depthWrite: false,
                    colorWrite: true,
                    transparent: true,
                    side: DoubleSide,
                })
            });
            quad.renderOrder = -1000;
            this.object = quad;
        }

        const object = this.object;
        const texture = this.texture;
        const cam = context.mainCamera;
        if (cam instanceof PerspectiveCamera && texture) {
            cam.add(object);

            let aspect = 1;
            if (texture.image?.width) {
                aspect = texture.image.width / texture.image.height;
            }
            object.scale.set(aspect, 1, 1);
            object.scale.multiplyScalar(cam.far * .05);

            const updatePosition = () => {
                if (!this.active) {
                    window.removeEventListener("resize", updatePosition);
                    window.removeEventListener("orientationchange", updatePosition);
                    window.removeEventListener("fullscreenchange", updatePosition);
                }
                else {
                    const corner = new Vector3(1, .9, 1).unproject(cam);
                    cam.worldToLocal(corner);
                    object.position.copy(corner);
                    object.position.x -= object.scale.x * 0.5; // center
                    object.position.x -= 4; // extra offset
                    setTimeout(() => {
                        updatePosition();
                    }, 2000);
                }
            }
            window.addEventListener("resize", updatePosition);
            window.addEventListener("orientationchange", updatePosition);
            window.addEventListener("fullscreenchange", updatePosition);
            updatePosition();
        }
    }
    static remove() {
        this.active = false;
        this.object?.removeFromParent();
    }

}