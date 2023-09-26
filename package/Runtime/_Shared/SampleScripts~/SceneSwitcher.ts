// START MARKER SceneSwitcher event listener loading
import { Animator, Behaviour, delay, EventList, ISceneEventListener, isDevEnvironment, serializable, showBalloonError } from "@needle-tools/engine";

/** Put this in the root of your loading scene. 
 * It will be called by the SceneSwitcher when the scene has been loaded
 * And before a scene is unloaded - you can implement your own listener by implementing the ISceneEventListener interface
 * This example script creates a HTML loading screen with a logo in the center  
 * and sets a boolean parameter on an animator while the scene is being loaded which can be used to hide and show the loading scene
 * but also to animate some content while the scene is being loaded
*/
export class LoadingSceneRoot extends Behaviour implements ISceneEventListener {

    @serializable(Animator)
    animator?: Animator;

    private _htmlElement?: HTMLElement;

    async sceneOpened(): Promise<void> {
        // We can notify an animator here to start playing a loading animation
        this.animator?.setBool("SceneOpen", true);

        this._htmlElement = this._getHtmlElement();
        this.context.domElement.appendChild(this._htmlElement);
        // you can also add it behind your scene (make sure your camera is set to SolidColor with transparent alpha)
        // this.context.domElement.parentElement?.prepend(this._htmlElement);
    }

    async sceneClosing(): Promise<void> {
        // Not necessary, just so that the loading scene is visible for some time
        await delay(1000);
        // We then tell an animator that loading has finished
        this.animator?.setBool("SceneOpen", false);
        // Some arbitrary delay
        await delay(1000);
        // Make sure to remove your HTML overlay
        this._htmlElement?.remove();
    }

    private _getHtmlElement() {
        if (!this._htmlElement) {
            // Instead of creating an HTML element here in code you could also query an existing element from the DOM
            // for example using this._htmlElement = document.querySelector("#scene-loading-screen")
            // and then setting this element active/adding or removing it from the DOM
            this._htmlElement = document.createElement("div");
            this._htmlElement.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                // backdrop-filter: blur(10px);
            `;
            const logo = document.createElement("img");
            logo.src = "https://engine.needle.tools/branding/needle-logo.png";
            // logo.style.cssText = `
            //     width: 50%;
            //     height: auto;
            // `;
            this._htmlElement.appendChild(logo);
        }
        return this._htmlElement;
    }
}
// END MARKER SceneSwitcher event listener loading




/** Called by the SceneSwitcher if this component is found on a root scene object */
export class SceneLoadingEvents extends Behaviour implements ISceneEventListener {

    @serializable(EventList)
    opened?: EventList;

    @serializable(EventList)
    closing?: EventList;

    sceneOpened(): Promise<void> {
        if (isDevEnvironment()) console.log("Scene opened", this.name);
        this.opened?.invoke();
        return Promise.resolve();
    }

    sceneClosing(): Promise<void> {
        if (isDevEnvironment()) console.log("Scene closing", this.name);
        this.closing?.invoke();
        return Promise.resolve();
    }
}