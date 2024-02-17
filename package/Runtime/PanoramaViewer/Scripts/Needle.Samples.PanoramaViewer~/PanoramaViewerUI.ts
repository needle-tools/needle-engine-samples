import { Behaviour, Canvas, GameObject, Mathf, PointerEventData, Rect, RectTransform, Text, serializable } from "@needle-tools/engine";
import { PanoramaViewer } from "./PanoramaViewer";
import { Object3D, Vector2, Vector3 } from "three";

export class PanoramaViewerUI extends Behaviour {
    @serializable(PanoramaViewer)
    viewer!: PanoramaViewer;

    @serializable(Object3D)
    videoControls?: Object3D;

    @serializable(Object3D)
    videoPlayBackPause?: Object3D;

    @serializable(Object3D)
    videoPlayBackPlay?: Object3D;

    @serializable(Text)
    videoTime?: Text;

    @serializable(Text)
    videoDuration?: Text;

    @serializable(Object3D)
    playbackTimeline?: Object3D;

    @serializable(Text)
    indexLabel?: Text;

    private playbackTimelineRT?: RectTransform;

    onEnable(): void {
        this.viewer ??= this.gameObject.getComponent(PanoramaViewer)!;
        if(this.playbackTimeline)
            this.playbackTimelineRT = GameObject.getComponent(this.playbackTimeline, RectTransform)!;

        if (!this.viewer) {
            this.enabled = false;
            return;
        }
        this.viewer.addEventListener("select", this.onSelect);
    }
    onDisable(): void {
        this.viewer?.removeEventListener("select", this.onSelect);
    }

    private onSelect = () => {
        const media = this.viewer.currentMedia;
        if (!media) return;

        const isVideo = media.info?.type === "video";

        if(this.videoControls) 
            this.videoControls.visible = isVideo;

        if (!isVideo) {
            this.lastVideoTime = NaN;
            this.lastVideoDuration = NaN;        
        }

        if (this.indexLabel)
            this.indexLabel.text = `${this.viewer.index + 1} / ${this.viewer.media.length}`;
    }

    togglePlay() {
        const newState = !this.viewer.videoPlayback;
        this.viewer.videoPlayback = newState;
        this.updatePlayback(newState);
    }

    private playbackState: boolean | undefined;
    private updatePlayback(isPlaying: boolean) {
        if (this.playbackState === isPlaying)
            return;

        this.playbackState = isPlaying;

        if(this.videoPlayBackPause && this.videoPlayBackPlay) {
            this.videoPlayBackPause.visible = isPlaying;
            this.videoPlayBackPlay.visible = !isPlaying;
        }
    }

    update() {
        const media = this.viewer.currentMedia;
        const isVideo = media?.info?.type === "video";
        
        if (isVideo && this.viewer.videoPlayer.isPlaying) {
            const time = this.lastVideoTime = this.viewer.videoPlayer.currentTime;
            const duration = this.lastVideoDuration = this.viewer.videoPlayer.videoElement?.duration ?? 0;
            this.setVideoTimeText(time, duration);
            this.setVideoTimeline(time / duration);
        }
        else if (isVideo) {
            this.setVideoTimeText(this.lastVideoTime, this.lastVideoDuration);
            const invalid = isNaN(this.lastVideoTime) || isNaN(this.lastVideoDuration);
            this.setVideoTimeline(invalid ? 0 : this.lastVideoTime / this.lastVideoDuration);
        }

        if(isVideo) {
            this.updatePlayback(this.viewer.videoPlayback);
        }       
    }

    private lastVideoTime = -1;
    private lastVideoDuration = -1;
    private setVideoTimeText(time: number, duration: number) {
        if(this.videoTime)
            this.videoTime.text = !isNaN(time) ? this.formatSeconds(time) : "";
        if(this.videoDuration)
            this.videoDuration.text = !isNaN(duration) ? this.formatSeconds(duration) : "";
    }

    private setVideoTimeline(t: number) {
        if (!this.playbackTimelineRT) return;

        this.playbackTimelineRT.scale.x = t;
    }

    next() {
        if(!this.viewer.isTransitioning)
            this.viewer.next();
    }

    previous() {
        if(!this.viewer.isTransitioning)
            this.viewer.previous();
    }

    toggleGyroscope() {
        this.viewer.toggleGyroControls();

        //TODO: update UI
        //this.viewer.isGyroEnabled
    }

    protected formatSeconds(seconds: number): string {
        // HH:MM:SS
        const h = Math.floor(seconds / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        const s = Math.floor(seconds % 60);

        const num = (n: number) => n.toString().padStart(2, "0");

        if(h > 0)
            return `${num(h)}:${num(m)}:${num(s)}`;
        else
            return `${num(m)}:${num(s)}`;
    }
}

export class PanoramaViewerUI_Timeline  extends Behaviour {
    @serializable(PanoramaViewerUI)
    viewerUI!: PanoramaViewerUI;

    private rectTransform?: RectTransform;
    awake(): void {
        this.rectTransform = this.gameObject.getComponent(RectTransform)!;
    }

    onPointerUp(args: PointerEventData) {
        if (!this.rectTransform) return;

        /* console.log("onPointerUp");

        const input = this.context.input;
        const pointerPos = input.getPointerPosition(args.pointerId)!;

        
        
        const rect = this.rectTransform["rect"] as Rect;
        const origin = this.rectTransform["position"] as Vector2;
        if (rect && origin) {
            const sizeX = Math.abs(rect.x);
            const sizeY = Math.abs(rect.y);
            
            const canvas = this.gameObject.getComponentInParent(Canvas)!;
            const vec3 = new Vector3(pointerPos.x, pointerPos.y, 0);
            canvas.shadowComponent?.localToWorld(vec3);
            pointerPos.x = vec3.x;

            //console.log(sizeX);
            console.log(this.rectTransform);
            console.log(origin.x);
            console.log(pointerPos.x);
            const x = (pointerPos.x - (origin.x + sizeX));
            const y = (pointerPos.y - origin.y);

            console.log(x / sizeX);
        } */
    }
}