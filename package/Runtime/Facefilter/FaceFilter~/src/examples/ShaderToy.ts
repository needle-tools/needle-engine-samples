import { Behaviour, Context, getParam, makeIdFromRandomWords, serializable, setParam, setParamWithoutReload, showBalloonMessage, showBalloonWarning, syncField } from "@needle-tools/engine";
import { FaceMeshBehaviour } from "../facemesh/FaceMeshBehaviour";
import { Material, ShaderMaterial, ShaderMaterialParameters, Texture, Vector3, Vector4 } from "three";

/*
Shader Inputs
uniform vec3      iResolution;           // viewport resolution (in pixels)
uniform float     iTime;                 // shader playback time (in seconds)
uniform float     iTimeDelta;            // render time (in seconds)
uniform float     iFrameRate;            // shader frame rate
uniform int       iFrame;                // shader playback frame
uniform float     iChannelTime[4];       // channel playback time (in seconds)
uniform vec3      iChannelResolution[4]; // channel resolution (in pixels)
uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
uniform samplerXX iChannel0..3;          // input channel. XX = 2D/Cube
uniform vec4      iDate;                 // (year, month, day, time in seconds)
*/

const inputsChunk = `
uniform vec3      iResolution;           // viewport resolution (in pixels)
uniform float     iTime;                 // shader playback time (in seconds)
uniform float     iTimeDelta;            // render time (in seconds)
uniform float     iFrameRate;            // shader frame rate
uniform int       iFrame;                // shader playback frame
// channelPlaybackTime
uniform vec3      iChannelResolution[4]; // channel resolution (in pixels)
uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
uniform vec4      iDate;                 // (year, month, day, time in seconds)
uniform sampler2D iChannel0;
`

const mainChunk = `
uniform sampler2D mask;
varying vec2 vUv;

void main() {
    gl_FragColor = vec4(0.3, 1.0, 0.4, 1.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);

#ifdef USE_MASK
    vec4 maskColor = texture2D(mask, vUv);
    gl_FragColor.a *= maskColor.r;
#endif
}
`

const fragmentShader = `
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{    vec2 uv = fragCoord/iResolution.xy;
    vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
    fragColor = vec4(col,1.0);
}
`;


class ShaderToyMaterial extends ShaderMaterial {

    constructor(args?: ShaderMaterialParameters) {
        super(args);
        if (!args?.fragmentShader) {
            let shader = inputsChunk;
            shader += fragmentShader;
            shader += mainChunk;
            this.fragmentShader = shader;
        }
        this.vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `
        this.transparent = true;
        this.uniforms = {
            iResolution: { value: new Vector3(100, 100, 1) },
            iTime: { value: 0 },
            iTimeDelta: { value: 0 },
            iFrameRate: { value: 0 },
            iFrame: { value: 0 },
            iChannelTime: { value: [0, 0, 0, 0] },
            iChannelResolution: { value: [new Vector3(1, 1, 1), new Vector3(1, 1, 1), new Vector3(1, 1, 1), new Vector3(1, 1, 1)] },
            iMouse: { value: new Vector4(0, 0, 0, 0) },
            iDate: { value: new Vector4(0, 0, 0, 0) },
            iChannel0: { value: null },
            iChannel1: { value: null },
            iChannel2: { value: null },
            iChannel3: { value: null },
            ...this.uniforms,
        }
    }
    update(filter: ShaderToyFaceFilter) {
        const context = filter.context;
        this.uniforms.iResolution.value.set(context.domWidth * window.devicePixelRatio, context.domHeight * window.devicePixelRatio, 1);
        this.uniforms.iTime.value = context.time.realtimeSinceStartup;
        this.uniforms.iTimeDelta.value = context.time.deltaTime;
        this.uniforms.iFrameRate.value = context.time.smoothedFps;
        this.uniforms.iFrame.value = context.time.frameCount;
        this.uniforms.iChannelTime.value[0] = context.time.realtimeSinceStartup;
        // this.uniforms.iChannelResolution.value[0].set(context.domWidth, context.domHeight, 1);
        const pointerPosition = context.input.getPointerPosition(0);
        if (pointerPosition)
            this.uniforms.iMouse.value.set(pointerPosition.x, pointerPosition.y, context.input.getPointerDown(0), 0);
        const time = new Date();
        this.uniforms.iDate.value.set(time.getFullYear(), time.getMonth(), time.getDate(), time.getTime());
    }
}


export class ShaderToyFaceFilter extends FaceMeshBehaviour {

    @serializable(Texture)
    mask: Texture | null = null;

    protected createMaterial(): Material | null {
        return new ShaderToyMaterial({
            uniforms: {
                mask: { value: this.mask }
            },
            defines: {
                USE_MASK: this.mask ? true : false
            }
        })
    }
    awake() {
        showBalloonMessage(`Copy paste <a href=\"https://shadertoy.com\" target=\"_blank\">shadertoy</a> shaders (the whole code) to use as a face filter.<br/>For example <a href=\"https://www.shadertoy.com/view/tlVGDt\" target=\"_blank\">this one</a> or <a href=\"https://www.shadertoy.com/view/ftSSRR\" target=\"_blank\">this one</a> or <a href=\"https://www.shadertoy.com/new\" target=\"_blank\">create your own</a>.`);
    }
    onEnable(): void {
        super.onEnable();
        window.addEventListener("paste", this.onPaste);

        let shaderRoomName = getParam("shader") as string;
        if (typeof shaderRoomName != "string" || shaderRoomName.length < 1) {
            shaderRoomName = makeIdFromRandomWords();
            setParamWithoutReload("shader", shaderRoomName);
        }
        this.context.connection.joinRoom(shaderRoomName);
    }
    onDisable(): void {
        super.onDisable();
        window.removeEventListener("paste", this.onPaste);
        const room = getParam("shader") as string;
        if (room) {
            this.context.connection.leaveRoom(room);
        }
    }

    update(): void {
        const material = this.material as ShaderToyMaterial;
        if (material) {
            material.update(this)
        }
    }

    @syncField(ShaderToyFaceFilter.prototype.onShaderChanged)
    private _networkedShader: string | null = null;

    private onPaste = (e: ClipboardEvent) => {
        if (!e.clipboardData) return;
        const text = e.clipboardData.getData("text");
        if (text) {
            this.trySetShader(text);
        }
    }
    private trySetShader(shader: string) {
        if (shader.includes("void mainImage")) {
            const material = this.material as ShaderToyMaterial;
            if (material) {
                material.fragmentShader = inputsChunk + shader + mainChunk;
                material.needsUpdate = true;
                if (shader != this._networkedShader) {
                    this._networkedShader = shader;
                }
            }
        }
        else {
            showBalloonWarning("The pasted text does not contain a mainImage function / is not a ShaderToy shader.")
        }
    }
    private onShaderChanged() {
        if (this._networkedShader)
            this.trySetShader(this._networkedShader);
    }
}