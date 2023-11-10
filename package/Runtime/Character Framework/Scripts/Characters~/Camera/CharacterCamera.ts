import { Camera, ClearFlags, GameObject, IComponent, serializable } from "@needle-tools/engine";
import { Object3D, Vector3, PerspectiveCamera } from "three";
import { CharacterModule, CharacterModuleType } from "../Framework/CharacterModule";
import { Character } from "../Framework/Character";

/** basic character camera that can construct itself */
export class CharacterCamera extends CharacterModule {

    get Type() { return CharacterModuleType.camera; }

    @serializable(Camera)
    camera?: Camera;

    protected cameraObject?: Object3D;
    protected origin: Vector3 = new Vector3();

    initialize(character: Character): void {
        super.initialize(character);

        this.camera ??= this.gameObject.getComponentInChildren(Camera)!;
        this.cameraObject ??= this.camera?.gameObject;
        if (this.cameraObject) {
            this.origin.copy(this.cameraObject.position);
        }

        if (this.character.isLocalPlayer)
            this.context.setCurrentCamera(this.camera);

        this.character.onRoleChanged.addEventListener(this.onRoleChanged);
    }

    onDestroy(): void {
        this.character?.onRoleChanged?.removeEventListener(this.onRoleChanged);
    }

    private onRoleChanged = (isLocalPlayer: boolean) => {
        // hide camera when not a local player
        if (this.cameraObject) {
            this.cameraObject.visible = isLocalPlayer;
        }
    }

    onDynamicallyConstructed(): void {
        // create camera if not present
        let cam = this.gameObject.getComponentInChildren(Camera);
        if (!cam) {
            const camObj = new PerspectiveCamera();
            camObj.userData.tag = "mainCamera";

            cam = GameObject.addNewComponent(camObj, Camera);

            // Add 180° rotation to correct the flipped Z (?)
            camObj.rotateZ(Math.PI);

            cam.name = "Character Camera (Dynamically Constructed)";
            cam.clearFlags = ClearFlags.Skybox;
            cam.cullingMask = -1;
            cam.nearClipPlane = 0.01;
            cam.farClipPlane = 150;
            cam.fieldOfView = 60;

            // TODO: replace upward search for a component for soureceId to get skybox working
            this.gameObject.traverseAncestors(x => {
                const components = x.userData.components as IComponent[];
                if (!components) return false;
                const comp = components.find(y => y.sourceId);
                if (comp) {
                    cam!.sourceId = comp.sourceId;
                    return true; // stop traversing
                }
                return false;
            });

            cam.buildCamera();

            this.gameObject.add(camObj);
        }

        this.camera = cam;
        this.origin.copy(cam.gameObject.position);
        this.cameraObject = cam.gameObject;
    }

    protected calculateYRotation(object: Object3D): number {
        //adjust Y to reflect the current rotation
        const charFwd = object.getWorldDirection(new Vector3());
        charFwd.y = 0; // flatten
        charFwd.normalize();

        // calculate signed angle
        const sign = _right.dot(charFwd) > 0 ? 1 : -1;
        return _forward.angleTo(charFwd) * sign;
    }
}

const _forward = new Vector3(0, 0, 1);
const _right = new Vector3(1, 0, 0);