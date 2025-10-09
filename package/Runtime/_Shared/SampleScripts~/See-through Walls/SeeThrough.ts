
import { Behaviour, getParam, getTempVector, Gizmos, Mathf, Renderer, serializable } from "@needle-tools/engine";
import { Material, Object3D, Vector3 } from "three";

const debugSeeThrough = getParam("debugst");

export class SeeThroughFade extends Behaviour {

    /**
     * Assign the center in which direction the objects should fade out.
     */
    @serializable(Object3D)
    center: Object3D | null = null;

    /** Fade Duration in seconds */
    @serializable()
    fadeDuration: number = .05;

    /** 
     * Minimum alpha value when fading out (0-1)
     */
    @serializable()
    minAlpha: number = 0;

    @serializable()
    useAlphaHash: boolean = true;

    private _centerVec: Vector3 = new Vector3();
    private _centerDir: Vector3 = new Vector3();
    private _centerDistance: number = 0;
    private _renderer: Renderer[] | null = null;
    private _needsUpdate = true;
    

    update(): void {
        if (this._needsUpdate) {
            this._needsUpdate = false;

            this.center ??= this.context.scene;

            // NOTE: instead of using the object's anchor (gameObject.worldPosition) we could also get the object's bounding box center:
            // getBoundingBox(this.gameObject); // < import { getBoundingBox } from "@needle-tools/engine";

            this._centerVec.copy(this.gameObject.worldPosition.sub(this.center.worldPosition));
            this._centerDistance = this._centerVec.length();
            this._centerDir.copy(this._centerVec)
                .multiply(getTempVector(1, .5, 1)) // Reduce vertical influence
                .normalize();

            
        }

        if (!this.center) return;

        this._renderer ??= this.gameObject.getComponentsInChildren(Renderer);

        const dot = this._centerDir.dot(this.context.mainCamera.worldForward);
        const shouldHide = dot > .1;

        if(debugSeeThrough && this.center) {
            const wp = this.gameObject.worldPosition;
            Gizmos.DrawArrow(getTempVector(wp), wp.sub(this._centerDir), shouldHide ? 0xFF0000 : 0x00FF00);
        }

        if (shouldHide) {
            this._renderer?.forEach(r => {
                this.updateMaterialAlpha(r, this.minAlpha);
            });
        }
        else {
            this._renderer?.forEach(r => {
                this.updateMaterialAlpha(r, 1);
            });
        }


    }

    private rendererMaterials = new Map<Renderer, Material[]>();

    private updateMaterialAlpha(renderer: Renderer, targetAlpha: number) {


        if (!this.rendererMaterials.has(renderer)) {
            const materials = new Array<Material>();

            // We clone the materials once and store them, so we can modify the opacity without affecting other objects using the same material. This could potentially be optimized further to re-use materials between renderers if multiple renderers use the same material.
            for (let i = 0; i < renderer.sharedMaterials.length; i++) {
                const mat = renderer.sharedMaterials[i];
                if (!mat) continue;
                const matClone = mat.clone();
                materials.push(matClone);
                renderer.sharedMaterials[i] = matClone;
            }

            this.rendererMaterials.set(renderer, materials);
        }

        const materials = renderer.hasLightmap ? renderer.sharedMaterials : this.rendererMaterials.get(renderer);
        if (!materials) return;

        for (const mat of materials) {
            if (!mat) continue;
            mat.transparent = !this.useAlphaHash;
            mat.alphaHash = this.useAlphaHash;
            mat.opacity = Mathf.lerp(mat.opacity, targetAlpha, this.context.time.deltaTime / this.fadeDuration);
        }
    }

}