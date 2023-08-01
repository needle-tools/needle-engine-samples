import { Behaviour, GameObject, OrbitControls, getWorldPosition, getWorldQuaternion, serializable, setWorldPosition, setWorldQuaternion } from "@needle-tools/engine";
import { Euler, MathUtils, Quaternion, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

export class PencilData extends Behaviour {

    @serializable(GameObject)
    moveable: GameObject;

    private pointerDown;
    private pointerMove;
    private pointerUp;

    private orbit: OrbitControls;
    
    start() {
        this.pointerDown = this.onPointerDown.bind(this);
        this.pointerMove = this.onPointerMove.bind(this);
        this.pointerUp = this.onPointerUp.bind(this);

        document.addEventListener("pointerdown", this.pointerDown);
        document.addEventListener("pointermove", this.pointerMove);
        document.addEventListener("pointerup", this.pointerUp);

        this.orbit = GameObject.findObjectOfType(OrbitControls)!;
    }

    onEnable(): void {
        getWorldPosition(this.gameObject, this._wp);
        getWorldQuaternion(this.gameObject, this._wr);
    }

    onPointerDown(event: PointerEvent) {
        if (event.pointerType === "pen") {
            this.orbit.enabled = false;
        }
    }      

    onPointerUp(event: PointerEvent) {
        if (event.pointerType === "pen") {
            this.orbit.enabled = true;
        }
    } 

    _wp = new Vector3();
    _wr = new Quaternion();
    _pressure = 0;

    _rotationOffset = new Quaternion().setFromEuler(new Euler(MathUtils.degToRad(90), MathUtils.degToRad(180), 0));
    onPointerMove(event: PointerEvent) {
        // is this a pen?
        if (event.pointerType !== "pen") return;

        console.log(event.height, event.pressure, event.tiltX, event.tiltY, event.twist, event.width);

        // convert tiltX, tiltY and twist to a quaternion
        const quaternion = new Quaternion();
        let normalizedTiltX = MathUtils.degToRad(event.tiltY);
        let normalizedTiltY = MathUtils.degToRad(event.tiltX);            

        quaternion.setFromEuler(new Euler(normalizedTiltX, normalizedTiltY, MathUtils.degToRad(event.twist)));
        const camera = this.context.mainCamera!;
        quaternion.premultiply(camera.quaternion.clone());
        quaternion.multiply(this._rotationOffset);
        this._wr.copy(quaternion);

        const inCamerSpaceX = (event.clientX / this.context.domElement.clientWidth) * 2 - 1;
        const inCamerSpaceY = -(event.clientY / this.context.domElement.clientHeight) * 2 + 1;
        this._pressure = MathUtils.lerp(this._pressure, event.pressure, this.context.time.deltaTime * 1);
        const pressureDistance = MathUtils.lerp(0.95, 0.55, this._pressure);
        const vector = new Vector3( inCamerSpaceX, inCamerSpaceY, pressureDistance ).unproject( camera );
        this._wp.copy(vector);

        // set orbit center
        this.orbit.setTarget(vector);
    }
    
    lateUpdate() {
        const currentWp = getWorldPosition(this.gameObject);
        const currentWr = getWorldQuaternion(this.gameObject);

        const dt = this.context.time.deltaTime * 35;
        // const dtPressure = MathUtils.clamp(this.context.time.deltaTime * 5 / (1 - (1 - this._pressure) + 0.05), 0, 1);
        const dtPressure = this.context.time.deltaTime * 25;

        setWorldPosition(this.gameObject, currentWp.lerp(this._wp, dt));
        setWorldQuaternion(this.gameObject, currentWr.slerp(this._wr, dtPressure));

        // using pressure for movement
        // const p = this.moveable.position;
        // this.moveable.position.set(p.x, MathUtils.lerp(p.y, -this._pressure * 0.6, dt), p.z);
    }

}