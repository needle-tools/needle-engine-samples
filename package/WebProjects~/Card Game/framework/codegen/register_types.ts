import { TypeStore } from "@needle-tools/engine"

// Import types
import { Ability } from "../Ability.js";
import { BattleManager } from "../BattleManager.js";
import { Card } from "../Card.js";
import { CardModel } from "../CardModel.js";
import { CreatureState } from "../Creature.js";
import { Creature } from "../Creature.js";
import { CreatureUI } from "../CreatureUI.js";
import { Deck } from "../Deck.js";
import { DragHandler } from "../DragHandler.js";
import { DropZone } from "../DropZone.js";
import { GameModel } from "../GameManager.js";
import { GameManager } from "../GameManager.js";
import { Player } from "../Player.js";

// Register types
TypeStore.add("Ability", Ability);
TypeStore.add("BattleManager", BattleManager);
TypeStore.add("Card", Card);
TypeStore.add("CardModel", CardModel);
TypeStore.add("CreatureState", CreatureState);
TypeStore.add("Creature", Creature);
TypeStore.add("CreatureUI", CreatureUI);
TypeStore.add("Deck", Deck);
TypeStore.add("DragHandler", DragHandler);
TypeStore.add("DropZone", DropZone);
TypeStore.add("GameModel", GameModel);
TypeStore.add("GameManager", GameManager);
TypeStore.add("Player", Player);
