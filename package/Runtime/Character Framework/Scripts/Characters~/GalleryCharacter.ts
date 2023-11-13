import { PersonCamera } from "./Camera/PersonCamera";
import { PersonMode } from "./Camera/PersonMode";
import { Character } from "./Framework/Character";
import { GalleryInput } from "./Input/GalleryInput";
import { GalleryPhysics } from "./Physics/GalleryPhysics";

export class GalleryCharacter extends Character {
    private camera?: PersonCamera;

    awake(): void {
        super.awake();

        this.camera = this.ensureModule(PersonCamera);
        this.ensureModule(GalleryPhysics);
        this.ensureModule(GalleryInput);

        
    }

    protected intialize(findModules?: boolean): void {
        super.intialize(findModules);

        this.camera?.offset.set(0, 1.6, 0);
        this.camera?.switchPerson(PersonMode.FirstPerson);
    }
}