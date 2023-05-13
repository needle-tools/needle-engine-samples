import { TypeStore } from "@needle-tools/engine"

// Import types
import { Ability } from "../Ability";
import { BattleManager } from "../BattleManager";
import { Card } from "../Card";
import { CardModel } from "../CardModel";
import { CreatureState } from "../Creature";
import { Creature } from "../Creature";
import { CreatureUI } from "../CreatureUI";
import { Deck } from "../Deck";
import { DragHandler } from "../DragHandler";
import { DropZone } from "../DropZone";
import { GameModel } from "../GameManager";
import { GameManager } from "../GameManager";
import { Player } from "../Player";

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
