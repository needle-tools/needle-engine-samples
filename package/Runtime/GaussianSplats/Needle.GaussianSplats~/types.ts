import { Box3, Group, Matrix4, Mesh, Vector3 } from "three";
import { DropInViewer, Viewer, PlyLoader, KSplatLoader } from '@mkkellogg/gaussian-splats-3d';



export type AbortablePromise = {
    id: number,
    abortHandler: (reason: string) => void;
    promise: Promise<void>;
}


type AddSplatSceneOptions = {
    showLoadingUI?: boolean,
    showInfo?: boolean,
    showControlPlane?: boolean,
    progressiveLoad?: boolean,
    splatAlphaRemovalThreshold?: number,
    position?: [number, number, number],
    rotation?: [number, number, number, number],
    scale?: [number, number, number],
    onProgress: (perc: number, label: string, status: number) => void,
    // ...

} & ({})

export type _DropInViewer = Group & {
    viewer: {
        antialiased: boolean;
        focalAdjustment: number,
        dynamicScene: boolean,
        addSplatScene: (path: string, opts: AddSplatSceneOptions) => AbortablePromise;
        removeSplatScene(number: number): Promise<void>;
        removeSplatScenes(): Promise<void>;
        getSceneCount: () => number;
    },
    splatMesh: SplatMesh;
}

export type SplatMesh = Mesh & {
    computeBoundingBox: (applySceneTransforms: boolean, sceneIndex: number) => Box3;
    baseSplatTree: SplatTree | null,
    buildSplatTree: (minAlphas: number[], onSplatTreeIndexesUpload: Function, onSplatTreeConstruction: Function) => void,
    calculatedSceneCenter: Vector3,
    computeDistancesOnGPU: (modelViewProjMatrix: Matrix4, outComputedDistances: {}) => void,
    disposed: boolean,
    dynamicMode: boolean,
    enableDistancesComputationOnGPU: boolean,
    enableOptionalEffect: boolean,
    fillTransformsArray: Array<any>,
    finalBuild: boolean,
    firstRenderTime: number,
    getSplatCenter: (globalIndex: number, outCenter: Vector3, applySceneTransform: any) => void,
    lastRenderer: null | any,
    logLevel: number,
    sceneFadeInRateMultiplier: number,
    // more...
    splatTree: SplatTree | null,
}

type SplatTree = any;
