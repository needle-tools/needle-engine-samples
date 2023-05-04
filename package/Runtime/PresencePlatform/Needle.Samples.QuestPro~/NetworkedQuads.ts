import { Behaviour, GameObject, WebXRPlaneTracking, serializable, syncField } from "@needle-tools/engine";
import { WebXRPlaneTrackingEvent } from "@needle-tools/engine";
import { Mesh, BufferGeometry, Material, MaterialLoader, BufferGeometryLoader, Matrix4 } from "three";

class MeshData {
    pose: Matrix4;
    geometry: BufferGeometry;
    material: Material;
    version: number;
}

const version = 3;

export class NetworkedQuads extends Behaviour {

    @syncField("onNewQuads")
    private chats: Array<string> = [];

    @syncField("onNewGeometry")
    private geometry: Array<MeshData> = [];

    onEnable(): void {
        const planeTracking = GameObject.findObjectOfType(WebXRPlaneTracking);
        planeTracking?.addEventListener("plane-tracking", this.onPlaneTracking);
        console.log(this.guid, this);
    }

    private onPlaneTracking = (evt: CustomEvent<WebXRPlaneTrackingEvent>) => {
        console.error(evt.detail.context.mesh);
        const mesh = evt.detail.context.mesh as Mesh;
        this.geometry.push({ geometry: mesh.geometry, material: mesh.material, version: version, pose: mesh.matrixWorld });
        
        // cleanup - remove outdated entries
        this.geometry = this.geometry.filter(x => x.version === version);
    }

    private onNewQuads(newQuads, oldQuads) {
        console.warn("new quads", newQuads);
    }

    private onNewGeometry(newGeometry, oldGeometry) {
        console.log("new geometry", this.guid, newGeometry);

        // add mesh to scene
        for (let i = 0; i < newGeometry.length; i++) {
            
            const geo = newGeometry[i];
            if (geo.version !== version) continue;

            try {
                const loader = new MaterialLoader();
                const mat = loader.parse(geo.material);
                const geoLoader = new BufferGeometryLoader();
                const geometry = geoLoader.parse(geo.geometry);
                
                const mesh = new Mesh(geometry, mat);
                const floatArray = geo.pose.elements;
                mesh.matrix.fromArray(floatArray);
                mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
                this.gameObject.add(mesh);

                GameObject.setActive(mesh, true);
                console.log(mesh);
            } catch (e) {
                console.warn(e);
            }

            // const mesh = new Mesh(newGeometry[i].geometry.data, newGeometry[i].material);
            // this.gameObject.add(mesh);
        }
    }

    addNewQuad(val: string) {
        console.warn("received value", val)
        this.chats.push(val);
        this.chats = this.chats;
    }
}