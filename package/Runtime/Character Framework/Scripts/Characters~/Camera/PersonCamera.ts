import { Mathf, serializable } from "@needle-tools/engine";

import { Vector3, Vector2, Quaternion, MathUtils, Box3 } from "three";

import { Character } from "../Framework/Character";
import { CharacterCamera } from "./CharacterCamera";
import { CharacterPhysics_Scheme, CommonCharacterInput_Scheme } from "../Framework/CharacterState";

export enum PersonMode {
    FirstPerson,
    ThirdPerson
}

/** Character with first and third person capability */
export class PersonCamera extends CharacterCamera {
    @serializable()
    distance: Vector2 = new Vector2(0.4, 6);

    @serializable()
    startDistance: number = 4;

    @serializable()
    offset: Vector3 = new Vector3();

    //@tooltip Clamp the up-down rotation of the camera
    @serializable()
    xRotClamp: Vector2 = new Vector2(-89, 89);

    @serializable()
    lookSensitivity: number = 4;

    @serializable()
    zoomSensitivity: number = 0.005;

    @serializable()
    enableFOVBoost: boolean = true;

    @serializable()
    sprintFOVSpeed: number = 5;

    @serializable()
    sprintVelocityThreshold: number = 6;

    @serializable()
    thirdPersonFovIncrease: number = 10;

    @serializable()
    thirdPersonFov: number = 60;

    @serializable()
    firstPersonFov: number = 80;

    @serializable()
    zoomSmoothing: number = 10;

    @serializable()
    savePositionOffset: number = 0.5;

    protected x: number = 0;
    protected y: number = 0;

    protected _currentDistance: number = 0;
    protected _currentDistanceGoal: number = 0;

    initialize(character: Character): void {
        super.initialize(character);

        // detach camera
        const parent = this.character.gameObject.parent;
        if (parent && this.cameraObject) {
            this.cameraObject.removeFromParent();
            parent.add(this.cameraObject);
        }

        this.y = this.calculateYRotation(this.character.gameObject);

        this.switchPerson(PersonMode.ThirdPerson);
        this.restoreDefault();
    }

    onDynamicallyConstructed(): void {
        super.onDynamicallyConstructed();
    }

    moduleOnBeforeRender(): void {
        // update origin position for the cam pos calculation
        this.origin.copy(this.character.gameObject.position);

        // garther input
        const inputState = this.frameState as CommonCharacterInput_Scheme;
        let x = inputState.lookDeltaX ?? 0;
        let y = inputState.lookDeltaY ?? 0;
        const scroll = inputState.scrollDeltaY ?? 0;

        if (this.context.isInXR) return;

        this.handleZoom(scroll);
        this.handleLook(x, y);
        this.handleLineOfSight();
        this.handleFOVBoost();
    }

    /** set distance based on scroll input */
    handleZoom(scrollDelta: number) {
        // annul input if in FPS mode
        if (this.person == PersonMode.FirstPerson) {
            // set distance
            this._currentDistance = 0.001;

            // detect desired person
            this._desiredPerson = (scrollDelta > 0) ? PersonMode.ThirdPerson : PersonMode.FirstPerson;
        }
        else if (this.person == PersonMode.ThirdPerson) {
            // add and clamp
            this._currentDistanceGoal += scrollDelta * this.zoomSensitivity;
            this._currentDistanceGoal = Mathf.clamp(this._currentDistanceGoal, this.distance.x, this.distance.y);

            // interpolate
            const t = this.zoomSmoothing * this.context.time.deltaTime;
            this._currentDistance = Mathf.lerp(this._currentDistance, this._currentDistanceGoal, t);

            // detect desired person
            this._desiredPerson = (this._currentDistanceGoal <= this.distance.x) ? PersonMode.FirstPerson : PersonMode.ThirdPerson;
        }
    }

