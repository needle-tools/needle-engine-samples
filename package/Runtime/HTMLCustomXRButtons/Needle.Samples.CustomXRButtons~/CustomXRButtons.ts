import { Behaviour, GameObject, USDZExporter, WebXR } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

export class CustomXRButtons extends Behaviour {

    // START MARKER webxr custom buttons

    start() {

        // WebXR and USDZExporter should have their default buttons
        // disabled on their components.

        const xr = GameObject.findObjectOfType(WebXR)!;
        const usdzExporter = GameObject.findObjectOfType(USDZExporter);
        
        const haveAR = WebXR.IsARSupported;
        const haveVR = WebXR.IsVRSupported;

        const a = document.createElement("a");
        const haveQuickLook = a.relList.supports("ar") && usdzExporter;
        
        const startAR = WebXR.createARButton(xr);
        const startVR = WebXR.createVRButton(xr);

        // We're using the AR button both for WebXR AR and QuickLook AR on iOS.
        const arButton = document.querySelector(".ar-button")!;
        if (haveAR) {
            arButton.addEventListener("click", () => { 
                startAR.click();
            });
        }
        else if (haveQuickLook) {
            arButton.addEventListener("click", () => {
                usdzExporter.exportAsync();
            });
        }

        const vrButton = document.querySelector(".vr-button")!;
        if (haveVR) {
            vrButton.addEventListener("click", () => { 
                startVR.click();
            });
        }

        // Give the buttons a style for being supported or not

        if (haveAR || haveQuickLook) arButton.classList.add("supported");
        else arButton.classList.add("not-supported");

        if (haveVR) vrButton.classList.add("supported");
        else vrButton.classList.add("not-supported");
    }

    // END MARKER webxr custom buttons
}