import { NeedleEngine } from "@needle-tools/engine";

import { ExampleManager, getRandomPower } from "frontend-integration";

const interactButton = document.getElementById("interact");

window.UI = {
    interactButton: interactButton
};

NeedleEngine.addContextCreatedCallback(() => {
    const manager = ExampleManager.instance;

    if(!interactButton) return;

    interactButton.textContent = `Interact with ${manager.objects.length} objects`;
    
    interactButton.addEventListener("click", ()=>{
        manager.interact(getRandomPower());
    });
});