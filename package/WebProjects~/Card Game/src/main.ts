import "@needle-tools/engine";

import { CardModel, Deck } from "@needle-tools/card-game-sample"


// insert custom cards

Deck.onInitialize(deck => {
    const armabee = Deck.createCard("./include/cards/Armabee.gltf", "./include/cards/Armabee.jpg");
    armabee.idleAnimation = "Flying_Idle";
    
    const ghost = Deck.createCard("./include/cards/Ghost.gltf", "./include/cards/Ghost.jpg");
    ghost.idleAnimation = "Flying_Idle";

    // this gltf has some "non-standard" animation names
    const glub = Deck.createCard("./include/cards/Glub.gltf", "./include/cards/Glub.jpg");
    glub.idleAnimation = "Flying_Idle";
    
    const mushroomKing = Deck.createCard("./include/cards/MushroomKing.gltf", "./include/cards/MushroomKing.jpg");
})