import {
  Behaviour,
  EventList,
  GameObject,
  serializable,
  syncField,
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
  @syncField(Configurator.prototype.onIndexChanged)
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
    this.setIndex(this.currentIndex + 1);
  }

  public previous() {
    this.setIndex(this.currentIndex - 1);
  }

  public setIndex(index: number) {
    if(index < 0) index = this.selectionCount - 1;
    this.currentIndex = index % this.selectionCount;
    this.applyState();
  }

  applyState(){}

  onShow() {
    this.onShowUnityEvent?.invoke();
  }

  onHide() {
    this.onHideUnityEvent?.invoke();
  }

  // called from syncField, we do this here because applyState is overriden by subclasses
  // and this way syncField is calling the overriden methods
  private onIndexChanged(){
    this.applyState();
  }
}
