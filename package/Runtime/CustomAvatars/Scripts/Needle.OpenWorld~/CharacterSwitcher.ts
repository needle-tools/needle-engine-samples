import { Behaviour, CharacterControllerInput, GameObject, AssetReference, Animator } from "@needle-tools/engine";
import { PlayerState } from "@needle-tools/engine/src/engine-components-experimental/networking/PlayerSync";
import { syncField } from "@needle-tools/engine/src/engine/engine_networking_auto";
import { IGameObject } from "@needle-tools/engine/src/engine/engine_types";
import { SyncedAnimator } from "./SyncedAnimator";
import { Object3D } from "three";

// Documentation → https://docs.needle.tools/scripting

export class CharacterSwitcher extends Behaviour {

    // Won't work for dropping new files but would work for local presets + URLs
    @syncField("characterUriChanged")
    private characterUri: string = "0";

    private previousGo: IGameObject | undefined;

    private characterUriChanged(newUri, oldUri) {
        if (newUri !== oldUri) {
            console.log("received new uri: " + newUri);

            // TODO I believe this needs to be undefined but the signature doesn't allow it (the method inside does)
            const assetReference = AssetReference.getOrCreate(this.sourceId!, newUri, this.context);
            this.replaceCharacter(assetReference);
        }
    }

    async replaceCharacter(_go: IGameObject | AssetReference) {

        if (_go instanceof AssetReference) {
            const requestedUri = _go.uri;
            // locally owned? sync to others
            if (PlayerState.isLocalPlayer(this)) {
                console.log("locally owned, setting characterUri")
                this.characterUri = _go.uri;
            }

            _go = await _go.instantiate() as GameObject;
            if (requestedUri !== this.characterUri || this.destroyed) {
                GameObject.destroy(_go);
                return;
            }
        }

        const go = _go as GameObject;

        // find CharacterControllerInput
        const characterControllerInput = this.gameObject.getComponent(CharacterControllerInput);
        if (characterControllerInput) {
            // get animator
            const animator = characterControllerInput.animator;
            if (animator) {
                animator.enabled = false;

                const parent = animator.gameObject.parent;
                if (!parent) return;

                go.name = animator.gameObject.name;
                go.parent = parent;
                go.position.copy(animator.gameObject.position);
                go.rotation.copy(animator.gameObject.rotation);
                go.scale.copy(animator.gameObject.scale);

                parent.clear();
                parent.add(go);

                // move data over
                const sync = GameObject.getComponent(animator.gameObject, SyncedAnimator);
                GameObject.addComponent(go, animator);

                // if an animator exists we want to remove it for sync animator to work
                const existingAnimators = go.getComponents(Animator);
                for (const ex of existingAnimators) {
                    if (ex !== animator)
                        ex.destroy();
                }

                animator.awake();
                animator.enabled = true;

                if (sync) {
                    GameObject.addComponent(go, sync);
                }

                // does not seem necessary when dropping files, but is necessary for AssetReference.instantiate
                if (this.previousGo) GameObject.destroy(this.previousGo);
                this.previousGo = go;

                // ensure raycasting onto characters is disabled (can be slow)
                go.traverse((g: Object3D) => {
                    if (!g.isMesh) return;
                    g.layers.disableAll();
                    g.layers.set(2);
                    console.log("Setting layers to 2", g)
                });
            }
        }
    }
}