import { TypeStore } from "@needle-tools/engine"

// Import types
import { Card } from "../Card";
import { Deck } from "../Deck";
import { DragHandler } from "../DragHandler";
import { DropZone } from "../DropZone";
import { GameManager } from "../GameManager";

// Register types
TypeStore.add("Card", Card);
TypeStore.add("Deck", Deck);
TypeStore.add("DragHandler", DragHandler);
TypeStore.add("DropZone", DropZone);
TypeStore.add("GameManager", GameManager);
