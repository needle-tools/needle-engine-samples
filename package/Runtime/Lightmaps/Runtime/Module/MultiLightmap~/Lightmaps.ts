import { Context, ContextRegistry, Interactable, SyncedTransform, delay } from "@needle-tools/engine";
import { Behaviour, GameObject } from "@needle-tools/engine";
import { Renderer } from "@needle-tools/engine";
import { IPointerClickHandler } from "@needle-tools/engine";
import { WaitForSeconds } from "@needle-tools/engine";
import { RoomEvents } from "@needle-tools/engine";
import { serializeable } from "@needle-tools/engine";
import { Texture, Vector3, Quaternion } from "three";

export class LightSwitch extends Interactable implements IPointerClickHandler {

    private _lightmap?: LightmapConfigurations;

    private _startPosition?: Vector3;
    private _startQuat?: Quaternion;

    awake() {
        this._startPosition = this.gameObject.position.clone();
        this._startQuat = this.gameObject.quaternion.clone();
        this._lightmap = GameObject.findObjectOfType(LightmapConfigurations) || undefined;
        
        const st = this.gameObject.getComponent(SyncedTransform);
        st?.requestOwnership();
        setTimeout(() => {
            if (this._startPosition)
                this.gameObject.position.copy(this._startPosition);
            if (this._startQuat)
                this.gameObject.quaternion.copy(this._startQuat);
        }, 1000);
    }

    onPointerClick() {
        this._lightmap?.switchLight();
    }

    update() {
        if (this.context.time.frameCount % 60 !== 0) return;
        const dist = this._startPosition?.distanceTo(this.gameObject.position) ?? 0;
        if (dist > 5) {
            this.gameObject.position.copy(this._startPosition!);
        }
    }
}

class LightmapSettings {
    @serializeable(Renderer)
    emissive?: Renderer[];
}

//@dont-generate-component
export class LightmapConfigurations extends Behaviour {

    switchLight() {
        this._didSwitchLightTime = Date.now();
        this.index = this.currentIndex + 1;
        this.context.connection.send("lightmap_index", this.currentIndex);
    }

    private _didSwitchLightTime?: number;

    pingPong: boolean = false;

    //@type System.Collections.Generic.List<UnityEngine.Texture2D>
    @serializeable(Texture)
    lightmaps?: Texture[];

    @serializeable(LightmapSettings)
    settings?: LightmapSettings[];

    set index(val: number) {
        this.setLightmap(val);
    }
    get currentIndex(): number { return this._currentIndex; }

    private _intensities: { [key: string]: number } = {};
    private _forward: boolean = true;
    private _renderers: Renderer[] = [];

    awake() {
        this.context.connection.beginListen("lightmap_index", (index: number) => {
            this._didSwitchLightTime = Date.now()
            this.setLightmap(index);
        });
        this.context.connection.beginListen(RoomEvents.JoinedRoom, () => {
            this.context.connection.send("lightmap_sync", { index: this.currentIndex, switchTime: this._didSwitchLightTime });
        });
        this.context.connection.beginListen("lightmap_sync", (model: { index: number, switchTime: number }) => {
            this.index = model.index;
            this._didSwitchLightTime = model.switchTime;
        });
    }

    onEnable() {
        this.startCoroutine(this.switchLightmaps());
    }

    *switchLightmaps() {
        this._renderers = GameObject.findObjectsOfType(Renderer);
        if(this._renderers.length <= 0){
            console.warn("No renderers found for LightmapConfigurations", this, Context.Current, ContextRegistry.Registered);
            return;
        }
        let i = 0;
        while (true) {
            if (!this.lightmaps?.length) return;
            // if someone switched the light dont auto proceed
            if (!this._didSwitchLightTime || Date.now() - this._didSwitchLightTime > 600 * 1000) {
                this._didSwitchLightTime = undefined;
                if (this.pingPong) {
                    if (i === 0)
                        this._forward = true;
                    else if (i >= this.lightmaps.length - 1) {
                        this._forward = false;
                    }
                }
                if (this._forward)
                    i += 1;
                else
                    i -= 1;

                this.setLightmap(i);
            }
            yield WaitForSeconds(1);//.3 + Math.random() * .5);
        }
    }

    private _currentIndex: number = -1;

    private setLightmap(index: number) {
        if (typeof index !== "number") return;
        if (!this.lightmaps) return;
        index %= this.lightmaps.length;
        this._currentIndex = index;
        for (const rend of this._renderers) {
            rend.lightmap = this.lightmaps[index];
        }
        if (this.settings) {
            for (let k = 0; k < this.settings.length; k++) {
                const settings = this.settings[k];
                if (!settings.emissive) continue;
                for (const rend of settings.emissive) {
                    this.disableRendererEmission(rend);
                }
            }
            const active = this.settings[index];
            if (active && active.emissive) {
                for (const rend of active.emissive) {
                    this.enableRendererEmission(rend);
                }
            }
        }
    }

    private disableRendererEmission(renderer: Renderer) {
        const mat = renderer.sharedMaterial;
        const cached = this._intensities[renderer.guid];
        if (!cached)
            this._intensities[renderer.guid] = mat["emissiveIntensity"];
        mat["emissiveIntensity"] = 0;
    }

    private enableRendererEmission(renderer: Renderer) {
        const intensity = this._intensities[renderer.guid];
        if (intensity === undefined) return;
        const mat = renderer.sharedMaterial;
        mat["emissiveIntensity"] = intensity;
    }
}
