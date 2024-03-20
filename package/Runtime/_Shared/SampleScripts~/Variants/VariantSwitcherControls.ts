import { VariantInfo } from "./VariantInfo";
import { VariantSwitcher } from './VariantSwitcher';
import { Behaviour, Text, findObjectOfType, getComponent, serializable } from '@needle-tools/engine';

export class VariantSwitcherControls extends Behaviour {
    @serializable(Text)
    label?: Text;

    @serializable(VariantSwitcher)
    switer?: VariantSwitcher;

    onEnable(): void {
        this.switer ??= findObjectOfType(VariantSwitcher, this.context.scene, true)!;
        this.switer?.addEventListener(VariantSwitcher.change, this.onChange);
        this.onChange();
    }
    onDisable(): void {
        this.switer?.removeEventListener(VariantSwitcher.change, this.onChange);
    }

    private onChange = () => {
        if (!this.label) return;

        const obj = this.switer?.objects[this.switer.index];
        if (!obj) return;

        const info = getComponent(obj, VariantInfo);
        const objName = obj.name?.replace(/_/g, " ");
        this.label.text = info?.displayName ?? objName ?? "";
    }

    next() {
        this.switer?.next();
    }

    previous() {
        this.switer?.previous();
    }
}