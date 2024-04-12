import { Behaviour, Mathf, MeshRenderer, delay, getTempVector, randomNumber, serializable, setWorldPosition } from "@needle-tools/engine";
import { Vector2, Vector3, ColorRepresentation, MeshStandardMaterial, Color } from "three";
import { Navmesh } from "./Navmesh";

export class NavmeshDemo_Agent extends Behaviour {
    @serializable()
    speed: number = 0.5;

    @serializable()
    delayBetweenRandomTargets: number = 1;

    @serializable(Vector2)
    squareArea: Vector2 = new Vector2(5, 5);

    @serializable(MeshRenderer)
    bodyRenderer?: MeshRenderer;

    @serializable()
    moveRandomlyWhenIdle: boolean = true;

    private currentDriveCoroutine?: Generator;
    private isRoaming = false;
    private isMoving = false;

    private static instanceCount = 0;
    private instanceId: number = -1;
    private instanceColor?: ColorRepresentation;
    private colors: ColorRepresentation[] = [
        0xff8800,// orange
        0xf0fc03, // lime
        0xffd000, // yellow
        0xff4800, // red
        0x86b327 // green
    ];

    awake() {
        this.instanceId = NavmeshDemo_Agent.instanceCount++;
        this.instanceColor = this.colors[this.instanceId % this.colors.length];

        const mat = this.bodyRenderer?.sharedMaterial as MeshStandardMaterial;
        if (mat) {
            const newMat = mat.clone();
            newMat.color = new Color(this.instanceColor);
            this.bodyRenderer!.sharedMaterial = newMat;
        }

        this.isRoaming = this.moveRandomlyWhenIdle;
        setTimeout(() => this.moveToRandomTarget(), this.delayBetweenRandomTargets);
    }

    async moveToRandomTarget() {
        if (!this.isRoaming || !this.moveRandomlyWhenIdle) return;

        this.stopMoving();

        const b = this.squareArea;

        const x = Mathf.random(-b.x, b.x);
        const z = Mathf.random(-b.y, b.y);

        const target = new Vector3(x, this.worldPosition.y, z);
        const from = this.worldPosition;

        // get the Y of the navmesh on the XZ cords
        // this won't solve issues on slopes
        const targetPolyCentroid = Navmesh.getClosestCentroid(target);
        if (targetPolyCentroid) {
            target.y = targetPolyCentroid.y;
        }

        const path = Navmesh.FindPath(from, target, -1); // disables the visualization

        const onArrive = async () => {
            await delay(this.delayBetweenRandomTargets * 1000);
            this.moveToRandomTarget();
        };

        if (path)
            this.currentDriveCoroutine = this.startCoroutine(this.driveAlongPath(path, onArrive));
        else
            await onArrive();
    }

    moveTo(target: Vector3, onArrived?: () => Promise<void>) {
        this.stopMoving();

        const path = Navmesh.FindPath(this.worldPosition, target, -1); // disables the visualization

        if (path) {
            this.isRoaming = false;
            this.isMoving = true;
            this.currentDriveCoroutine = this.startCoroutine(this.driveAlongPath(path, async () => {
                this.isMoving = false;

                await onArrived?.();
                await delay(this.delayBetweenRandomTargets * 1000);

                if (!this.isMoving) {
                    this.isRoaming = true;
                    this.moveToRandomTarget();
                }
            }));
        }
        else {
            this.moveToRandomTarget();
        }
    }

    stopMoving() {
        if (this.currentDriveCoroutine) {
            this.stopCoroutine(this.currentDriveCoroutine);
            this.currentDriveCoroutine = undefined;
        }
    }

    private refFWD = new Vector3(0, 0, 1);
    *driveAlongPath(path: Vector3[], onArrived?: () => Promise<void>) {
        const times: number[] = [];
        let totalDistnace = 0;

        if (!path || path.length < 2) {
            console.warn("invalid path");
        }

        // calculate time duration of every segment.
        for (let i = 0; (path && path.length >= 2) && i < path.length - 1; i++) {
            const point = path[i];
            const nextPoint = path[i + 1];
            const distance = point.distanceTo(nextPoint);
            times.push(distance / this.speed);
            totalDistnace += distance;
        }

        const totalTime = totalDistnace / this.speed;
        Navmesh.displayPath(path, totalTime, this.instanceColor, true);

        const time = this.context.time;
        let startTime = time.time;
        while (true) {
            const driveDuration = time.time - startTime;
            let totalDuration = 0;
            let currentIndex = -1;

            for (let i = 0; i < times.length; i++) {
                const segmentDuration = times[i] + totalDuration;
                if (driveDuration < segmentDuration) { // is current segment
                    currentIndex = i;
                    break;
                }
                totalDuration += times[i];
            }

            if (currentIndex == -1) break;

            const segmentDuration = times[currentIndex];
            const timeInSegment = driveDuration - totalDuration;
            const t = Mathf.clamp01(timeInSegment / segmentDuration);

            const a = path[currentIndex];
            const b = path[currentIndex + 1];

            if (!a || !b) break;

            // get flat diretional vector
            const dir = getTempVector(b).sub(a);
            dir.y = 0;
            dir.normalize();

            this.gameObject.position.copy(a).lerp(b, t);
            this.gameObject.quaternion.setFromUnitVectors(this.refFWD, dir);
            yield null;
        }

        // snap to end goal
        setWorldPosition(this.gameObject, path[path.length - 1]);

        // callback
        onArrived?.();
    }
}