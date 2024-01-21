import { Behaviour, serializable } from "@needle-tools/engine";
import { Mesh, Object3D, Vector3 } from "three";
import { Pathfinding } from 'three-pathfinding';

export class Navmesh extends Behaviour {
    
    static Pathfinding?: Pathfinding;
    static ZoneData?: any;

    static IsOnNavMesh(position: Vector3): boolean {
        return Navmesh.Pathfinding.getGroup(Navmesh.ZONE, position, false) != null;
    }
    
    static FindPath(from: Vector3, to: Vector3): Vector3[] {
        let a = from;
        let b = to;

        let path = Navmesh.findPath(a, b);

        // invalid a, b
        if (!path) {
            let fromEdited = false;
            if (!Navmesh.isPointOnNavMesh(a)) {
                const fixedA = Navmesh.getClosestVertex(from)!;
                if (fixedA) {
                    a = fixedA;
                }
            }

            let toEdited = false;
            if (!Navmesh.isPointOnNavMesh(b)) {
                const fixedB = Navmesh.getClosestVertex(to) ?? to;
                if (fixedB) {
                    b = fixedB;
                }
            }

            path = Navmesh.findPath(a, b);

            if (path) {
                if (fromEdited) {
                    path = path.slice(1, path.length - 1);
                    path.unshift(from);
                }
                
                if (toEdited) {
                    path = path.slice(0, path.length - 2);
                    path.push(to);
                }
            }
        }

        return path;
    }

    static isPointOnNavMesh(point: Vector3): boolean {

        const vertices = Navmesh.ZoneData?.vertices;
        const groups = Navmesh.ZoneData?.groups;

        let isContained = false;

        if (groups === undefined || vertices === undefined) 
            return false;

        for (const node of groups) {
            if (Navmesh.isPointInGroup(point, node, vertices)) {
                isContained = true;
                break;
            }
        }
        return isContained;
    }

    static isPointInGroup(point: Vector3, group: Array<any>, vertices: Array<Vector3>) {
        let isContained = false;
        for (const poly of group) {
            if (Navmesh.isPointInPoly(point, poly, vertices)) {
                isContained = true
                break;
            }
        }

        return isContained;
    }

    static isPointInPoly(point: Vector3, poly: any, vertices: Array<Vector3>): boolean {
        // reference point will be the centroid of the polygon
        // We need to rotate the vector as well as all the points which the polygon uses
    
        var lowestPoint = 100000;
        var highestPoint = -100000;
    
        var polygonVertices: Array<Vector3> = [];
        poly.vertexIds.forEach((vId: number) => {
          lowestPoint = Math.min(vertices[vId].y, lowestPoint);
          highestPoint = Math.max(vertices[vId].y, highestPoint);
          polygonVertices.push(vertices[vId]);
        });
    
        if (point.y < highestPoint + 0.5 && point.y > lowestPoint - 0.5 &&
          this.isVectorInPolygon(polygonVertices, point)) {
          return true;
        }
        return false;
    }

    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]
    static isVectorInPolygon (poly, pt): boolean {
        for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
        ((poly[i].z <= pt.z && pt.z < poly[j].z) || (poly[j].z <= pt.z && pt.z < poly[i].z)) && (pt.x < (poly[j].x - poly[i].x) * (pt.z - poly[i].z) / (poly[j].z - poly[i].z) + poly[i].x) && (c = !c);
        return c;
    }

    private static getClosestVertex(position: Vector3): Vector3 | null {
        let minDistance = Number.MAX_SAFE_INTEGER;
        let safePosition: Vector3 | null = null;
        Navmesh.ZoneData?.groups.forEach(group => {
            group.forEach(poly => {
                const center = (poly.centroid as Vector3);
                if (center) {
                    const dis = center.distanceToSquared(position);
                    if (minDistance > dis) {
                        minDistance = dis;
                        safePosition = center;
                    } 
                }
            });
        });

        return safePosition;
    }

    private static findPath(from: Vector3, to: Vector3): Vector3[] {
        const groupID = Navmesh.Pathfinding.getGroup(Navmesh.ZONE, from);
        const path = Navmesh.Pathfinding.findPath(from, to, Navmesh.ZONE, groupID);

        if (path)
            path.unshift(from);

        return path;
    }

    static ZONE = 'default';

    @serializable(Object3D)
    navMesh?: Object3D;

    awake(): void {
        if (!this.navMesh) return;

        const pathfinding = Navmesh.Pathfinding ??= new Pathfinding();

        if (this.navMesh instanceof Mesh) {
            const zoneData = Pathfinding.createZone(this.navMesh.geometry);
            Navmesh.ZoneData = zoneData;
            pathfinding.setZoneData(Navmesh.ZONE, zoneData);
        }
    }
}