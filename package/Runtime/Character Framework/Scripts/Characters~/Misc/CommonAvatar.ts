import { GameObject, Mathf, Renderer, SkinnedMeshRenderer, serializable } from "@needle-tools/engine";

import { Vector3, MeshStandardMaterial, HSL, Color, SkinnedMesh, Material } from "three";

import { CharacterModule, CharacterModuleType } from "../Framework/CharacterModule";
import { PersonMode } from "../Camera/PersonMode";
import { Character } from "../Framework/Character";

/** Simple avatar that can adjust itself for first person view */
export class CommonAvatar extends CharacterModule {
    get Type() { return CharacterModuleType.none; }
    
    @serializable(GameObject)
    avatarObject?: GameObject;

    @serializable()
    characterZOffset: number = 0.3;

    @serializable(GameObject)
    headBone?: GameObject;

    @serializable(Renderer)
    mainRenderer: Renderer[] = [];

    private zeroScale = new Vector3(0, 0, 0);
    private originalHeadScale?: Vector3;
    awake(): void {
        if (this.headBone) {
            this.originalHeadScale = new Vector3();
            this.originalHeadScale?.copy(this.headBone.scale)
        }
    }

    private currentPerson?: PersonMode;
    setPerson(person: PersonMode) {
        this.currentPerson = person;
    }

    initialize(character: Character): void {
        super.initialize(character);

        // tint the avatar deterministically based on the owner's ID
        if(character.isNetworking) {
            const netID = character.playerState?.owner!;
            this.tintObjects(netID);
        }
    }

    private tintObjects(netID: string) {
        const id = parseInt(netID, 16);
        const uniqueCol = new Color(id);

        this.mainRenderer.forEach(r => {
            if (r instanceof SkinnedMeshRenderer) {
                const skinned = r.gameObject as unknown as SkinnedMesh;
                if (skinned.material instanceof Array) {
                    for (const i in skinned.material) {
                        skinned.material[i] = this.tintMaterial(skinned.material[i], uniqueCol);
                    }
                }
                else {
                    skinned.material = this.tintMaterial(skinned.material, uniqueCol);
                }
            }
            else {
                for (const i in r.sharedMaterials) {
                    r.sharedMaterials[i] = this.tintMaterial(r.sharedMaterials[i], uniqueCol);
                }
            }
        });
    }

    private tintMaterial(originalMaterial: Material, referenceColor: Color): Material {
        const mat = originalMaterial.clone();

        if (mat instanceof MeshStandardMaterial && originalMaterial instanceof MeshStandardMaterial) {
            // calculate color
            const origHLS = originalMaterial.color.getHSL({ h: 0, s: 0, l: 0 });
            const newHLS = referenceColor.getHSL({ h: 0, s: 0, l: 0 });

            // set color
            mat.color.setHSL(newHLS.h, origHLS.s, origHLS.l);
        }

        return mat;
    }

    // can't be moduleOnBeforeRender because it needs to run after the animator
    onBeforeRender(): void {
        if(!this.character || !this.character.isInitialized || !this.character.isLocalPlayer) return; // disable the override in multiplayer

        if (this.currentPerson != undefined && this.originalHeadScale != undefined) {
            // apply scale every frame since animation's pose contains scale as well (?)
            this.headBone?.scale.copy(this.currentPerson == PersonMode.FirstPerson ? this.zeroScale : this.originalHeadScale)
            const object = this.avatarObject ?? this.gameObject;
            object.position.setZ(this.currentPerson == PersonMode.FirstPerson ? -this.characterZOffset : 0);
        }
    }
}