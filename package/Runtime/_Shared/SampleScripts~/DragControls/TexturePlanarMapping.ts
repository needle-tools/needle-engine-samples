import { Behaviour, Renderer, serializable } from "@needle-tools/engine";
import { Box3, Matrix4, Texture, Vector2 } from "three";

// Documentation → https://docs.needle.tools/scripting

const _worldBox = new Box3();

/**
 * Projects a material's textures onto this object from directly above, in world space, on the
 * XZ plane - like a pattern painted onto the ground that the object happens to sit on top of.
 * Move the object and the texture stays put in the world, sliding underneath it; scale the object
 * and the texture keeps its real-world size instead of stretching, revealing more or less of the
 * pattern rather than squashing it.
 *
 * Works by writing {@link Texture.offset} and {@link Texture.repeat}, so it needs no special
 * shader - three.js applies those to every standard map automatically. Those two values depend on
 * nothing but the object's world matrix and {@link tileSize}, so an object sitting still costs a
 * single matrix comparison per frame and writes nothing.
 *
 * The world footprint comes from the mesh's own bounds and its authored UV range, not from the
 * object's scale, so this works on any imported mesh whatever its size, pivot, or UV layout -
 * including one whose UVs already tile several times over. What it assumes is that those UVs run
 * `u` toward world `+X` and `v` toward world `+Z`, which holds for a flat mesh that isn't rotated
 * around Y. Rotating around Y would need the texture rotated to match, which {@link Texture.offset}
 * and {@link Texture.repeat} alone can't express.
 *
 * Materials and their textures are cloned on {@link awake}, because the texture transform lives on
 * the {@link Texture} itself: without cloning, two objects sharing one material would each fight to
 * write their own position into it and only the last one to run each frame would look right.
 */
export class TexturePlanarMapping extends Behaviour {

    /** World units covered by one full texture tile. Smaller values repeat the texture more
     *  densely. This is a world-space texel density - it is unrelated to the object's own size,
     *  which is exactly what keeps the texture looking identical across differently sized objects. */
    @serializable()
    tileSize: number = 1;

    /** Watch the object's world matrix and rewrite the texture transform whenever it changes. Turn
     *  this off to stop watching entirely and drive it yourself with {@link apply} - only worth it
     *  if even the per-frame matrix check is too much, since a still object already writes nothing. */
    @serializable()
    continuous: boolean = true;

    /** The mesh's bounds in its own local space - the footprint the UV range maps across. */
    private readonly _localBox = new Box3();
    /** The authored UV range, so a mesh whose UVs run `0`-`4` tiles four times as densely as the
     *  bounds alone would suggest, and still lines up. */
    private readonly _uvMin = new Vector2(0, 0);
    private readonly _uvSize = new Vector2(1, 1);
    private readonly _textures: Texture[] = [];

    /** The world matrix and tile size the textures were last written for, so a frame where nothing
     *  moved costs one matrix comparison instead of a box transform and a write per texture. */
    private readonly _appliedMatrix = new Matrix4();
    private _appliedTileSize = NaN;

    awake(): void {
        const renderer = this.gameObject.getComponent(Renderer);
        if (!renderer) {
            console.warn(`${this.name}: TexturePlanarMapping found no Renderer on this object`, this.gameObject);
            return;
        }
        this.readGeometry(renderer);
        this.cloneTextures(renderer);
    }

    onEnable(): void {
        this.apply();
    }

    update(): void {
        if (!this.continuous || this._textures.length === 0) return;

        this.gameObject.updateWorldMatrix(true, false);
        // Nothing but the world matrix and the tile size feeds the result, so if neither moved the
        // textures already hold the right transform - most frames stop here.
        if (this._appliedTileSize === this.tileSize && this._appliedMatrix.equals(this.gameObject.matrixWorld)) return;

        this.write();
    }

    /** Recomputes and applies the planar texture transform from the object's current world matrix,
     *  whether or not anything changed. {@link update} calls this for you while
     *  {@link continuous} is on; call it yourself after moving the object with that turned off. */
    apply(): void {
        this.gameObject.updateWorldMatrix(true, false);
        this.write();
    }

    /** The actual write, from an already up-to-date world matrix. */
    private write(): void {
        if (this._textures.length === 0) return;

        this._appliedMatrix.copy(this.gameObject.matrixWorld);
        this._appliedTileSize = this.tileSize;
        _worldBox.copy(this._localBox).applyMatrix4(this.gameObject.matrixWorld);

        // World units spanned by one unit of raw UV, which is what turns the authored UVs into a
        // world measurement - position and scale both arrive through the world matrix above.
        const perUvX = (_worldBox.max.x - _worldBox.min.x) / this._uvSize.x;
        const perUvZ = (_worldBox.max.z - _worldBox.min.z) / this._uvSize.y;

        // Solving `sampledUv = worldPosition / tileSize` for three.js' `uv * repeat + offset`.
        const repeatX = perUvX / this.tileSize;
        const repeatY = perUvZ / this.tileSize;
        const offsetX = (_worldBox.min.x - this._uvMin.x * perUvX) / this.tileSize;
        const offsetY = (_worldBox.min.z - this._uvMin.y * perUvZ) / this.tileSize;

        for (const tex of this._textures) {
            tex.repeat.set(repeatX, repeatY);
            tex.offset.set(offsetX, offsetY);
        }
    }

    /** Measures the mesh bounds and UV range once - neither changes unless the geometry itself is
     *  swapped, and both are what the per-frame math turns into world units. */
    private readGeometry(renderer: Renderer): void {
        this._localBox.makeEmpty();
        let uvMinX = Infinity, uvMinY = Infinity, uvMaxX = -Infinity, uvMaxY = -Infinity;

        for (const mesh of renderer.sharedMeshes) {
            const geo = mesh?.geometry;
            if (!geo) continue;

            if (!geo.boundingBox) geo.computeBoundingBox();
            if (geo.boundingBox) this._localBox.union(geo.boundingBox);

            const uv = geo.getAttribute("uv");
            if (!uv) continue;
            for (let i = 0; i < uv.count; i++) {
                const u = uv.getX(i), v = uv.getY(i);
                if (u < uvMinX) uvMinX = u;
                if (u > uvMaxX) uvMaxX = u;
                if (v < uvMinY) uvMinY = v;
                if (v > uvMaxY) uvMaxY = v;
            }
        }

        // A mesh with no UVs, or with every vertex on one UV coordinate, has no range to measure -
        // fall back to a plain 0-1 rather than dividing the whole mapping by zero.
        this._uvMin.set(uvMinX < uvMaxX ? uvMinX : 0, uvMinY < uvMaxY ? uvMinY : 0);
        this._uvSize.set(uvMinX < uvMaxX ? uvMaxX - uvMinX : 1, uvMinY < uvMaxY ? uvMaxY - uvMinY : 1);
    }

    /** Gives this object its own materials and textures - see the class doc for why sharing them
     *  would make two objects overwrite each other's texture transform. */
    private cloneTextures(renderer: Renderer): void {
        this._textures.length = 0;
        const materials = renderer.sharedMaterials;

        for (let i = 0; i < materials.length; i++) {
            const source = materials[i];
            if (!source) continue;
            const material = source.clone() as any;

            for (const key in material) {
                const tex = material[key];
                if (!tex?.isTexture) continue;
                // Cloned textures share their `source`, so this costs no extra image memory or
                // GPU upload - it only gives us a private offset/repeat to write into.
                const clone = (tex as Texture).clone();
                material[key] = clone;
                this._textures.push(clone);
            }

            material.needsUpdate = true;
            materials[i] = material;
        }
    }
}
