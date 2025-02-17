import { Animation, Behaviour, Context, FileReference, INeedleGLTFExtensionPlugin, UIDProvider, addCustomExtensionPlugin, getLoader, serializable } from "@needle-tools/engine";
import { Object3D } from "three";
import { VRMLoaderPlugin } from "@pixiv/three-vrm";
import { loadMixamoAnimation } from "./MixamoAnimationLoader.js";

// Register the VRMLoaderPlugin
addCustomExtensionPlugin({
    name: 'VRM',
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

    @serializable(FileReference)
    fbxAnimation?: FileReference;

    @serializable()
    allowDropFBX = true;

    private vrm: any;

    start() {
        if (this.vrmModel?.url)
            this.spawnModel(this.vrmModel.url);
    }

    update(): void {
        this.vrm?.update(this.context.time.deltaTime);
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

        // Load VRM data
        const vrm = this.vrm = model.userData.vrm;
        const humanoid = vrm.humanoid;
        const scene = vrm.scene;
        const animation = scene.addComponent(Animation);

        // Helper to load an animation in the Mixamo FBX format
        function loadFBX(animationUrl) {
            humanoid.resetNormalizedPose();

            loadMixamoAnimation(animationUrl, vrm).then((clip) => {
                animation.addClip(clip);
                animation.play(clip);
            });
        }

        // If an FBX was provided as part of this object's configuration, load that directly
        if (this.fbxAnimation?.url)
            loadFBX(this.fbxAnimation.url);

        const context = this.context;

        // When a user drops an FBX file, we assume that it's following the Mixamo animation format.
        function setUpFBXDropping() {
            context.domElement.addEventListener('drop', (event: DragEvent) => {
                event.preventDefault();
                event.stopPropagation();

                const file = event.dataTransfer?.files[0];
                const reader = new FileReader();

                reader.onload = function (event) {
                    if (!event.target) return;
                    const contents = event.target.result;
                    loadFBX(contents);
                };

                if (file) reader.readAsDataURL(file);
                else  console.error('No file dropped', event);
            } );

            // Prevent the default behavior of the browser when a file is dragged over the window.
            context.domElement.addEventListener('dragover', (event) => {
                event.preventDefault();
                event.stopPropagation();
            });
        }

        if (this.allowDropFBX)
            setUpFBXDropping();
    }
}
