import { Behaviour, Context, FileReference, GameObject, INeedleGLTFExtensionPlugin, TransformGizmo, UIDProvider, addCustomExtensionPlugin, getLoader, serializable } from "@needle-tools/engine";
import { VRMLoaderPlugin } from "@pixiv/three-vrm";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { Object3D, Mesh, MeshBasicMaterial } from "three";

// Register the VRMLoaderPlugin
addCustomExtensionPlugin({
    name: "VRM",
    onImport: (loader, _url, _context) => {
        loader.register(parser => new VRMLoaderPlugin(parser));
    },
    async onLoaded(_url, _gltf, _context) {
        _gltf.scene.userData.vrm = _gltf.userData.vrm;
    },
} as INeedleGLTFExtensionPlugin);

export class VRMLoader extends Behaviour {

    static async LoadVRM(url: string, context: Context = Context.Current, seed: number | UIDProvider | null = null, prog: ((prog: ProgressEvent) => void) | undefined = undefined): Promise<Object3D | undefined> {
        // using https://github.com/pixiv/three-vrm
        const loader = getLoader();

        const data = await loader.loadSync(context, url, url, seed, prog);

        if (!data) return undefined;

        const scene = data.userData.vrm.scene ?? data.scene;
        return scene;
    }
    // samples here:
    // https://github.com/madjin/vrm-samples
    
    @serializable(FileReference)
    vrmModel?: FileReference;
    
    start() {
        if (this.vrmModel) {
            this.spawnModel(this.vrmModel.url);
        }
    }

    async spawnModel(url: string) {
        const model = await VRMLoader.LoadVRM(url);
        if (!model) {
            console.error('Failed to load VRM');
            return;
        }

        this.gameObject.add(model);

        if (!model.userData.vrm || !model.userData.vrm.humanoid) {
            console.error('No VRM data found', model.userData);
            return;
        }

        // TODO basic IK
        const humanoid = model.userData.vrm.humanoid;
        
        const addGizmos = (bones: string[]) => {
            bones.forEach(boneKey => {
                const bone = humanoid.humanBones[boneKey].node;

                const transform = new TransformGizmo();
                transform.onEnable(); // create controls
                const controls = transform["control"] as TransformControls;
                if (controls) {
                    controls.setMode("translate");
                    controls.setSize(0.5);
                    controls.showZ = false;
                    controls.traverse(x => {
                        const mesh = x as Mesh;
                        if (mesh) {
                            const gizmoMat = mesh.material as MeshBasicMaterial;
                            if (gizmoMat) {
                                gizmoMat.opacity = 0.7;
                            }
                        }
                    });
                }
                
                GameObject.addComponent(bone, transform);
            });
        };

        addGizmos(["leftUpperArm", "rightUpperLeg"]);
    }
}