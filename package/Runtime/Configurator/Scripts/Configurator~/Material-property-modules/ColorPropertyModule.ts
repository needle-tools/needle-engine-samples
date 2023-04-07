import { serializable } from "@needle-tools/engine";
import { PropertyModule } from "./PropertyModule";
import { Color, Material } from "three";

export class ColorPropertyModule extends PropertyModule {
    @serializable()
    propertyName: string = "color";
  
    @serializable(Color)
    colors: Color[] = [];
  
    public override getSize(): number {
      return this.colors.length;
    }
  
    public override applyState(material: Material, index: number) {
      console.log(material);
      material[this.propertyName] = this.colors[index];
      material.needsUpdate = true;
    }
  }