import { AssetReference, Behaviour, DropListener, GameObject, serializable } from "@needle-tools/engine";
import { PlayerState } from "@needle-tools/engine/src/engine-components-experimental/networking/PlayerSync";
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { CharacterSwitcher } from "./CharacterSwitcher";

// Documentation → https://docs.needle.tools/scripting

export class CharacterManager extends Behaviour {

    @serializable(AssetReference)
    presets: Array<AssetReference> = [];

    onEnable() {
        const drop = this.gameObject.getComponent(DropListener);
        drop?.addEventListener('object-added', this.onDrop);
        window.addEventListener('keydown', this.switchCharacter);
    }

    onDisable() {
        const drop = this.gameObject.getComponent(DropListener);
        drop?.removeEventListener('object-added', this.onDrop);
        window.removeEventListener('keydown', this.switchCharacter);
    }

    private onDrop = (evt : any) => (evt : any) => {

        const data = evt.detail as GLTF;
        const go = data.scene;

        // HACK PlayerState.local doesn't work right now so we search for it manually
        const player = PlayerState.all.filter(p => p.isLocalPlayer)[0];
        const switcher = player.gameObject.getComponent(CharacterSwitcher);
        switcher?.replaceCharacter(go);
    }

    private switchCharacter = async (evt: KeyboardEvent) => {
        let presetToLoad : AssetReference | undefined;

        if (evt.code === 'Digit1') {
            presetToLoad = this.presets[0];
        } else if (evt.code === 'Digit2') {
            presetToLoad = this.presets[1];
        } else if (evt.code === 'Digit3') {
            presetToLoad = this.presets[2];
        } else if (evt.code === 'Digit4') {
            presetToLoad = this.presets[3];
        }

        if (presetToLoad) {

            // const newGo = await presetToLoad.instantiate() as GameObject;

            // HACK PlayerState.local doesn't work right now so we search for it manually
            const player = PlayerState.all.filter(p => p.isLocalPlayer)[0];
            const switcher = player.gameObject.getComponent(CharacterSwitcher);
            switcher?.replaceCharacter(presetToLoad);
        }
    }
}