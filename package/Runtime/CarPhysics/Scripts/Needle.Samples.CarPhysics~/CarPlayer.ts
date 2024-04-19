import { AssetReference, Gizmos, ParticleSystem, Player, destroy, getTempVector, instantiate, serializable } from "@needle-tools/engine";
import { Object3D } from "three";
import { CarKeyControls } from "./Input/CarKeyControls";
import { CarPhysics } from "./Physics/CarPhysics";
import { CarInput_Scheme } from "./Input/CarInput_Scheme";
import { CarWheel } from "./Physics/CarWheel";
import { CarAxle } from "./Physics/CarAxle";

export class CarPlayer extends Player {
    get inputData() { return this.frameData as CarInput_Scheme; }

    @serializable()
    autoSetupWheels: boolean = true;

    @serializable(Object3D)
    wheelModels: Object3D[] = []

    @serializable(Object3D)
    wheelPrefab?: Object3D;

    protected phyiscs!: CarPhysics;

    awake(): void {
        super.awake();
        if(this.wheelPrefab)
            this.wheelPrefab.visible = false;
    }

    protected async initialize(findModules?: boolean) {
        if (this.autoSetupWheels && this.wheelPrefab) {
            const wheels: CarWheel[] = [];
            this.wheelModels.forEach(model => {
                const wheelObj = instantiate(this.wheelPrefab!);
                if (!wheelObj) return;

                wheelObj.visible = true;

                const wheel = wheelObj?.getComponent(CarWheel);
                if (!wheel) return;

                const wPos = model.getWorldPosition(getTempVector());

                wheel.wheelModel = model;
                wheel.worldPosition = wPos;
                wheels.push(wheel);
            });

            //this.wheelPrefab.remove(); //?
            destroy(this.wheelPrefab, true, false);

            // setup axles
            const numOfFrontWheels = wheels.length > 3 ? 2 : 1;
            const frontToBackWheels = wheels.sort((a, b) => b.gameObject.position.z - a.gameObject.position.z);

            const frontWheels = frontToBackWheels.slice(0, numOfFrontWheels);
            frontWheels.forEach(x => x.axle = CarAxle.front);

            const backWheels = frontToBackWheels.slice(numOfFrontWheels);
            backWheels.forEach(x => x.axle = CarAxle.rear);
        }

        this.phyiscs = this.ensureModule(CarPhysics);
        this.ensureModule(CarKeyControls);

        super.initialize(findModules);
    }

    update() {
        super.update();
        if (!this.isInitialized) return;

        this.phyiscs.accelerationInput(this.inputData.throttle ?? 0);
        this.phyiscs.steerInput(this.inputData.steer ?? 0);

        if (this.inputData.reset ?? false) {
            this.phyiscs.reset();
        }
    }
}