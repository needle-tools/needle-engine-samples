import { Behaviour, GameObject, Gizmos, Mathf, RGBAColor, RectTransform, Text, getParam, getWorldPosition, serializable, setWorldPosition } from "@needle-tools/engine";
import { Target } from "./Target";
import { Vector3 } from "three";

const debug = getParam("debugfps");

export class TargetHitPointRenderer extends Behaviour {

    @serializable(Text)
    textTemplate?: Text;

    private _activeTextElements: Text[] = [];
    private _inactiveTextElements: Text[] = [];

    private _baseTextSize: number = 0;

    awake(): void {
        if (this.textTemplate) {
            this.textTemplate.color.alpha = 0;
            this.textTemplate.gameObject.visible = false;
            this._baseTextSize = this.textTemplate.fontSize * .5;
        }
    }

    // Dont generate this method via codegen because then we can not assign it to our UnityEvent
    // and we pass in the method arguments dynamically from typescript
    //@nonSerialized
    onHitTarget(_sender: object, target: Target, count: number) {

        const targetPosition = getWorldPosition(target.gameObject);
        if (debug)
            Gizmos.DrawWireSphere(targetPosition, 1, 0xff0000, 1);

        const text = this.getTextElement();
        
        if (text) {
            this.spawnHitPoint(text, targetPosition, count);
        }

    }

    spawnHitPoint(text: Text, targetPosition: Vector3, count: number) {

        text.text = count.toFixed();
        text.color = this.getRandomColor();
        text.fontSize = Mathf.clamp(this._baseTextSize, this._baseTextSize, this._baseTextSize + 1);
        targetPosition.y += 2;
        setWorldPosition(text.gameObject, targetPosition);
        
        const rt = text.gameObject.getComponent(RectTransform)!;
        targetPosition.x *= -1;
        rt.anchoredPosition.x = targetPosition.x;
        rt.anchoredPosition.y = targetPosition.y;
        
        this._activeTextElements.push(text);

        text.gameObject.visible = true;
        text.color.alpha = 1;
    }

    update(): void {
        for (let i = this._activeTextElements.length - 1; i >= 0; i--) {
            const text = this._activeTextElements[i];
            // const rt = text.gameObject.getComponent(RectTransform)!;
            text.gameObject.position.y -= this.context.time.deltaTime / .5;
            text.color.alpha *= .98;

            if (text.gameObject.position.y > 10/*  || text.color.alpha < .1 */) {
                text.gameObject.visible = false;
                this._activeTextElements.splice(i, 1);
                this._inactiveTextElements.push(text);
            }
        }
    }

    private getTextElement() {
        if (!this.textTemplate) return null;
        if (this._inactiveTextElements.length > 0) {
            return this._inactiveTextElements.pop()!;
        }
        else {
            const clone = GameObject.instantiate(this.textTemplate.gameObject);
            if(clone)
                clone.visible = false;

            const text = clone?.getComponent(Text);
            if (text) {
                return text;
            }
        }
        return null;
    }

    private getRandomColor(): RGBAColor {
        return new RGBAColor(Math.random(), Math.random(), Math.random(), 1);
    }

}