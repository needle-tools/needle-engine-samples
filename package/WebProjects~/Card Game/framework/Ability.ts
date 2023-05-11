import { CardModel } from "./Card";
import { type CreatureState } from "./Creature";

const defaultPerform = Promise.resolve();

export class Ability {

    name: string;
    type: string = "";
    animationName?: string;

    constructor(name: string) {
        this.name = name;
    }

    apply(self: CreatureState, other: CreatureState): Promise<any> {
        console.log("Ability executed", this.name);
        return defaultPerform;
    }
}