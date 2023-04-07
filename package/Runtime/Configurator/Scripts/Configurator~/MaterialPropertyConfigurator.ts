import { Renderer, serializable } from "@needle-tools/engine";
import { Configurator } from "./Configurator";
import { Material } from "three";
import { PropertyModule } from "./Material-property-modules/PropertyModule";

export class MaterialPropertyConfigurator extends Configurator {
  @serializable(Renderer)
  renderer?: Renderer;

  @serializable()
  materialIndex: number = 0;

  @serializable(PropertyModule)
  module?: PropertyModule;

  private material?: Material;

  override awake(): void {
    super.awake();

    if (this.module) this.selectionCount = this.module.getSize();

    if(!this.renderer)
        return;

    if(this.materialIndex >= 0 && this.materialIndex < this.renderer.sharedMaterials.length) {
        this.material = this.renderer.sharedMaterials[this.materialIndex];
    }
  }

  override onShow() {
    this.applyState();
  }

  override onHide() {
    // no need to do anything here
  }

  override applyState() {
    if (
      this.renderer == null ||
      this.module == null ||
      this.currentIndex >= this.selectionCount
    )
      return;

    // if the material instance is out of date?
    if(this.material != null && this.renderer.sharedMaterials[this.materialIndex] !== this.material)
        this.material = this.renderer.sharedMaterials[this.materialIndex];

    if(this.material)
        this.module.applyState(this.material, this.currentIndex);
  }
}
