import { ActionBuilder, BehaviorModel, Behaviour, GameObject, TriggerBuilder, getWorldScale, serializable, AudioSource } from "@needle-tools/engine";
import { UsdzBehaviour } from "@needle-tools/engine";
import { USDObject } from "@needle-tools/engine";
import { AuralMode, PlayAction } from "@needle-tools/engine/lib/engine-components/export/usdz/extensions/behavior/BehavioursBuilder";
import { Matrix4, MeshStandardMaterial, Object3D, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

export class SoundOnProximity extends Behaviour implements UsdzBehaviour {

    @serializable(AudioSource)
    target?: AudioSource;

    // @type UnityEngine.AudioClip
    @serializable(URL)
    clip: string;


    @serializable()
    distance: number = 0.5;

    
    @serializable()
    targetState: boolean = true;


    
    createBehaviours(ext, model, _context) {
        return;
        if (!this.target && !this.clip) return;

        if (!this.target) {
            
            const newAudioSource = this.gameObject.addNewComponent(AudioSource);
            if (newAudioSource) {
                newAudioSource.spatialBlend = 1;
                newAudioSource.volume = 1;
                newAudioSource.loop = false;

                this.target = newAudioSource;
            }
        }
        
        if (model.uuid === this.gameObject.uuid) {
            
            const clipUrl = this.clip ? this.clip : this.target ? this.target.clip : undefined;
            if (!clipUrl) return;

            const playbackTarget = this.target ? this.target.gameObject : this.gameObject;
            const clipName = clipUrl.split("/").pop();
            const volume = this.target ? this.target.volume : 1;
            const auralMode = this.target && this.target.spatialBlend === 0 ? "nonSpatial" :"spatial";
            const playClip = new BehaviorModel("playAudioOnProximity" + this.name,
                TriggerBuilder.proximityToCameraTrigger(this.gameObject, this.distance),
                ActionBuilder.playAudioAction(playbackTarget, "audio/" + clipName, "play", volume, auralMode),
            );
            ext.addBehavior(playClip);

            /* ext.addBehavior(new BehaviorModel("SetActiveOnProximity_" + this.gameObject.name,
                TriggerBuilder.proximityToCameraTrigger(this.gameObject, this.distance),
                ActionBuilder.fadeAction(targetObj, this.fadeDuration, this.targetState)
            )); */

        }
    }

    async afterSerialize(_ext, context) {
        return;
        if (!this.target && !this.clip) return;
        const clipUrl = this.clip ? this.clip : this.target ? this.target.clip : undefined;
        if (!clipUrl) return;
        const clipName = clipUrl.split("/").pop();

        const audio = await fetch(this.clip);
        const audioBlob = await audio.blob();
        const arrayBuffer = await audioBlob.arrayBuffer();

        const audioData: Uint8Array = new Uint8Array(arrayBuffer)

        context.files["audio/" + clipName] = audioData;
    }
}