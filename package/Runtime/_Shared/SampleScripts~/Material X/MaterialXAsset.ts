import { Behaviour, GameObject, INeedleGLTFExtensionPlugin, ImageReference, Renderer, SourceIdentifier, addCustomExtensionPlugin, getParam, serializable } from "@needle-tools/engine";
import { Loader, LoadingManager, Material, Texture } from "three";

import { MaterialXLoader } from 'three/examples/jsm/loaders/MaterialXLoader.js';
import { nodeFrame } from "three/examples/jsm/renderers/webgl-legacy/nodes/WebGLNodes";

import { type GLTFLoaderPlugin, GLTFParser, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

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
    
    async awake () {
        if (!this.materialXAsset) return;
        this.loadMaterialX(this.materialXAsset as any as string);
    }

    update() {
        nodeFrame.update();
    }

    async loadMaterialX(path: string) {
        const renderer = GameObject.getComponent(this.gameObject, Renderer);
        if (!renderer) return;

        const manager = new LoadingManager();
        
        // This is a WORKAROUND until we can properly reference compressed/packed textures (requires three.js update + MaterialX loader fixes).
        // In the meantime, they're exported using ImageReference, where they are simply put into "assets/"
        // without a subpath, so we need to assume
        // 1) all texture names are unique
        // 2) all textures needed by the .mtlx file are manually referenced in the array above
        manager.resolveURL = ( url: string ) => {
            // If the URL already starts with "assets/" we keep it as is.
            if (url.startsWith('assets/')) return url;

            // Split out the path and only use the filename for reference for now, we assume unique names here.
            const parts = url.split('/');
            const filename = parts.pop();
            if (debug) console.log('resolveURL', url, filename)
            return "assets/" + filename;
        };
        
        const mtlxLoader = new MaterialXLoader(manager);
        const material = await mtlxLoader
					.setPath( '' )
					.loadAsync( path )
					.then( ( { materials } ) => {
                        // a mtlx file can contain multiple materials, we just take the first one here and log all of them
                        if (debug) console.log('Loaded .mtlx materials', materials);
                        const firstMaterial = Object.values( materials )[0] as Material;
                        return firstMaterial;
                    });

        if (debug) console.log('Loaded .mtlx material', material, path);
        if (material)
            renderer.sharedMaterial = material;
    }
}