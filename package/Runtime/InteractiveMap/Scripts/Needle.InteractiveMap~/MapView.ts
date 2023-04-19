import { Behaviour } from "@needle-tools/engine";
import { LODFrustum, LODRaycast, OpenStreetMapsProvider } from "geo-three";
import { MapView } from "geo-three";
import { Object3D, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

export function latLongToVector3(latitude: number, longitude: number): Vector3 {
    // The geo-three methods convert into world space (based on earth' radius)
    // Often, it's desired to convert into normalized space (between -0.5 and 0.5) instead.

    // const converted = UnitsUtils.datumsToSpherical(latitude, longitude);
    // return new Vector3(converted.x, 0, converted.y);

    const x = longitude / 180.0 * 0.5;
    let y = Math.log(Math.tan((90 + latitude) * Math.PI / 360.0)) / (Math.PI / 180.0);

    y = y / 180.0;
    y = y * -0.5;

    return new Vector3(x, 0, y);

}

export class DisplayMap extends Behaviour {

    private mapObject: Object3D;

    // https://tentone.github.io/geo-three/docs/index.html
    onEnable(): void {
        const provider = new OpenStreetMapsProvider();
        const map = new MapView(MapView.PLANAR, provider);
        this.mapObject = map as Object3D;
        this.mapObject.scale.set(1,1,1);
        this.gameObject.add(this.mapObject);
    }

    update() {
        // this is just to ensure the materials aren't using depth write, so 
        // we can render directly above without z-fighting.
        this.mapObject.traverse((node) => {
            if (!node.isMesh) return;
            node.material.depthWrite = false;
        });
    }
}