import { serializable } from "@needle-tools/engine";
import { PropertyModule } from "./PropertyModule";
import { Material, Texture, Vector2, sRGBEncoding } from "three";

export class TexturePropertyModule extends PropertyModule {
    @serializable()
    propertyName: string = "map";
  
    @serializable(Texture)
    textures: Texture[] = [];
  
    awake(): void {
      super.awake();
  
      this.textures.forEach((tex) => {
        tex.encoding = sRGBEncoding;
        tex.repeat = new Vector2(1, -1);
      });
    }
  
    public override getSize(): number {
      return this.textures.length;
    }
  
    public override applyState(material: Material, index: number) {
      material[this.propertyName] = this.textures[index];
    }
  }