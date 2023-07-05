// START MARKER Play Audio On Collision
import { AudioSource, Behaviour, serializeable } from "@needle-tools/engine";

export class PlayAudioOnCollision extends Behaviour {
    @serializeable(AudioSource)
    audioSource?: AudioSource;

    onCollisionEnter() {
        this.audioSource?.play();
    }
}
// END MARKER Play Audio On Collision