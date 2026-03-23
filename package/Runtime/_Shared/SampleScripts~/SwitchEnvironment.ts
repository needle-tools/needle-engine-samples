import { Behaviour, FileReference, loadPMREM, serializable } from "@needle-tools/engine";
import { Euler, EquirectangularRefractionMapping, EquirectangularReflectionMapping } from "three";


export class SwitchEnvironment extends Behaviour {

    @serializable(FileReference)
    environments: Array<FileReference> | null = null;

    @serializable(Euler)
    environmentRotation = new Euler(0, 2.1, 0);

    private currentEnvironmentIndex = -1;

    awake() {
        this.context.scene.environment = null;
    }

    start() {
        this.context.menu.appendChild({
            label: "Next Environment",
            onClick: () => this.nextEnvironment()
        });
        // preload environments
        if (this.environments) {
            this.environments.forEach(async env => {
                if (env?.url) await fetch(env.url, { priority: "low" }).catch(err => console.error(`Failed to preload environment map from ${env.url}:`, err));
            });
        }
    }

    onEnable(): void {
        if (this.environments && this.environments.length > 0) {
            this.currentEnvironmentIndex = 0;
            this.setEnvironment(this.environments[0]);
        }
    }

    nextEnvironment() {
        if (!this.environments || this.environments.length === 0) return;
        this.currentEnvironmentIndex = (this.currentEnvironmentIndex + 1) % this.environments.length;
        const nextEnv = this.environments[this.currentEnvironmentIndex];
        this.setEnvironment(nextEnv);
    }

    async setEnvironment(texture: string | FileReference) {
        if (texture === null) {
            console.error("No environment map provided.");
            return;
        }
        const url = typeof texture === "string" ? texture : texture.url;
        const envMap = await loadPMREM(url, this.context.renderer);
        if (!envMap) {
            console.error(`Failed to load environment map from ${url}`);
            return;
        }
        console.debug(`Loaded environment map from ${url}`);
        if (envMap.mapping === 300) {
            envMap.mapping = EquirectangularRefractionMapping;
            envMap.needsUpdate = true;
        }
        this.context.scene.environment = envMap;
        this.context.scene.environmentRotation = this.environmentRotation;
    }
}