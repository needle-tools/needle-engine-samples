import { Behaviour, GltfExport, IPointerClickHandler } from "@needle-tools/engine";

export class ExportGltf extends Behaviour implements IPointerClickHandler {
    
    exportNow() {
        const exporter = new GltfExport(); 
        exporter.binary = true;
        exporter.exportNow("scene");
    }

    onPointerClick() {
        this.exportNow();
    }
}