import { Behaviour, Camera, findObjectOfType, GameObject, getComponentInChildren, getComponentInParent, PointerEventData, serializable, SmoothFollow } from "@needle-tools/engine";
import { CarController } from "./CarController";
import { CarTouchControls } from "./CarTouchControls";
import { CarPhysics } from "./CarPhysics";



export class CarSelection extends Behaviour {

    @serializable(Camera)
    cameraRig: Camera | null = null;

    @serializable(CarController)
    cars?: CarController[];


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
        this.context.domElement.addEventListener("click", this.onClick);
    }
    onDisable(): void {
        this.context.input.removeEventListener("keyup", this.onKey);
        this.context.domElement.removeEventListener("click", this.onClick);
    }

    private gamepadButtonDown = false;
    update(): void {
        const gamepad = navigator.getGamepads()?.[0];
        if (gamepad) {
            const yButton = gamepad.buttons?.[3];
            if (yButton?.pressed) {
                if (!this.gamepadButtonDown) {
                    this.gamepadButtonDown = true;
                    const active = this.cars!.find(car => car.activeAndEnabled);
                    if (active) {
                        const activeIndex = active ? this.cars!.indexOf(active) : -1;
                        const nextIndex = (activeIndex + 1) % this.cars!.length;
                        this.selectCar(nextIndex);
                    }
                }
            }
            else if (this.gamepadButtonDown) {
                this.gamepadButtonDown = false;
            }
        }
    }

    private onKey: (evt: KeyboardEvent) => void = (evt) => {
        const index = parseInt(evt.key) - 1;
        if (index >= 0 && index < this.cars!.length) {
            this.selectCar(index);
        }
    };
    private onClick = (_evt: Event) => {
        if (!this.cars?.length) return;

        if (_evt instanceof MouseEvent) {
            if (_evt.button != 0) return;
        }

        const hits = this.context.physics.raycast();
        if (hits.length) {
            const car = hits[0]?.object.getComponentInParent(CarController);
            const index = car ? this.cars!.indexOf(car) : -1;
            if (index >= 0) {
                this.selectCar(index);
            }

        }
    }


    private selectCar(index: number) {
        for (const car of this.cars!) {
            car.enabled = false;
        }
        const car = this.cars![index];
        if (car) {
            car.enabled = true;

            const touchControls = findObjectOfType(CarTouchControls);
            if(touchControls) {
                touchControls.carPhysics = car.gameObject.getComponentInChildren(CarPhysics) || undefined;
            }

            const camera = car.gameObject.getComponentInChildren(Camera);
            if (camera) {
                this.context.setCurrentCamera(camera);
            }
            else if (this.cameraRig) {
                this.context.setCurrentCamera(this.cameraRig);
                const smoothfollow = this.cameraRig.gameObject.getComponentInParent(SmoothFollow);
                if (smoothfollow) {
                    smoothfollow.target = car.gameObject;
                }
            }
        }
    }

}