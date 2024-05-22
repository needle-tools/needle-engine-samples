import { Behaviour, getWorldPosition } from "@needle-tools/engine";
import { Mathf } from "@needle-tools/engine";
import { serializeable } from "@needle-tools/engine";
import { getWorldQuaternion } from "@needle-tools/engine";
import { getParam } from "@needle-tools/engine";

import { Object3D, Vector3, Quaternion, 
    CatmullRomCurve3, CubicBezierCurve3, Curve, LineCurve3, 
    BufferGeometry, Line, LineBasicMaterial } from "three";

const debug = getParam("debugsplines");

class Spline {
    @serializeable(Vector3)
    position!: Vector3;
    @serializeable(Quaternion)
    rotation!: Quaternion;
    @serializeable(Vector3)
    tangentIn!: Vector3;
    @serializeable(Vector3)
    tangentOut!: { x: number, y: number, z: number };
}

enum SplineType {
    CatmullRom = 0,
    Bezier = 1,
    Linear = 2
}


//@dont-generate-component
export class SplineContainer extends Behaviour {
    @serializeable(Spline)
    spline: Spline[] | null = null;

    // @serializeable()
    // private editType: SplineType = SplineType.CatmullRom;

    @serializeable()
    private closed: boolean = false;

    set showSpline(val: boolean) {
        if (val && !this._builtCurve) this.buildCurveNow();
        if (!this._debugLine) return;
        this._debugLine.visible = val;
    }

    public get curve(): Curve<Vector3> | null {
        if (!this._builtCurve) this.buildCurveNow();
        return this._curve;
    }

    public getPointAt(t: number, target?: Vector3): Vector3 {
        if (!this.curve) return new Vector3();

        const pos = this.curve.getPointAt(Mathf.clamp01(t), target);
        const worldMatrix = (this.gameObject as any as Object3D)?.matrixWorld ?? undefined;

        if (worldMatrix)
            pos.applyMatrix4(worldMatrix); 

        return pos;
    }

    public getTangentAt(t: number, target?: Vector3): Vector3 {
        if(!this.curve) return target ?? new Vector3();
        const wr = getWorldQuaternion(this.gameObject);
        return this.curve.getTangentAt(Mathf.clamp01(t)).applyQuaternion(wr);;
    }

    private _curve: Curve<Vector3> | null = null;
    private _builtCurve: boolean = false;
    private _debugLine: Object3D | null = null;

    awake() {
        if (debug) {
            console.log(this.name, this);
            this.buildCurveNow();
        }
    }

    private buildCurveNow() {
        if (this._builtCurve) return;
        this._builtCurve = true;
        if (!this.spline) return;
        this.createCatmullRomCurve();
        // TODO: Unity supports spline interpolation type per knot which we don't support right now. Additionally EditType is deprecated. For simplicity we're just supporting CatmullRom for now.
        // switch (this.editType) {
        //     case SplineType.CatmullRom:
        //         this.createCatmullRomCurve();
        //         break;
        //     case SplineType.Bezier:
        //         console.warn("Bezier spline not implemented yet", this.name);
        //         this.createCatmullRomCurve();
        //         // this.createBezierCurve();
        //         break;
        //     case SplineType.Linear:
        //         this.createLinearCurve();
        //         break;
        // }
        this.buildDebugCurve();
    }

    private createCatmullRomCurve() {
        if (!this.spline) return;
        const points = this.spline.map(knot => new Vector3(-knot.position.x, knot.position.y, knot.position.z));
        if(points.length === 1) points.push(points[0]);
        this._curve = new CatmullRomCurve3(points, this.closed);
    }

    private createBezierCurve() {
        if (!this.spline) return;

        for (let k = 0; k < this.spline.length; k++) {
            const k0 = this.spline[k];
            let nextIndex = k + 1;
            if (nextIndex >= this.spline.length) {
                if (!this.closed) break;
                nextIndex = 0;
            }
            const k1 = this.spline[nextIndex];
            // points
            const p0 = new Vector3(-k0.position.x, k0.position.y, k0.position.z);
            const p1 = new Vector3(-k1.position.x, k1.position.y, k1.position.z);
            // tangents
            const t0 = new Vector3(-k0.tangentOut.x, k0.tangentOut.y, k0.tangentOut.z);
            const t1 = new Vector3(-k1.tangentIn.x, k1.tangentIn.y, k1.tangentIn.z);
            // rotations
            // const q0 = k0.rotation;// new Quaternion(k0.rotation.value.x, k0.rotation.value.y, k0.rotation.value.z, k0.rotation.value.w);
            // const q1 = k1.rotation;// new Quaternion(k1.rotation.value.x, k1.rotation.value.y, k1.rotation.value.z, k1.rotation.value.w);
            // const a = new Vector3(0,1,0);
            // const angle = Math.PI*.5;
            // t0.sub(p0).applyQuaternion(q0).add(p0);
            // t1.sub(p1).applyQuaternion(q1).add(p1);
            t0.add(p0);
            // t0.applyQuaternion(q0);
            t1.add(p1);
            const curve = new CubicBezierCurve3(p0, t0, t1, p1);
            this._curve = curve;
        }
    }

    private createLinearCurve() {
        if (!this.spline) return;
        const points = this.spline.map(knot => new Vector3(-knot.position.x, knot.position.y, knot.position.z));
        if (this.closed) points.push(points[0]);
        this._curve = new LineCurve3(points.at(0), points.at(1));
    }

    private buildDebugCurve() {
        if (debug && this.spline) {
            const material = new LineBasicMaterial({
                color: 0x6600ff,
            });
            const res = this.spline.length * 10;
            // preview
            if (!this._curve) return;
            const splinePoints = this._curve.getPoints(res);
            if(splinePoints.length >= 1) {
                console.log("splinePoints", splinePoints[0], splinePoints)
            }
            const geometry = new BufferGeometry().setFromPoints(splinePoints);
            this._debugLine = new Line(geometry, material);
            (this.gameObject as any as Object3D)?.add(this._debugLine);
        }
    }
}


// class SplineCurve {

//     private spline: Spline;

//     constructor(spline: Spline) {
//         this.spline = spline;
//     }

//     getPoints(num: number): Vector3[] {
//         const points: Vector3[] = [];
//         const samplePerKnot = num / this.spline.length;
//         for (let k = 1; k < this.spline.length; k++) {
//             const cur = this.spline[k];
//             const prev = this.spline[k - 1];

//             for (let i = 0; i < samplePerKnot; i++) {
//                 const t = i / (samplePerKnot - 1);
//                 console.log(CurveUtils);
//                 const x = this.interpolate(-prev.Position.x, -cur.Position.x, -prev.tangentOut.x, -cur.TangentIn.x, t);
//                 const y = this.interpolate(prev.Position.y, cur.Position.y, prev.tangentOut.y, cur.TangentIn.y, t);
//                 const z = this.interpolate(prev.Position.z, cur.Position.z, prev.tangentOut.z, cur.TangentIn.z, t);
//                 points.push(new Vector3(x, y, z));
//             }
//         }

//         return points;
//     }

//     interpolate(p0, p1, p2, p3, t) {

//         var v0 = (p2 - p0) * 0.5;
//         var v1 = (p3 - p1) * 0.5;
//         var t2 = t * t;
//         var t3 = t * t2;
//         return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (- 3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
//     }
// }
