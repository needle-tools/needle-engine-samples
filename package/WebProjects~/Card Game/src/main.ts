import "@needle-tools/engine";

import { CardModel, Deck } from "@needle-tools/card-game-sample"


// insert custom cards

Deck.onInitialize(deck => {
    const armabee = Deck.createCard("./cards/Armabee.gltf", "./cards/Armabee.jpg");
    armabee.idleAnimation = "Flying_Idle";
    
    const ghost = Deck.createCard("./cards/Ghost.gltf", "./cards/Ghost.jpg");
    ghost.idleAnimation = "Flying_Idle";

    // this gltf has some "non-standard" animation names
    const glub = Deck.createCard("./cards/Glub.gltf", "./cards/Glub.jpg");
    glub.idleAnimation = "Flying_Idle";
    
    const mushroomKing = Deck.createCard("./cards/MushroomKing.gltf", "./cards/MushroomKing.jpg");
})