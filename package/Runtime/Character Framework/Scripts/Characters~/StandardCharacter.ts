import { SyncedTransform, serializable } from "@needle-tools/engine";

import { Character } from "./Framework/Character";
import { CharacterPhysics, CharacterPhysics_MovementMode } from "./Physics/CharacterPhysics";
import { DesktopCharacterInput } from "./Input/DesktopCharacterInput";
import { MobileCharacterInput } from "./Input/MobileCharacterInput";
import { PersonCamera, PersonMode } from "./Camera/PersonCamera";
import { CommonAvatar } from "./Misc/CommonAvatar";
import { CommonCharacterAudio } from "./Misc/CommonCharacterAudio";
import { CommonCharacterAnimations } from "./Misc/CommonCharacterAnimations";

/** Character that support FPS and TPS modes */
export class StandardCharacter extends Character {
    @serializable()
    defaultPerson: PersonMode = PersonMode.ThirdPerson;

    // TODO: change to flags
    @serializable()
    allowedPersons: PersonMode[] = [PersonMode.FirstPerson, PersonMode.ThirdPerson];

    @serializable()
    overrideModuleSettings: boolean = true;

    @serializable()
    movementSpeed: number = 5;

    @serializable()
    jumpSpeed: number = 5;

    @serializable()
    headHeight: number = 1.6;

    @serializable()
    headSide: number = 1;

    @serializable()
    enableSprint: boolean = true;

    protected camera?: PersonCamera;
    protected physics?: CharacterPhysics;
    protected avatar?: CommonAvatar;
    protected audio?: CommonCharacterAudio;
    protected animation?: CommonCharacterAnimations;

    awake(): void {
        super.awake();

        this.camera = this.ensureModule(PersonCamera);
        this.physics = this.ensureModule(CharacterPhysics);
        this.ensureModule(DesktopCharacterInput);
        this.ensureModule(MobileCharacterInput);
        this.avatar = this.gameObject.getComponentInChildren(CommonAvatar)!;
        this.audio = this.gameObject.getComponentInChildren(CommonCharacterAudio)!;
        this.animation = this.gameObject.getComponentInChildren(CommonCharacterAnimations)!;
    }

    intialize(findModules?: boolean): void {
        super.intialize(findModules);

        // locate SyncedTransform and request ownership on local player
        if (this.isLocalPlayer)
            this.gameObject.getComponent(SyncedTransform)?.requestOwnership();

        // simple settings
        if (this.overrideModuleSettings) {
            if (this.physics) {
                this.physics.movementSpeed = this.movementSpeed * 5.6;
                this.physics.desiredAirbornSpeed = this.jumpSpeed * 1;
                this.physics.jumpSpeed = this.jumpSpeed * 2;
                if(!this.enableSprint)
                    this.physics.sprintModifier = 1;
            }

            if(this.camera) {
                this.camera.offset.x = this.headSide;
                this.camera.offset.y = this.headHeight;
            }

            if(this.audio) {
                this.audio.footStepSpeed = this.movementSpeed / 2.7;
            }

            if(this.animation) {
                this.animation.minIdleSpeed = this.movementSpeed * 0.2;
                this.animation.minSprintSpeed = this.movementSpeed * 1.2;
            }
        }

        this.switchPerson(this.defaultPerson);
        this.camera?.restoreDefault();
    }

    update(): void {
        super.update();

        if (this.camera && !this.context.isInXR) {
            const changePerson = this.camera.desiredPerson != this.camera.person;
            const isAllowed = this.allowedPersons.includes(this.camera.desiredPerson);
            if (changePerson && isAllowed)
                this.switchPerson(this.camera.desiredPerson);
        }
    }

    // @nonSerialized
    set person(mode: PersonMode) { this.switchPerson(mode); }
    // @nonSerialized
    get person(): PersonMode | undefined { return this.camera?.person; }

    protected switchPerson(newPerson: PersonMode) {
        if (!this.physics || !this.camera) return;

        this.physics.movementMode = newPerson == PersonMode.FirstPerson ? CharacterPhysics_MovementMode.Move : CharacterPhysics_MovementMode.Turn;
        this.physics.forceSetRotation(this.gameObject.quaternion); // set character rotation
        this.avatar?.setPerson(newPerson);
        this.camera.switchPerson(newPerson);
    }
}