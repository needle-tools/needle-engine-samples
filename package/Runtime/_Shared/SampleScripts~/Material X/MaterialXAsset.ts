import { Behaviour, GameObject, ImageReference, Renderer, getParam, serializable } from "@needle-tools/engine";
import { TextureLoader } from "three";

// Documentation → https://docs.needle.tools/scripting

const debug = getParam("debugmaterialx");

export class MaterialXAsset extends Behaviour {

    // A .mtlx file is basically an xml file that references other files, like textures.
    // We're referencing it as "FileReference" so that it will be copied out on export.
    //@type FileReference
    @serializable(URL)
    materialXAsset?: string;

    // As a workaround for the MaterialX loader not supporting proper control over texture loading yet,
    // we need to manually assign all textures that are referenced in the .mtlx file.
    @serializable(ImageReference)
    images: Array<ImageReference> = [];

    awake() {
        if (!this.materialXAsset) {
            console.warn(`MaterialXAsset: No .mtlx file assigned on ${this.name}, can't load material.`);
            return;
        }
        this.loadMaterialX(this.materialXAsset as any as string);
    }

    private _loadingPath: string | null = null;

    loadMaterialX(path: string) {

        this._loadingPath = path;

        import("@needle-tools/materialx").then(mod => {

            if (this._loadingPath !== path) {
                console.warn(`MaterialXAsset: Loading path has changed from ${path} to ${this._loadingPath}, aborting load.`);
                return;
            }

            if (debug) console.log("MTLX", path);

            const loader = new TextureLoader();

            return fetch(path).then(res => res.text()).then(text => {
                mod.Experimental_API.createMaterialXMaterial(text, 0, {
                    getTexture: async (url) => {
                        // If the URL already starts with "assets/" we keep it as is.
                        if (url.startsWith('assets/') || url.startsWith("/assets/")) {

                        }
                        else {
                            // Split out the path and only use the filename for reference for now, we assume unique names here.
                            // This is because the Textures referenced in Unity are exported to the "assets" folder by name
                            // But the paths in the .mtlx file can be different, so we need to ignore the path and just use the filename for reference for now.
                            const parts = url.split('/');
                            const filename = parts.pop();
                            if (debug) console.log('MTLX resolveURL', { url, filename });
                            url = "/assets/" + filename;
                        }

                        if (debug) console.log('MTLX Load texture', url);
                        return await loader.loadAsync(url).then(texture => {
                            texture.flipY = false; // MaterialX textures are expected to be flipped in Y, but three.js does this by default, so we disable it here.
                            return texture;
                        })
                    },
                }).then(material => {
                    if (this._loadingPath !== path) {
                        console.warn(`MaterialXAsset: Loaded material from ${path} but the loading path has changed to ${this._loadingPath}, ignoring loaded material.`);
                        return;
                    }
                    const renderer = this.gameObject.getComponent(Renderer);
                    if (!renderer) {
                        console.warn("MaterialXAsset: No Renderer found on GameObject, can't assign material.", this.gameObject);
                        return;
                    }
                    if (debug) console.log('Loaded .mtlx material', material, path);
                    if (material)
                        renderer.sharedMaterials[0] = material;

                })
            });
        })
            .catch(err => {
                console.error("Please install '@needle-tools/materialx' to load .mtlx files", err);
                throw err;
            });
    }
}