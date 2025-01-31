import { Behaviour, destroy, FileReference, getParam, getTempVector, Gizmos, isDevEnvironment, serializable, setParam, showBalloonMessage } from '@needle-tools/engine';
import { DropInViewer, PlyLoader, KSplatLoader } from '@mkkellogg/gaussian-splats-3d';
import { _DropInViewer } from './types.js';
import { Box3 } from 'three';

export class SplatRenderer extends Behaviour {

    static async downloadOptimizedSplat(url: string, opts?: { onProgress?: Function }) {

        if (url.endsWith(".ksplat")) {
            console.error("File is already a .ksplat file");
            return false;
        }

        let filename = url.split('/').pop();
        let ext = filename?.lastIndexOf('.');
        if (ext) filename = filename?.substring(0, ext);

        console.debug(`Start downloading optimized splat: ${filename}`);

        const compressionLevel = 1;
        const sphericalHarmonicsDegree = 1;
        // const splatAlphaRemovalThreshold = 5; // out of 255

        return PlyLoader.loadFromURL(url,
            opts?.onProgress,
            false,
            false,
            1,
            compressionLevel,
            true,
            sphericalHarmonicsDegree)
            .then((splatBuffer) => {
                console.debug("Downloaded optimized splat");
                KSplatLoader.downloadFile(splatBuffer, `${filename || "converted_file"}.ksplat`);
                return splatBuffer;
            });
    }



    private _viewer: _DropInViewer | null = null;

    @serializable(FileReference)
    path: FileReference | string | null = null;

    @serializable()
    dynamicObject: boolean = false;

    @serializable()
    progressiveLoading: boolean = true;

    @serializable()
    showLoadingUI: boolean = false;

    @serializable()
    autoCenter?: boolean = false;

    onEnable() {
        this._viewer = new DropInViewer({
            // 'selfDrivenMode': false,
            // renderer: this.context.renderer,
            // rootElement: this.context.domElement,
            enableSIMDInSort: true,
            integerBasedSort: true,
            gpuAcceleratedSort: false,
            sharedMemoryForWorkers: window.crossOriginIsolated,
            dynamicScene: this.dynamicObject,
            halfPrecisionCovariancesOnGPU: true,
            sphericalHarmonicsDegree: 0,
            freeIntermediateSplatData: true,
            inMemoryCompressionLevel: 2, // Can't be used when progressive loading is on
            splatRenderMode: 0, //0 = ThreeD, 1 = TwoD
            // lodLevel: 1,
            splatSortDistanceMapPrecision: 16,
            // sceneFadeInRateMultiplier: .01,

        }) as _DropInViewer;

        if (isDevEnvironment()) console.debug('SplatRenderer', this);
        this._viewer.layers.set(2);
        this.gameObject.add(this._viewer);

        const pathParam = getParam("url") as string;
        let path = this.path;
        if (pathParam) path = pathParam;
        if (path) {
            this.load(path)
                .then(res => {
                    console.debug('Scene loaded', res, this._viewer);
                    // const splat = this._viewer.children[0].
                    // console.debug(this._viewer?.splatMesh);
                    // const bounds = this._viewer?.splatMesh?.computeBoundingBox(true, 0);
                    // console.log(bounds);
                    // if (bounds) Gizmos.DrawWireBox3(bounds, 0xff0000, 10);
                });
        }
    }

    onDisable(): void {
        if (this._viewer) destroy(this._viewer);
        this._viewer = null;
    }

    // update(): void {
    //     console.log(this._viewer)
    //     if (this._viewer) {
    //         this._viewer!.viewer.rootElement = this.context.domElement;
    //         this._viewer.viewer.update();
    //         this._viewer.viewer.render();
    //     }
    // }

    getBoundingBox(): Box3 | null {
        const bounds = this._viewer?.splatMesh?.computeBoundingBox(true, 0);
        return bounds || null;
    }

    get splatMesh() {
        return this._viewer?.splatMesh || null;
    }



    private isLoading: boolean = false;

    async load(path: string | FileReference): Promise<boolean> {
        const autoCenter = this.autoCenter;
        return this.internalLoad(path).then(res => {
            if (autoCenter && res) {
                const bounds = this.getBoundingBox();
                if (bounds) {
                    const center = bounds.getCenter(getTempVector());
                    this.splatMesh?.position.sub(center);
                }
            }
            return res;
        })
    }

    private async internalLoad(path: string | FileReference): Promise<boolean> {

        if (typeof path === 'object') {
            path = path.url;
        }

        if (!this._viewer) {
            return false;
        }
        if (this.path === path) {
            console.debug('Scene already loaded');
            return false;
        }
        if (this.isLoading) {
            showBalloonMessage('Please wait for the current scene to load before loading another scene.');
            return false;
        }


        this.isLoading = true;
        this.path = path;

        try {

            // Unload previously loaded scene
            const scenecount = this._viewer.viewer.getSceneCount();
            for (let i = scenecount - 1; i >= 0; i--) {
                await this._viewer.viewer.removeSplatScene(0);
            }
            // await this._viewer?.viewer.removeSplatScenes().catch(err => {
            //     console.error(err.message);
            // });

            console.debug('Loading splat scene', path);
            const isProgressiveLoading = this.progressiveLoading;

            if (isProgressiveLoading && this._viewer?.viewer.dynamicScene) {
                console.warn('Progressive loading is not supported with dynamic scene');
            }

            const promise = new Promise(async (resolve) => {
                const res = this._viewer?.viewer.addSplatScene(path, {
                    showLoadingUI: this.showLoadingUI,
                    showInfo: false,
                    showControlPlane: false,
                    progressiveLoad: isProgressiveLoading,
                    splatAlphaRemovalThreshold: 0.9,
                    // position: [0, 0, 0],
                    rotation: [1, 0, 0, 0],
                    onProgress: (_perc, label, status) => {
                        console.debug(status, label, path);
                        if (status === 1) {
                            // waiting
                        }
                        else if (status === 2) {
                            console.debug("Finished loading!", _perc);
                            this.isLoading = false;
                            resolve(true);
                        }
                        // 1 is waiting, 0 is running, 2 is done
                        else if (status > 1) {
                            this.isLoading = false;
                            resolve(false);
                        }
                    },
                });

                if (!res) {
                    console.error('Failed to load splat scene', path);
                    this.isLoading = false;
                    return resolve(false);
                }
                await res.promise;
                resolve(true);
                // viewer.splatMesh.setPointCloudModeEnabled(true);

            }).then(() => {
                this.isLoading = false;
                return true;
            })
            return promise;
        }
        catch (err) {
            console.error(err);
        }
        finally {
            this.isLoading = false;
        }

        return false;
    }
}


