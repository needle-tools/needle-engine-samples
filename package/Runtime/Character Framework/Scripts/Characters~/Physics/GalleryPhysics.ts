import { Vector2, Vector3 } from "three";
import { CharacterModule, CharacterModuleType } from "../Framework/CharacterModule";
import { Mathf, serializable, setWorldPosition } from "@needle-tools/engine";
import { GalleryInput_Scheme } from "../Input/GalleryInput";

export class GalleryPhysics extends CharacterModule {
    get Type(): CharacterModuleType { return CharacterModuleType.physics; }

    @serializable()
    maxRaycastDistance: number = 20;

    @serializable()
    positionSmoothing: number = 3;

    @serializable()
    maxSlope: number = 45;

    private targetPosition: Vector3 = new Vector3();

    start(): void {
        this.targetPosition.copy(this.worldPosition);
    }

    moduleUpdate(): void {
        const cam = this.context.mainCamera!;
        const state = this.frameState as GalleryInput_Scheme;

        // has clicked to teleport
        if (state.hasClicked === true) {
            const pos = state.pointerPositionRC ?? new Vector2();
            const worldPos = this.getSafeTargetFromPointer(cam, pos);
            this.targetPosition.copy(worldPos); // set target
        }

        // transition current pos to target
        this.updatePosition();
    }

    private tempPos = new Vector3();
    // TODO: add sine out easing
    /** transition current world position to target position */
    updatePosition() {
        this.tempPos.copy(this.worldPosition);
        this.tempPos.lerp(this.targetPosition, this.positionSmoothing * this.context.time.deltaTime);
        setWorldPosition(this.character.gameObject, this.tempPos);
    }

    private tempVec1 = new Vector3();
    private tempVec2 = new Vector3();
    private tempVec3 = new Vector3();
    private refUp = new Vector3(0, 1, 0);
    // TODO: calculate if camera would collide into something
    // TODO: add case when user clicks on a wall -> Move infront of it, not into it
    /** Calcualte safe world position from screen point  */
    getSafeTargetFromPointer(camera: THREE.Camera, screenPositionRC: Vector2): Vector3 {
        // calculate world position of pointer in depth 1 from camera
        this.tempVec1.set(screenPositionRC.x, screenPositionRC.y, -1).unproject(camera);

        // get camera world position
        camera.getWorldPosition(this.tempVec2);

        // calcualte direction from camera to pointer
        this.tempVec3.copy(this.tempVec1).sub(this.tempVec2).normalize();

        // get target
        const result = this.context.physics.engine?.raycastAndGetNormal(this.tempVec2, this.tempVec3, this.maxRaycastDistance, true);
        if (result && result.normal) {
            const angle = this.refUp.angleTo(result.normal);
            if(angle > Mathf.Deg2Rad * this.maxSlope)
                return this.worldPosition; // too steep
            else
                return result.point; // use hit result
        }
        else { // no hit, return current position
            return this.worldPosition;
        }
    }
}