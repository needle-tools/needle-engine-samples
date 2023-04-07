import { GameObject, serializable } from "@needle-tools/engine";
import { Configurator } from "./Configurator";
import { Object3D, Vector3 } from "three";

//TODO: Consider adding Rotation and scale support

export class SyncConfiguratorTransform extends Configurator {
  @serializable(Object3D)
  target?: Object3D;

  override awake(): void {
    super.awake();

    this.autoInitialize = false;

    this.onShowUnityEvent!.addEventListener(() => {
      this.syncPosition();
    });
  }

  private tempVec1 = new Vector3();
  private tempVec2 = new Vector3();
  syncPosition() {
    const go = this.target as GameObject;
    if (!go) return;

    this.gameObject.getWorldPosition(this.tempVec1);
    go.getWorldPosition(this.tempVec2);

    go.position.add(this.tempVec1.sub(this.tempVec2));
  }
}
