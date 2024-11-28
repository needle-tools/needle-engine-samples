import { Behaviour, getParam, serializable, setParam, showBalloonMessage } from '@needle-tools/engine';
import { DropInViewer, Viewer, PlyLoader, KSplatLoader } from '@mkkellogg/gaussian-splats-3d';

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
            integerBasedSort: true,
            gpuAcceleratedSort: false,
            sharedMemoryForWorkers: hasSharedArrayBuffers,
            dynamicScene: false,
            halfPrecisionCovariancesOnGPU: true,
            sphericalHarmonicsDegree: 0,
            freeIntermediateSplatData: true,
            inMemoryCompressionLevel: 2, // Can't be used when progressive loading is on
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

    private onProgress(percentComplete: number, percentCompleteLabel: string, loaderStatus: string) {
        if (percentComplete - this.lastProgress > 1) {
            console.log(loaderStatus, percentComplete, percentCompleteLabel);
            this.lastProgress = percentComplete;
        }
        if (percentComplete === 100) {
            console.log('Scene loaded');
            this.lastProgress = 100;
            this.isLoading = false;
        }
    }

    private lastProgress = -100;
    private isLoading: boolean = false;
    async load (path: string) {
        if (this.isLoading) {
            showBalloonMessage('Please wait for the current scene to load before loading another scene.');
            return;
        }
        this.isLoading = true;
        this.path = path;

        if (this.viewer.getSceneCount() > 0)
            await this.viewer.removeSplatScene(0);

        this.viewer
            .addSplatScene(path,
                {
                    showLoadingUI: this.showLoadingUI,
                    showInfo: false,
                    showControlPlane: false,
                    progressiveLoad: false,
                    splatAlphaRemovalThreshold: 0.9,
                    onProgress: this.onProgress.bind(this),
                    rotation: [1, 0, 0, 0],
                })
            .then((s) => {
                console.log('Added splat scene', this.viewer);
                // viewer.splatMesh.setPointCloudModeEnabled(true);
            });
    }

    downloadOptimizedSplat() {
        const compressionLevel = 1;
        const splatAlphaRemovalThreshold = 5; // out of 255
        const sphericalHarmonicsDegree = 1;
        console.log("Start downloading optimized splat");
        this.lastProgress = -100;
        PlyLoader.loadFromURL(this.path,
            this.onProgress.bind(this),
            false,
            false,
            1,
            compressionLevel,
            true,
            sphericalHarmonicsDegree)
        .then((splatBuffer) => {
            console.log("Downloaded optimized splat");
            KSplatLoader.downloadFile(splatBuffer, 'converted_file.ksplat');
        });
    }
}