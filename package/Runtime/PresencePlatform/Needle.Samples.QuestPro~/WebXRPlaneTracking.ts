import { Behaviour, GameObject, MeshCollider, serializable, WebXR } from "@needle-tools/engine";
import { WebXREvent } from "@needle-tools/engine";
import { BufferAttribute, BufferGeometry, Object3D, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

export class WebXRPlaneTracking extends Behaviour {

    @serializable(GameObject)
    planeTemplate : GameObject;

    start() {
        WebXR.addEventListener(WebXREvent.XRUpdate, this.onXRUpdate.bind(this));
    }

    onXRUpdate(evt) {
        const frame = evt.frame;
        const timestamp = evt.timestamp;
        this.rig = evt.rig;
        this.processPlanes(timestamp, frame);
    }
    
    private rig: Object3D;

    private planeId = 1;
    private allPlanes = new Map();
    
    processPlanes(timestamp, frame) {
        const renderer = this.context.renderer;

        // parenting tracked planes to the XR rig ensures that they synced with the real-world user data;
        // otherwise they would "swim away" when the user rotates / moves / teleports and so on. 
        // There may be cases where we want that! E.g. a user walks around on their own table in castle builder
        const scene = this.rig;

        const referenceSpace = renderer.xr.getReferenceSpace();

        if (frame.detectedPlanes) {
          this.allPlanes.forEach((planeContext, plane) => {
            if (!frame.detectedPlanes.has(plane)) {
              // plane was removed
              this.allPlanes.delete(plane);
              console.debug("Plane no longer tracked, id=" + planeContext.id);

              scene.remove(planeContext.mesh);
            }
          });

          frame.detectedPlanes.forEach(plane => {
            const planePose = frame.getPose(plane.planeSpace, referenceSpace);
            let planeMesh;

            if (this.allPlanes.has(plane)) {
              // may have been updated:
              const planeContext = this.allPlanes.get(plane);
              planeMesh = planeContext.mesh;

              if (planeContext.timestamp < plane.lastChangedTime) {
                // updated!
                planeContext.timestamp = plane.lastChangedTime;

                const geometry = this.createGeometryFromPolygon(plane.polygon);
                planeContext.mesh.geometry.dispose();
                planeContext.mesh.geometry = geometry;
              }
            } else {
              // new plane
              
              // Create geometry:
              const geometry = this.createGeometryFromPolygon(plane.polygon);
              //const mat = new MeshBasicMaterial({color: 0xffffff, side: DoubleSide});
              //mat.wireframe = true;

              const newPlane = GameObject.instantiate(this.planeTemplate)!;
              newPlane.geometry.dispose();
              newPlane.geometry = geometry;
              // const phyicsMat = newPlane.getComponent(MeshCollider)!.physicsMaterial;
              const mc = newPlane.addNewComponent(MeshCollider);
              mc.convex = true;

              // doesn't seem to work as MeshCollider doesn't have a clear way to refresh itself
              // after the geometry has changed
              // newPlane.getComponent(MeshCollider)!.sharedMesh = newPlane as unknown as Mesh;

              planeMesh = newPlane;
              planeMesh.matrixAutoUpdate = false;
              planeMesh.matrixWorldNeedsUpdate = true; // force update of rendering settings and so on

              scene.add(planeMesh);

              const planeContext = {
                id: this.planeId,
                timestamp: plane.lastChangedTime,
                mesh: planeMesh,
              };

              this.allPlanes.set(plane, planeContext);
              console.debug("New plane detected, id=" + this.planeId);
              this.planeId++;
            }

            if (planePose) {
              planeMesh.visible = true;
              planeMesh.matrix.fromArray(planePose.transform.matrix);
            } else {
              planeMesh.visible = false;
            }
          });
        }
      }

      createGeometryFromPolygon(polygon) {
        const geometry = new BufferGeometry();

        const vertices = [];
        const uvs = [];
        polygon.forEach(point => {
          vertices.push(point.x, point.y, point.z);
          uvs.push(point.x, point.z);
        })

        // get the normal of the plane by using the cross product of B-A and C-A
        const a = new Vector3(vertices[0], vertices[1], vertices[2]);
        const b = new Vector3(vertices[3], vertices[4], vertices[5]);
        const c = new Vector3(vertices[6], vertices[7], vertices[8]);
        const ab = new Vector3();
        const ac = new Vector3();
        ab.subVectors(b, a);
        ac.subVectors(c, a);
        ab.cross(ac);
        ab.normalize();

        const normals = [];
        for (let i = 0; i < vertices.length / 3; i++) {
            normals.push(ab.x, ab.y, ab.z);
        }

        const indices = [];
        for(let i = 2; i < polygon.length; ++i) {
          indices.push(0, i-1, i);
        }

        geometry.setAttribute('position',
          new BufferAttribute(new Float32Array(vertices), 3));
        geometry.setAttribute('uv',
          new BufferAttribute(new Float32Array(uvs), 2))
        geometry.setIndex(indices);
        geometry.setAttribute('normal',
          new BufferAttribute(new Float32Array(normals), 3));

        return geometry;
      }
}
