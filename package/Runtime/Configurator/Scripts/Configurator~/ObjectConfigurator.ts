import { GameObject, serializable } from "@needle-tools/engine";
import { Configurator } from "./Configurator";

export class ObjectConfigurator extends Configurator {
  @serializable()
  autoDetectChildren: boolean = true;

  objects: Configurator[] = [];

  awake() {
    super.awake();

    if (this.autoDetectChildren) {
      this.gameObject.children.forEach((child) => {
        const cfg = (child as GameObject)?.getComponent(Configurator);
        if (cfg) {
          this.objects.push(cfg);
        }
      });
    }

    this.selectionCount = this.objects.length;
  }

  override onShow() {
    this.applyState();
    super.onShow();
  }

  override onHide() {
    super.onHide();
  }

  override applyState() {
    let toEnable: Configurator | null = null;

    for (let i = 0; i < this.objects.length; i++) {
      const obj = this.objects[i];

      if (i == this.currentIndex) toEnable = obj;
      else if (obj.gameObject.activeSelf) {
        GameObject.setActive(obj.gameObject, false);
        obj.gameObject.getComponent(Configurator)?.onHide();
      }
    }

    if (toEnable) {
      GameObject.setActive(toEnable.gameObject, true);
      toEnable.onShow();
    }
  }
}
