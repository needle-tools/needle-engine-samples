import { Renderer, serializable } from "@needle-tools/engine";
import { Configurator } from "./Configurator";
import { Material } from "three";

export class MaterialConfigurator extends Configurator {
  @serializable(Renderer)
  renderer?: Renderer;

  @serializable()
  materialIndex: number = 0;

  @serializable()
  materials: Material[] = [];

  awake(): void {
    super.awake();

    this.selectionCount = this.materials.length;
  }

  onShow() {
    this.applyState();
  }

  onHide() {
    // no need to do anything here
  }

  applyState() {
    if (this.renderer == null) return;

    const material = this.materials[this.currentIndex];

    if (this.renderer.sharedMaterials.length > this.materialIndex)
      this.renderer.sharedMaterials[this.materialIndex] = material;
    else
      console.error(
        `MaterialConfigurator (${this.name}): material index out of bounds (${this.materialIndex}) - ${this.renderer.sharedMaterials.length}`
      );
  }
}
