import { Behaviour, Text, serializable } from "@needle-tools/engine";
import { Configurator } from "./Configurator";

export class ConfiguratorControls extends Behaviour {
  @serializable(Configurator)
  configurator?: Configurator;

  @serializable(Text)
  stateLabel?: Text;

  start(): void {
    this.updateLabel();
    this.configurator?.indexChanged?.addEventListener(() => this.updateLabel());
  }

  public next() {
    this.configurator?.next();
  }

  public previous() {
    this.configurator?.previous();
  }

  updateLabel() {
    if (!this.stateLabel) return;

    if (!this.configurator) this.stateLabel.text = "error";
    else
      this.stateLabel.text = `${this.configurator.currentIndex + 1} / ${
        this.configurator.selectionCount
      }`;
  }
}
