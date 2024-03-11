import { Behaviour, serializable } from "@needle-tools/engine";

export class VariantInfo extends Behaviour {
    @serializable()
    displayName: string = "";
}