import { Camera } from "@mediapipe/camera_utils";
import { Hands } from "@mediapipe/hands";
import { GameObject, Mathf, NeedleEngine } from "@needle-tools/engine";
import { ParticleSphere } from "./ParticleSphere";


NeedleEngine.addContextCreatedCallback(ctx => {

    const sphereComponents = GameObject.getComponentsInChildren(ctx.context.scene, ParticleSphere);

    const hands = new Hands({
        locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });;
    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    hands.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandedness) {
            const hand1 = results.multiHandLandmarks[0];
            const hand2 = results.multiHandLandmarks[1];
            if (hand1) {
                if (hand1.length >= 4 && sphereComponents[0]) {
                    const pos = hand1[4];
                    const px = Mathf.remap(pos.x, 0, 1, -4, 4);
                    const py = Mathf.remap(pos.y, 0, 1, 4, -5);
                    sphereComponents[0].setTarget(px, py, 0);
                }
                if (!hand2 && hand1.length >= 8 && sphereComponents.length >= 2) {
                    const pos = hand1[8];
                    const px = Mathf.remap(pos.x, 0, 1, -4, 4);
                    const py = Mathf.remap(pos.y, 0, 1, 4, -5);
                    sphereComponents[1].setTarget(px, py, 0);
                }
            }
            if (hand2 && sphereComponents.length >= 2) {
                const pos = hand2[4];
                const px = Mathf.remap(pos.x, 0, 1, -4, 4);
                const py = Mathf.remap(pos.y, 0, 1, 4, -5);
                sphereComponents[1].setTarget(px, py, 0);
            }
        }
    });


    const videoElement = document.createElement("video");

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: 640,
        height: 360
    });
    camera.start();

})