    private tempQua1 = new Quaternion();
    private tempQua2 = new Quaternion();
    private tempVec1 = new Vector3();
    private tempVec2 = new Vector3();
    private refFwd = new Vector3(0, 0, 1);
    private refUp = new Vector3(0, 1, 0);
    private refRight = new Vector3(1, 0, 0);
    /** Move camera based on input */
    handleLook(lookX: number, lookY: number) {
        const dx = -lookY * this.lookSensitivity;
        const dy = -lookX * this.lookSensitivity;

        // add deltas to the state while clamping up-down rotation
        this.x = MathUtils.clamp(this.x + dx, Mathf.toRadians(this.xRotClamp.x), Mathf.toRadians(this.xRotClamp.y));
        this.y += dy;

        if (!this.cameraObject) return;

        // create vector behind the character
        this.tempVec1.set(0, 0, -this._currentDistance);

        // rotated it by the input
        this.tempQua1.setFromAxisAngle(this.refUp, this.y);
        this.tempQua2.setFromAxisAngle(this.refRight, this.x);
        const finalRot = this.tempQua1.multiply(this.tempQua2);
        this.tempVec1.applyQuaternion(finalRot);

        // copy offset
        this.tempVec2.copy(this.offset);
        this.tempVec2.x *= -1; // flip x
        this.tempVec2.applyAxisAngle(this.refUp, this.y); // rotate the offset

        // scale the offset by zoom
        const zoomFactor = Mathf.clamp01(Mathf.inverseLerp(this.distance.x, this.distance.y, this._currentDistance));
        this.tempVec2.x *= zoomFactor;
        this.tempVec2.z *= zoomFactor;

        // add object pos and offset
        this.tempVec1.add(this.origin);
        this.tempVec1.add(this.tempVec2);

        // apply position
        this.cameraObject.position.copy(this.tempVec1);

        // calcualte lookAt direction and apply it
        this.tempVec1.copy(this.origin);
        this.tempVec1.add(this.tempVec2);
        this.cameraObject.lookAt(this.tempVec1);

        // in FPS mode apply rotation to the character as well
        if (this.person == PersonMode.FirstPerson)
            this.character.gameObject.quaternion.setFromAxisAngle(this.refUp, this.y);

        // populate character direction
        const state = this.state as CharacterPhysics_Scheme;
        state.characterDirection ??= new Vector3();

        if (this._person == PersonMode.FirstPerson)
            this.character.gameObject.getWorldDirection(state.characterDirection);
        else if (this._person == PersonMode.ThirdPerson)
            this.cameraObject.getWorldDirection(state.characterDirection);
    }

    /** Adjust camera position if there is something in between the character and camera */
    handleLineOfSight() {
        if (!this.cameraObject || this.person == PersonMode.FirstPerson) return;

        const physics = this.context.physics.engine!;

        // world positions
        const target = this.cameraObject.getWorldPosition(this.tempVec1);
        const origin = this.character.gameObject.getWorldPosition(this.tempVec2);
        origin.y += this.offset.y;

        const distance = target.distanceTo(origin);
        const direction = target.sub(origin).normalize();

        const result = physics.raycast(origin, direction, distance, false);
        if (result) {
            const offsetDir = origin.sub(target).normalize();
            const savePoint = this.tempVec1.copy(result.point);
            savePoint.add(offsetDir.multiplyScalar(this.savePositionOffset));
            this.cameraObject.position.copy(savePoint);

            // TODO: when offset is present, the camera doesn't face the character anymore.
        }
    }

    /** Give better sense of speed by increasing the camera fov */
    handleFOVBoost() {
        if (!this.enableFOVBoost || this.person == PersonMode.FirstPerson) return;

        const physicsState = this.state as CharacterPhysics_Scheme;
        const speed = physicsState.characterSpeed ?? 0;
        const deltaTime = this.context.time.deltaTime;

        const sprintFOV = this.thirdPersonFov + this.thirdPersonFovIncrease;
        const target = speed > this.sprintVelocityThreshold ? sprintFOV : this.thirdPersonFov;

        if (this.camera)
            this.camera.fieldOfView = Mathf.lerp(this.camera.fieldOfView ?? this.thirdPersonFov, target, this.sprintFOVSpeed * deltaTime);
    }

    protected _person: PersonMode = PersonMode.FirstPerson;
    /** Current person mode that is active */
    get person(): PersonMode { return this._person; }

    protected _desiredPerson: PersonMode = PersonMode.FirstPerson;
    /** Person mode that the camera would like to be in */
    get desiredPerson(): PersonMode { return this._desiredPerson; }

    /** Switch between FPS and TPS */
    switchPerson(mode: PersonMode) {
        this._currentDistanceGoal = mode == PersonMode.FirstPerson ? 0.001 : this.distance.x + 0.05;
        this._desiredPerson = this._person = mode;
        if (this.camera)
            this.camera.fieldOfView = mode == PersonMode.FirstPerson ? this.firstPersonFov : this.thirdPersonFov;
    }

    /** Manually reset the state to desired default */
    restoreDefault() {
        this.y = this.calculateYRotation(this.character.gameObject);
        this._currentDistance = this._currentDistanceGoal = this.startDistance;
    }
}
