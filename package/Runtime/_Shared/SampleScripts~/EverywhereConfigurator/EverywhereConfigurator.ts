import { ActionBuilder, BehaviorExtension, BehaviorModel, Behaviour, Button, EventList, RectTransform, TriggerBuilder, USDObject, USDZExporterContext, UsdzBehaviour, delayForFrames, getOrAddComponent, serializable } from "@needle-tools/engine";
import { Object3D } from "three";

class EverywhereConfiguratorElement {
    @serializable(Object3D)
    contents: Object3D[] = [];

    @serializable(Object3D)
    negativeContents: Object3D[] = [];

    @serializable(Object3D)
    triggers: Object3D[] = [];
}

export class EverywhereConfigurator extends Behaviour implements UsdzBehaviour{
    @serializable(EverywhereConfiguratorElement)
    elements: EverywhereConfiguratorElement[] = [];

    @serializable()
    fadeDuration: number = 0.2;

    @serializable()
    selectFirstOnStart: boolean = true;

    private _allTargets: Object3D[] = [];
    private _allTriggers: Object3D[] = [];

    private _currentIndex: number | undefined;
    //@nonSerialized
    get currentIndex() { return this._currentIndex; }

    private get defaultVariant(): EverywhereConfiguratorElement | undefined {
        const firstOrNone = this.selectFirstOnStart ? this.elements.at(0) : undefined;
        const defaultVariant = this._currentIndex !== undefined ? this.elements.at(this._currentIndex) : firstOrNone;
        return defaultVariant;
    }

    awake(): void {        
        // clean up null / editorOnly entires
        this.elements.forEach(e => {
            e.contents = e.contents.filter(x => x);
            e.triggers = e.triggers.filter(x => x);
        });

        this.elements.forEach(e => e.contents?.forEach(t => this._allTargets.push(t)));
        this.elements.forEach(e => e.triggers?.forEach(t => this._allTriggers.push(t)));

        this.setupForRuntime();
    }
    
    // Runtime flow
    private setupForRuntime() {
        this.elements.forEach((element, index) => {
            element.triggers?.forEach((trigger) => {
                const btn = getOrAddComponent(trigger, Button);  
                btn.onClick ??= new EventList();
                btn.onClick.addEventListener(() => {
                    this._currentIndex = index;
                    this._allTargets.forEach(target => { 
                        target.visible = element.contents.includes(target);
                    })
                });
            });
        });

        this.selectDefault();
    }

    private selectDefault() {
        const toEnable = this.defaultVariant?.contents ?? [];
        this._allTargets.forEach(target => {
            target.visible = toEnable.includes(target);
        });
    }
    
    // USDZ flow
    createBehaviours(ext: BehaviorExtension, _model: USDObject, _context: USDZExporterContext) {
        if (_model.uuid === this.gameObject.uuid) {
            this.setupForUSDZ(ext);
        }
    }

    beforeCreateDocument(_ext: BehaviorExtension, _context: USDZExporterContext) {
        // Activate all targets, since otherwise they get ignored by the exporter
        this._allTargets.forEach(target => {
            target.visible = true;
        });
    }

    async afterSerialize(_ext: BehaviorExtension, _context: USDZExporterContext) {
        await delayForFrames(3);
        this.selectDefault();
    }

    // TODO: ActionBuilder.parallel (?)
    private setupForUSDZ(ext: BehaviorExtension) {
        this.elements.forEach(element => { 
            element.triggers?.forEach(trigger => {
                const enableTargets = element.contents;
                const disableTargets = this._cloneArray(this._allTargets).filter(t => !enableTargets.includes(t));

                if (enableTargets.length >= 0) {
                    ext.addBehavior(new BehaviorModel(`EnableObject_${trigger.uuid}`, TriggerBuilder.tapTrigger(trigger), ActionBuilder.fadeAction(enableTargets, this.fadeDuration, true)));
                }
                if (disableTargets.length >= 0) {
                    ext.addBehavior(new BehaviorModel(`DisableObject_${trigger.uuid}`, TriggerBuilder.tapTrigger(trigger), ActionBuilder.fadeAction(disableTargets, this.fadeDuration, false)))
                }
            });
        });

        // disable everything besides start state
        const toEnable = this.defaultVariant?.contents ?? [];
        const hideOnStart = this._cloneArray(this._allTargets).filter(t => !toEnable.includes(t));
        ext.addBehavior(new BehaviorModel(`HideOnStart_${this.guid}`, TriggerBuilder.sceneStartTrigger(), ActionBuilder.fadeAction(hideOnStart, 0, false)));
    }

    private _cloneArray<T extends object>(array: T[]): T[] {
        const newArray = new Array<T>(array.length);
        array.forEach((v, i) => newArray[i] = v);
        return newArray;
    }
}