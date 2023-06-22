// TODO: remove this and replace it with the @needle-tools/engine core SceneSwitcher

import { AssetReference, Behaviour, GameObject, serializeable, showBalloonMessage } from "@needle-tools/engine";
import { InputEvents } from "@needle-tools/engine";
import { getParam, isMobileDevice, setParamWithoutReload } from "@needle-tools/engine";

export abstract class BaseSceneSwitcher extends Behaviour {

    // This is abstract just so we can show off the difference for how to serialize Prefabs and Scenes
    // See the two classes below this BaseSceneSwitcher class
    abstract get sceneAssets(): AssetReference[] | undefined;

    private currentIndex: number = -1;
    private currentScene: AssetReference | undefined = undefined;

    start() {

        if (isMobileDevice()) {
            showBalloonMessage("Automatically switching between scenes on mobile every 5 seconds");
            setInterval(() => this.selectNext(), 5000);
        }
        else {
            setInterval(() => {
                showBalloonMessage("Press \"a\" or \"d\" keys to switch between the scenes or use the numbers 1 2 3");
            }, 3000);
        }

        this.context.input.addEventListener(InputEvents.KeyDown, (e: any) => {
            if (!this.sceneAssets) return;
            const key = e.key;
            if (!key) return;
            const index = parseInt(key) - 1;
            if (index >= 0) {
                if (index < this.sceneAssets.length) {
                    this.select(index);
                }
            }
            switch (e.key) {
                case "d":
                    this.selectNext();
                    break;
                case "a":
                    this.selectPrev();
                    break;
            }
        });

        // try restore the level from the url
        const level = getParam("level");
        if (typeof level === "string") {
            const index = parseInt(level as string);
            this.select(index);
        }
        else if (typeof level === "number") {
            this.select(level);
        }
        else {
            this.select(0);
        }
    }

    selectNext() {
        this.select(this.currentIndex + 1);
    }

    selectPrev() {
        this.select(this.currentIndex - 1);
    }

    select(index: number) {
        if (!this.sceneAssets?.length) return;
        if (index < 0) index = this.sceneAssets.length - 1;
        if (index >= this.sceneAssets.length) index = 0;
        const scene = this.sceneAssets[index];
        this.switchScene(scene);
    }

    async switchScene(scene: AssetReference) {
        if (scene === this.currentScene) return;
        if (this.currentScene)
            GameObject.remove(this.currentScene.asset);
        const index = this.currentIndex = this.sceneAssets?.indexOf(scene) ?? -1;
        this.currentScene = scene;
        await scene.loadAssetAsync();
        if (!scene.asset) return;
        if (this.currentIndex === index) {
            showBalloonMessage(`Switched to scene ${index + 1}`);
            GameObject.add(scene.asset, this.gameObject);
            // save the loaded level as an url parameter
            setParamWithoutReload("level", index.toString());
        }
    }
}

/** switcher using prefabs (you can assign Prefabs in Unity to the scenes array ) */
//@type UnityEngine.MonoBehaviour
export class PrefabSceneSwitcherSample extends BaseSceneSwitcher {

    get sceneAssets(): AssetReference[] | undefined {
        return this.scenes;
    }

    @serializeable(AssetReference)
    scenes?: AssetReference[];

}


/** Implementation that tells the componnet compiler to generate a SceneAsset array
 * (you can assign Scenes in Unity to the scenes array)
 * 
 */
//@type UnityEngine.MonoBehaviour
export class SceneSwitcherSample extends BaseSceneSwitcher {

    get sceneAssets(): AssetReference[] | undefined {
        return this.scenes;
    }

    //@type UnityEditor.SceneAsset[]
    @serializeable(AssetReference)
    scenes?: AssetReference[];

}
