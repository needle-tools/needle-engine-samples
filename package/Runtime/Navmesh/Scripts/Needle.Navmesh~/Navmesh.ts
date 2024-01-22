import { Behaviour, Gizmos, getParam, serializable, setWorldPositionXYZ, setWorldRotationXYZ, setWorldScale } from "@needle-tools/engine";
import { Mesh, MeshBasicMaterial, Vector3, Color, ColorRepresentation } from "three";
import { Pathfinding } from 'three-pathfinding';

const debug = getParam("debugnavmesh");

export class Navmesh extends Behaviour {

    // ------- static API --------

    static Pathfinding?: Pathfinding;
    static ZoneData?: any;

    static IsOnNavMesh(position: Vector3): boolean {
        return Navmesh.Pathfinding.getGroup(Navmesh.ZONE, position, false) != null;
    }

    static FindPath(from: Vector3, to: Vector3, debugDuration?: number): Vector3[] {
        let a = from;
        let b = to;

        let path = Navmesh.findPath(a, b);

        // invalid a, b
        if (!path) {
            let fromEdited = false;
            if (!Navmesh.isPointOnNavMesh(a)) {
                const fixedA = Navmesh.getClosestCentroid(from)!;
                if (fixedA) {
                    a = fixedA;
                }
            }

            let toEdited = false;
            if (!Navmesh.isPointOnNavMesh(b)) {
                const fixedB = Navmesh.getClosestCentroid(to) ?? to;
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

        // visualize path
        if ((debug || debugDuration) && debugDuration !== -1) {
            Navmesh.displayPath(path, debugDuration);
        }

        return path ?? new Vector3[0];
    }

    static displayPath(path: Vector3[] | undefined, debugDuration?: number, color: ColorRepresentation = 0xff9747, depthTest: boolean = false) {
        if (path && path.length >= 2) {
            const duration = debugDuration ?? 0.5;

            for (let i = 0; i < path.length - 1; i++) {
                const a = path[i];
                const b = path[i + 1];
                Gizmos.DrawLine(a, b, color, duration, depthTest);
                Gizmos.DrawSphere(a, 0.1, color, duration, depthTest);
            }
            Gizmos.DrawSphere(path[path.length - 1], 0.1, color, duration, depthTest);
        }
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
    static isVectorInPolygon(poly, pt): boolean {
        for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
            ((poly[i].z <= pt.z && pt.z < poly[j].z) || (poly[j].z <= pt.z && pt.z < poly[i].z)) && (pt.x < (poly[j].x - poly[i].x) * (pt.z - poly[i].z) / (poly[j].z - poly[i].z) + poly[i].x) && (c = !c);
        return c;
    }

    private static getClosestCentroid(position: Vector3): Vector3 | null {
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

    private static findPath(from: Vector3, to: Vector3): Vector3[] | undefined {
        const groupID = Navmesh.Pathfinding.getGroup(Navmesh.ZONE, from);
        const path = Navmesh.Pathfinding.findPath(from, to, Navmesh.ZONE, groupID);

        if (path)
            path.unshift(from);

        return path;
    }

    static ZONE = 'default';

    // --------- component ---------

    // @nonSerialized
    @serializable(Mesh)
    navMesh: Mesh;

    awake(): void {
        if (!this.navMesh) {
            console.error("No navmesh data.");
            return;
        }

        const pathfinding = Navmesh.Pathfinding ??= new Pathfinding();
        const zoneData = Navmesh.ZoneData = Pathfinding.createZone(this.navMesh.geometry);
        pathfinding.setZoneData(Navmesh.ZONE, zoneData);

        if (debug) {
            this.createDebugMesh(new Color(0.039, 0.645, 0.754), 0.15, false);
            this.createDebugMesh(new Color(0.039 * .5, 0.645 * .5, 0.754 * .5), 1, true);
        }
    }

    private createDebugMesh(color: Color, alpha: number, wireframe: boolean): Mesh {
        // setup
        const parent = this.context.scene.children[0];
        const clonedMesh = this.navMesh.clone();
        parent.add(clonedMesh);

        // transform
        setWorldPositionXYZ(clonedMesh, 0, 0, 0);
        setWorldRotationXYZ(clonedMesh, 0, 0, 0);
        setWorldScale(clonedMesh, new Vector3(1, 1, 1));

        // material
        const mat = new MeshBasicMaterial();
        mat.wireframe = wireframe;
        mat.transparent = alpha <= 0.99;
        mat.opacity = alpha;
        mat.color = color;
        
        clonedMesh.material = mat;

        return clonedMesh;
    }
}