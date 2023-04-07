import {
  Behaviour,
  EventList,
  GameObject,
  serializable,
} from "@needle-tools/engine";

export class Configurator extends Behaviour {
  @serializable()
  loopSelection: boolean = true;

  @serializable()
  autoInitialize: boolean = true;

  @serializable()
  bindToParent: boolean = false;

  @serializable(EventList)
  onShowUnityEvent?: EventList;

  @serializable(EventList)
  onHideUnityEvent?: EventList;

  // @nonSerialized
  public currentIndex: number = 0;

  // @nonSerialized
  public selectionCount: number = 0;

  awake() {
    super.awake();

    // auto subscribe to parent configurator
    if (this.bindToParent) {
      const parentCfg = (
        this.gameObject.parent as GameObject
      )?.getComponentInParent(Configurator);
      if (parentCfg) {
        parentCfg.onShowUnityEvent!.addEventListener(() => this.onShow());
        parentCfg.onHideUnityEvent!.addEventListener(() => this.onHide());
      }
    }
  }

  start() {
    if (this.autoInitialize) this.onShow();
  }

  public next() {
    this.currentIndex += 1;
    if (this.currentIndex >= this.selectionCount) {
      if (this.loopSelection) this.currentIndex = 0;
      else this.currentIndex = this.selectionCount - 1;
    }

    this.applyState();
  }

  public previous() {
    this.currentIndex -= 1;
    if (this.currentIndex < 0) {
      if (this.loopSelection) this.currentIndex = this.selectionCount - 1;
      else this.currentIndex = 0;
    }

    this.applyState();
  }

  public setIndex(index: number) {
    if (index < 0 || index >= this.selectionCount) return;

    this.currentIndex = index;

    this.applyState();
  }

  applyState() {}

  onShow() {
    this.onShowUnityEvent?.invoke();
  }

  onHide() {
    this.onHideUnityEvent?.invoke();
  }
}
