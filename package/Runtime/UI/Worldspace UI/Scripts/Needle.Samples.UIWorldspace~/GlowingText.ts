import { Behaviour, RGBAColor, serializable, Text } from "@needle-tools/engine";

export class GlowingText extends Behaviour { 

    // @nonSerialized
    @serializable(RGBAColor)
    color: RGBAColor = new RGBAColor(1, 1, 1, 1);

    private _text?: Text;

    /* awake(): void {
        this.onValidate();
    } */

    update(): void {
        this._text ??= this.gameObject.getComponent(Text)!;

        if(this._text) {
            this._text.color = this.color;
        }
    }
}