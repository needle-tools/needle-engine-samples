import { Behaviour, GameObject, USDZExporter, WebXR } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

export class CustomXRButtons extends Behaviour {

    start() {

        // WebXR and USDZExporter have their default buttons disabled in Unity.

        const xr = GameObject.findObjectOfType(WebXR)!;
        const usdzExporter = GameObject.findObjectOfType(USDZExporter);
        
        const haveAR = WebXR.IsARSupported;
        const haveVR = WebXR.IsVRSupported;

        // https://webkit.org/blog/8421/viewing-augmented-reality-assets-in-safari-for-ios/
        const a = document.createElement("a");
        const haveQuickLook = a.relList.supports("ar") && usdzExporter;
        
        const startAR = WebXR.createARButton(xr);
        const startVR = WebXR.createVRButton(xr);

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
        if (haveAR || haveQuickLook) arButton.classList.add("supported");
        else arButton.classList.add("not-supported");

        const vrButton = document.querySelector(".vr-button")!;
        if (haveVR)
            vrButton.addEventListener("click", () => { 
                startVR.click();
            });
        if (haveVR) vrButton.classList.add("supported");
        else vrButton.classList.add("not-supported");
    }
}