import { Behaviour, GameObject, WebXR } from "@needle-tools/engine";
import { isQuest } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

export class PresencePlatformUI extends Behaviour {

    start() {

        const div = this.context.domElement.shadowRoot!.querySelector(".webxr-buttons") as HTMLElement;
        if (!div) {
            console.warn("Could not find webxr-buttons element");
            return;
        }

        this.appendWebXRButtonsStyle();

        const launchOnQuest = document.createElement("button");
        launchOnQuest.className = "webxr-button";
        launchOnQuest.innerHTML = " 🎁 Launch</br>on Quest";
        launchOnQuest.onclick = () => {
            window.open("https://www.oculus.com/open_url/?url=" + document.URL, "_blank");
        };

        const xr = GameObject.findObjectOfType(WebXR)!;

        const haveAR = WebXR.IsARSupported;
        const haveVR = WebXR.IsVRSupported;

        const startAR = WebXR.createARButton(xr);
        const startVR = WebXR.createVRButton(xr);

        const arButton = document.createElement("button")!;
        if (isQuest())
            arButton.innerHTML = "Passthrough";
        else
            arButton.innerHTML = "AR";
        if (haveAR)
            arButton.addEventListener("click", () => {
                startAR.click();
            });
        if (haveAR) arButton.classList.add("supported");
        else arButton.classList.add("not-supported");

        const vrButton = document.createElement("button")!;
        vrButton.innerHTML = "VR";
        if (haveVR)
            vrButton.addEventListener("click", () => {
                startVR.click();
            });
        if (haveVR) vrButton.classList.add("supported");
        else vrButton.classList.add("not-supported");

        const info = document.createElement("span");
        info.innerHTML = "Make sure to complete</br>Room Setup with walls.";

        if (isQuest())
            div.appendChild(info);
        div.appendChild(arButton);
        div.appendChild(vrButton);
        if (!isQuest())
            div.appendChild(launchOnQuest);
    }

    private appendWebXRButtonsStyle() {
        const style = document.createElement("style");
        style.innerHTML = `
        needle-engine .webxr-buttons {
            align-items: center;
        }

        .webxr-buttons button {
            text-transform: uppercase;
            border:1px solid black;
            background: grey;
            border-radius: 5px;
            padding: 10px;
            color: white;
            transition: background 0.2s;
            cursor: pointer;
        }

        .webxr-buttons button.not-supported {
            display: none;
        }
        
        .webxr-buttons button:hover {
            background: #333;
        }

        .webxr-buttons span {
            color: white;
        }

        .webxr-buttons a {
            font-size: 30px;
        }
        `;
        this.context.domElement.shadowRoot!.appendChild(style);

    }
}
