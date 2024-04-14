import { Behaviour, GameObject, NeedleXREventArgs, USDZExporter, Animation, AudioSource } from "@needle-tools/engine";

export class ResetAnimationsForXR extends Behaviour {
    onEnable(): void {
        const exporter = GameObject.findObjectOfType(USDZExporter);
        exporter?.addEventListener("before-export", () => {
            this.resetAnimations();
        });
    }

    onEnterXR(_args: NeedleXREventArgs): void {
        this.resetAnimations();
    }

    private resetAnimations() {
        console.warn("Resetting animations and audio for XR export.")
        
        const animationComponentsInScene = GameObject.findObjectsOfType(Animation);
        for (const animation of animationComponentsInScene) {
            animation.actions.forEach(action => {
                action.reset();
                action.time = 0;
                action.play();
            });
        }

        const audioInScene = GameObject.findObjectsOfType(AudioSource);
        for (const audio of audioInScene) {
            audio.stop();
            audio.play();
        }
    }
}