import { ActionBuilder, BehaviorExtension, BehaviorModel, Behaviour, Button, EventList, RectTransform, TriggerBuilder, USDObject, USDZExporterContext, UsdzBehaviour, getOrAddComponent, serializable } from "@needle-tools/engine";
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

    protected _allTargets: Object3D[] = [];
    protected _allTriggers: Object3D[] = [];

    awake(): void {
        // HACK: RectTransform is a component and is not matching Object3D. 
        // IF the type in Unity is GameObject instead of Transform, then the serialization doesn't work.
        // TODO: make small repro and report
        const patchRectTransforms = (arr: Object3D[]) => {
            for (let i = 0; i < arr.length; i++) {
                const element = arr[i] as any;
                if (element instanceof RectTransform) {
                    arr[i] = element.gameObject;
                }
            }
        };
        this.elements.forEach(e => {
            patchRectTransforms(e.contents);
            patchRectTransforms(e.triggers);
        });
        
        // clean up null / editorOnly entires
        this.elements.forEach(e => {
            e.contents = e.contents.filter(x => x);
            e.triggers = e.triggers.filter(x => x);
        });
            
            console.log(this.elements);

        this.elements.forEach(e => e.contents?.forEach(t => this._allTargets.push(t)));
        this.elements.forEach(e => e.triggers?.forEach(t => this._allTriggers.push(t)));

        this.setupForRuntime();
    }
    
    // Runtime flow
    protected setupForRuntime() {
        this.elements.forEach((element, i1) => {
            //console.log(`Variant ${i1}: `, element);
            element.triggers?.forEach((trigger, i2) => {
                //console.log(`Trigger ${i2}: `, trigger);
                const btn = getOrAddComponent(trigger, Button);  
                btn.onClick ??= new EventList();
                btn.onClick.addEventListener(() => {
                    console.log("Clicked");
                    //console.log("Clicked: ", trigger.name);
                    this._allTargets.forEach(target => { 
                        target.visible = element.contents.includes(target);
                    })
                });
            });
        });

        this.selectDefault();
    }

    protected selectDefault() {
        const defaultElem = this.elements.at(0);
        if (defaultElem) {
            this._allTargets.forEach(target => {
                target.visible = defaultElem.contents.includes(target);
            });
        }
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

    afterCreateDocument(_ext: BehaviorExtension, _context: USDZExporterContext) {
        this._allTargets.forEach(target => {
            target.visible = false;
        });

        this.selectDefault();
    }

    // TODO: ActionBuilder.parallel (?)
    protected setupForUSDZ(ext: BehaviorExtension) {
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

        const defaultVar = this.elements.at(0);
        if (defaultVar) {
            const defaultTargets = defaultVar.contents;
            console.log("To leave out: ", defaultTargets.map(x => x.name));

            const hideOnStart = this._cloneArray(this._allTargets).filter(t => !defaultTargets.includes(t));
            console.log("To hide: ", hideOnStart.map(x => x.name));

            ext.addBehavior(new BehaviorModel(`HideOnStart_${this.guid}`, TriggerBuilder.sceneStartTrigger(), ActionBuilder.fadeAction(hideOnStart, 0, false)));
        }
    }

    private _cloneArray<T extends object>(array: T[]): T[] {
        const newArray = new Array<T>(array.length);
        array.forEach((v, i) => newArray[i] = v);
        return newArray;
    }
}