import { Behaviour, GameObject, WebXR } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

export class CustomXRButtons extends Behaviour {

    start() {

        const xr = GameObject.findObjectOfType(WebXR)!;
        
        const haveAR = WebXR.IsARSupported;
        const haveVR = WebXR.IsVRSupported;

        const startAR = WebXR.createARButton(xr);
        const startVR = WebXR.createVRButton(xr);

        const arButton = document.querySelector(".ar-button")!;
        if (haveAR)
            arButton.addEventListener("click", () => { 
                startAR.click();
            });
        if (haveAR) arButton.classList.add("supported");
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