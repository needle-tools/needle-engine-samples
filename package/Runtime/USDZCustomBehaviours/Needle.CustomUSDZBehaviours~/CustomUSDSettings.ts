import { Behaviour, GameObject, USDZExporter, serializable } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

export class CustomUSDSettings extends Behaviour {
    
    onEnable() {
        const exporter = GameObject.findObjectOfType(USDZExporter);
        if (!exporter) return;

        exporter.anchoringType = "plane";
        exporter.planeAnchoringAlignment = "vertical";
    }
}