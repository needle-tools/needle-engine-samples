import { NeedleEngine } from "@needle-tools/engine";

import { ExampleManager, getRandomPower } from "javascript-interop";

NeedleEngine.addContextCreatedCallback(() => {
    const interactButton = document.getElementById("interact");
    const manager = ExampleManager.instance;

    if(!interactButton) return;

    interactButton.textContent = `Interact with ${manager.objects.length} objects`;
    
    interactButton.addEventListener("click", ()=>{
        manager.interact(getRandomPower());
    });
});