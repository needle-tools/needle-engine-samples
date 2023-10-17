import { Behaviour, GameObject, TransformGizmo, addCustomExtension, getLoader, serializable } from "@needle-tools/engine";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

// Documentation → https://docs.needle.tools/scripting

export class VRMLoader extends Behaviour {

    // samples here:
    // https://github.com/madjin/vrm-samples
    
    @serializable()
    path: string = "https://raw.githubusercontent.com/madjin/vrm-samples/master/vroid/stable/AvatarSample_A.vrm";
    
    async start() {
        // using https://github.com/pixiv/three-vrm

        addCustomExtension(VRMLoaderPlugin)

        const loader = getLoader();

        const data = await loader.loadSync(this.context, this.path, this.path, null);

        if (!data) return;

        const scene = data.userData.vrm.scene;
        
        VRMUtils.removeUnnecessaryVertices( data.scene );
        VRMUtils.removeUnnecessaryJoints( data.scene );

        this.gameObject.add(scene);

        console.log(scene, data.userData);

        // TODO basic IK

        const humanoid = data.userData.vrm.humanoid;
        for(const boneKey of Object.keys(humanoid.humanBones)) {
            // make transform gizmo
            const bone = humanoid.humanBones[boneKey].node;
            const transform = new TransformGizmo();
            GameObject.addComponent(bone, transform);
        }
    }
}