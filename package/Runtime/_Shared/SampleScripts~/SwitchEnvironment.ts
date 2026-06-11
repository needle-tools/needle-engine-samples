import { Behaviour, FileReference, loadPMREM, serializable } from "@needle-tools/engine";
import { Euler, EquirectangularRefractionMapping, EquirectangularReflectionMapping } from "three";


export class SwitchEnvironment extends Behaviour {

    @serializable(FileReference)
    environments: Array<FileReference> | null = null;

    @serializable(Euler)
    environmentRotation = new Euler(0, 2.1, 0);

    @serializable()
    rotateEnvironment = true;

    @serializable()
    setAsSkybox = false;

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
            (async () => {
                await new Promise(resolve => setTimeout(resolve, 300));
                for (let i = 0; i < this.environments!.length; i++) {
                    const env = this.environments![i];
                    if (!env?.url) continue;
                    await fetch(env.url, { priority: "low" } as RequestInit).catch(err => console.error(`Failed to preload environment map from ${env.url}:`, err));
                }
            })();
        }
    }

    onEnable(): void {
        if (this.environments && this.environments.length > 0) {
            this.currentEnvironmentIndex = 0;
            this.setEnvironment(this.environments[0]);
        }
    }

    update() {
        if(this.rotateEnvironment)
            this.context.scene.environmentRotation.y += this.context.time.deltaTime * .07;
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
        if (this.setAsSkybox) {
            this.context.scene.background = envMap;
        }
    }
}