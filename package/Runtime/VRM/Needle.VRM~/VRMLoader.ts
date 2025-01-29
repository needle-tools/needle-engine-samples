import { Behaviour, Context, FileReference, GameObject, INeedleGLTFExtensionPlugin, TransformGizmo, UIDProvider, addCustomExtensionPlugin, getLoader, serializable } from "@needle-tools/engine";
import { VRMLoaderPlugin } from "@pixiv/three-vrm";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { Object3D } from "three";

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

    // samples here:
    // https://github.com/madjin/vrm-samples

    static async LoadVRM(url: string, context: Context = Context.Current, seed: number | UIDProvider | null = null, prog: ((prog: ProgressEvent) => void) | undefined = undefined): Promise<Object3D | undefined> {
        // using https://github.com/pixiv/three-vrm
        const loader = getLoader();
        const data = await loader.loadSync(context, url, url, seed, prog);
        if (!data) return undefined;
        const scene = data.scene.userData.vrm.scene ?? data.scene;
        return scene;
    }

    @serializable(FileReference)
    vrmModel?: FileReference;

    start() {
        if (this.vrmModel?.url) {
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

        addGizmos(["leftUpperArm", "rightUpperArm"]);

        function addGizmos(bones: string[]) {
            bones.forEach(boneKey => {
                const bone = humanoid.humanBones[boneKey].node;

                const transform = new TransformGizmo();
                GameObject.addComponent(bone, transform);
                const controls = transform.control as unknown as TransformControls;
                if (controls) {
                    controls.setMode("translate");
                    controls.setSize(0.3);
                    controls.showZ = false;
                }

            });
        };

    }
}