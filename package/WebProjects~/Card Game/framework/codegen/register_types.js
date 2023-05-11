import { TypeStore } from "@needle-tools/engine"

// Import types
import { Card } from "../Card";
import { Creature } from "../Creature";
import { CardModel } from "../Deck";
import { Deck } from "../Deck";
import { DragHandler } from "../DragHandler";
import { DropZone } from "../DropZone";
import { GameModel } from "../GameManager";
import { GameManager } from "../GameManager";
import { Player } from "../GameManager";

// Register types
TypeStore.add("Card", Card);
TypeStore.add("Creature", Creature);
TypeStore.add("CardModel", CardModel);
TypeStore.add("Deck", Deck);
TypeStore.add("DragHandler", DragHandler);
TypeStore.add("DropZone", DropZone);
TypeStore.add("GameModel", GameModel);
TypeStore.add("GameManager", GameManager);
TypeStore.add("Player", Player);
