import { Configurator } from "./Configurator";

export class ConfigurationElement extends Configurator {
  awake(): void {
    this.autoInitialize = false;
    super.awake();
  }
}
