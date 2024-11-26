import { Behaviour, getParam, serializable, setParam, showBalloonMessage } from '@needle-tools/engine';
import { DropInViewer, Viewer } from '@mkkellogg/gaussian-splats-3d';

export class SplatRenderer extends Behaviour {

    private viewer: Viewer;

	@serializable()
	path: string = 'https://huggingface.co/cakewalk/splat-data/resolve/main/bicycle.splat'; 

    @serializable()
    dynamicObject: boolean = true;

    @serializable()
    progressiveLoading: boolean = true;

    @serializable()
    showLoadingUI: boolean = true;

    onEnable() {
        const pathParam = getParam("url") as string;

        const hasSharedArrayBuffers = window.crossOriginIsolated;
        const viewer = new DropInViewer({
            enableSIMDInSort: false,
            integerBasedSort: false,
            gpuAcceleratedSort: hasSharedArrayBuffers,
            sharedMemoryForWorkers: hasSharedArrayBuffers,
            dynamicScene: this.dynamicObject,
            halfPrecisionCovariancesOnGPU: true,
            sphericalHarmonicsDegree: 1,
            freeIntermediateSplatData: true,
            inMemoryCompressionLevel: 1, // Can't be used when progressive loading is on
            splatRenderMode: 0, //0 = ThreeD, 1 = TwoD
        });

        let path = this.path;

        if (pathParam)
            path = pathParam;
        
        viewer.layers.set(2);
        this.viewer = viewer;
        this.gameObject.add(this.viewer);

        this.load(path);
    }

    private isLoading: boolean = false;
    async load (path: string) {
        if (this.isLoading) {
            showBalloonMessage('Please wait for the current scene to load before loading another scene.');
            return;
        }
        this.isLoading = true;

        if (this.viewer.getSceneCount() > 0)
            await this.viewer.removeSplatScene(0);

        let lastProgress = -100;

        this.viewer
            .addSplatScene(path,
                {
                    showLoadingUI: this.showLoadingUI,
                    showInfo: false,
                    showControlPlane: false,
                    progressiveLoad: this.progressiveLoading,
                    splatAlphaRemovalThreshold: 0.9,
                    onProgress: (percentComplete, percentCompleteLabel, loaderStatus) => {
                        if (percentComplete - lastProgress > 1) {
                            console.log(loaderStatus, percentComplete, percentCompleteLabel);
                            lastProgress = percentComplete;
                        }
                        if (percentComplete === 100) {
                            console.log('Scene loaded');
                            this.isLoading = false;
                        }
                    },
                    rotation: [1, 0, 0, 0],
                })
            .then((s) => {
                console.log('Added splat scene', this.viewer);
                // viewer.splatMesh.setPointCloudModeEnabled(true);
            });
    }
}