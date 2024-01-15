import { Rigidbody } from "@needle-tools/engine";
import { GameObject } from "@needle-tools/engine";
import { AssetReference, Behaviour, serializable } from "@needle-tools/engine";
import { Vector2, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

class RaceCar {
    @serializable(AssetReference)
    model: AssetReference; 

    @serializable()
    speed: number = 0;

    @serializable()
    name: string = "";

    @serializable()
    controls: string = "WASD";
}

export class RaceCarManager extends Behaviour {     

    @serializable(RaceCar)
    cars: RaceCar[]; 
    
    async start() {
        console.log("Race Cars", this.cars);

        // create cars and make them go brrrrr
        for (let i = 0; i < this.cars.length; i++) {
            const car = this.cars[i];
            const carObject = await car.model.instantiate();
            if (!carObject) throw new Error("Car model not found");
            
            carObject.worldPosition = new Vector3(i * 2.5, 0, 0);
            
            // if there's already a RaceCarMovement component, use it, otherwise add one
            let carMovement = carObject.getComponent(RaceCarMovement);
            if (!carMovement) {
                carMovement = new RaceCarMovement();
                (carObject as GameObject).addComponent(carMovement);
            }
            carMovement.speed = car.speed;
            carMovement.controls = car.controls;
            
            // add to the scene
            this.context.scene.add(carObject);
            GameObject.setActive(carObject, true);
        }
    }
}

export class RaceCarMovement extends Behaviour {
    @serializable()
    speed: number = 0;

    @serializable()
    turnSpeed: number = 5;

    private controlKeys: string[] = [];
    private smoothedAxis: Vector2 = new Vector2();

    // assign a basic control scheme – we're just making sure here that keys start with "Key"
    // @nonSerialized
    set controls(value: string) {
        if(value.length == 4)
            // something like "WASD"
            this.controlKeys = value.split("");
        else
            // something like "ArrowUp ArrowRight ArrowDown ArrowLeft"
            this.controlKeys = value.split(" ");

        for (let i = 0; i < this.controlKeys.length; i++) {
            let key = this.controlKeys[i];
            if (key.length === 1)
                key = "Key" + key.toUpperCase();
            this.controlKeys[i] = key;
        }
    }

    private static upAxis: Vector3 = new Vector3(0, 1, 0);
    update() {
        // collect inputs
        const Y = this.context.input.isKeyPressed(this.controlKeys[0]);
        const Y_ = this.context.input.isKeyPressed(this.controlKeys[2]);
        const X = this.context.input.isKeyPressed(this.controlKeys[1]);
        const X_ = this.context.input.isKeyPressed(this.controlKeys[3]);

        const xAxis = (X ? 1 : 0) + (X_ ? -1 : 0);
        const yAxis = (Y ? 1 : 0) + (Y_ ? -1 : 0);

        // smooth inputs
        this.smoothedAxis.lerp(new Vector2(xAxis, yAxis), this.context.time.deltaTime * 2);

        // move forward and turn according to inputs
        this.gameObject.worldPosition = this.gameObject.worldPosition
            .add(this.gameObject.worldForward
                .multiplyScalar(
                    this.smoothedAxis.y * this.speed * this.context.time.deltaTime));
        this.gameObject.rotateOnWorldAxis(
            RaceCarMovement.upAxis, 
            this.smoothedAxis.x * this.turnSpeed * this.context.time.deltaTime);
    }
}