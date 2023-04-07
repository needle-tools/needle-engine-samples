import { Behaviour } from "@needle-tools/engine";
import { Material } from "three";

export class PropertyModule extends Behaviour {
  public getSize(): number {
    return 0;
  }
  public applyState(_material: Material, _index: number): void {}
}