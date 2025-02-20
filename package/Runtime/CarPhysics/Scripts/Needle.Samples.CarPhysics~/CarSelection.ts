import { Behaviour, GameObject, serializable } from "@needle-tools/engine";
import { CarController } from "./CarController";



export class CarSelection extends Behaviour {

    @serializable(CarController)
    cars?: CarController[]

    start(): void {
        if (!this.cars?.length) {
            this.cars = [...GameObject.findObjectsOfType(CarController)];
        }
        if (this.cars.length > 0) {
            this.selectCar(0);
        }
    }
    onEnable(): void {
        this.context.input.addEventListener("keyup", this.onKey);
    }
    onDisable(): void {
        this.context.input.removeEventListener("keyup", this.onKey);
    }
    private onKey: (evt: KeyboardEvent) => void = (evt) => {
        const index = parseInt(evt.key) - 1;
        if (index >= 0 && index < this.cars!.length) {
            this.selectCar(index);
        }
    };
    private selectCar(index: number) {
        for (const car of this.cars!) {
            car.enabled = false;
        }
        const ctrl = this.cars![index];
        if (ctrl) {
            ctrl.enabled = true;
        }
    }

}