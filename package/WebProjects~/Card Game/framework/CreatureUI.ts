import { Behaviour, serializable } from "@needle-tools/engine";
import { type Creature } from "./Creature";



export class CreatureUI extends Behaviour {
    @serializable(Behaviour)
    creature: Creature | null = null;


}