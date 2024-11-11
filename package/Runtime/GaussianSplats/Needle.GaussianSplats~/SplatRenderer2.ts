import { Behaviour, getParam } from '@needle-tools/engine';
import { DropInViewer, Viewer } from '@mkkellogg/gaussian-splats-3d';

export class SplatRenderer2 extends Behaviour {

    private viewer: Viewer;

    onEnable() {

        const pathParam = getParam("url") as string;

        const viewer = new DropInViewer({
            gpuAcceleratedSort: false,
            sharedMemoryForWorkers: false,
            dynamicScene: true,
        });

        let path =
            'https://huggingface.co/cakewalk/splat-data/resolve/main/train.splat';

        if (pathParam)
            path = pathParam;

        let lastProgress = -100;
        console.log("Loading file", path);
        viewer
            .addSplatScene(path,
                {
                    showLoadingUI: true,
                    showInfo: true,
                    showControlPlane: true,
                    onProgress: (percentComplete, percentCompleteLabel, loaderStatus) => {
                        if (percentComplete - lastProgress > 1) {
                            console.log(loaderStatus, percentComplete, percentCompleteLabel);
                            lastProgress = percentComplete;
                        }
                    },
                    rotation: [1, 0, 0, 0],
                })
            .then((s) => {
                console.log('Added splat scene', viewer);
                // viewer.splatMesh.setPointCloudModeEnabled(true);
            });

        viewer.layers.set(2);

        this.viewer = viewer;
        this.gameObject.add(this.viewer);
    }
}