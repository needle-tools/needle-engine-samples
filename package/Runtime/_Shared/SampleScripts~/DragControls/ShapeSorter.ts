import { Behaviour, DragControls, DragTarget, GameObject, Mathf, getWorldPosition, getWorldQuaternion, serializable, setWorldPosition, setWorldQuaternion } from "@needle-tools/engine";
import { Object3D, Quaternion, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

type Home = { position: Vector3, rotation: Quaternion };

/**
 * A shape sorter toy: each hole in the lid is a DragTarget that only accepts its own shape
 * (DragTarget.allowedObjects), so a wrong shape is refused and flies back. A shape posted through
 * its hole drops into the box. Once every hole has had its shape, the lid opens, the shapes come
 * back out onto the table and the game starts over.
 */
export class ShapeSorter extends Behaviour {

    /** The holes in the lid, one DragTarget each, with the shape it takes in its allowed objects. */
    @serializable(DragTarget)
    holes: DragTarget[] = [];

    /** The lid, hinged along its local X axis. */
    @serializable(Object3D)
    lid?: Object3D;

    /** How far the lid opens, in degrees. */
    @serializable()
    lidOpenAngle: number = 105;

    /** How far a posted shape sinks into the box before it disappears, in metres. */
    @serializable()
    sinkDepth: number = 0.25;

    private readonly homes = new Map<Object3D, Home>();
    private readonly posted = new Set<Object3D>();
    private unsubscribe: Function[] = [];
    private lidClosed = new Quaternion();

    awake(): void {
        this.unsubscribe = [];
    }

    start(): void {
        if (this.lid) this.lidClosed.copy(this.lid.quaternion);
        for (const hole of this.holes) {
            for (const shape of hole.allowedObjects) {
                if (shape) this.homes.set(shape, { position: getWorldPosition(shape).clone(), rotation: getWorldQuaternion(shape).clone() });
            }
        }
    }

    onEnable(): void {
        for (const hole of this.holes) {
            this.unsubscribe.push(hole.objectDropped.addEventListener(e => this.startCoroutine(this.post(hole, e.object))));
        }
    }

    onDisable(): void {
        for (const unsubscribe of this.unsubscribe) unsubscribe();
        this.unsubscribe.length = 0;
    }

    private *post(hole: DragTarget, shape: Object3D) {
        // let the fly-in finish, then take it back from the hole so it can drop through
        yield* this.wait(hole.flyDuration + 0.05);
        this.setDraggable(shape, false);
        hole.releaseObject(shape);
        const from = getWorldPosition(shape).clone();
        const to = from.clone().add(new Vector3(0, -this.sinkDepth, 0));
        for (const t of this.animate(0.3)) {
            setWorldPosition(shape, from.clone().lerp(to, t * t));
            yield;
        }
        shape.visible = false;
        this.posted.add(shape);
        if (this.posted.size >= this.holes.length) yield* this.reopen();
    }

    private *reopen() {
        yield* this.wait(0.3);
        yield* this.turnLid(0, 1);
        // out through the open top in a little arc, back to where each one started
        const top = this.lid ? getWorldPosition(this.lid).clone() : new Vector3();
        const shapes = [...this.posted];
        for (const shape of shapes) {
            const home = this.homes.get(shape);
            if (!home) continue;
            shape.visible = true;
            setWorldQuaternion(shape, home.rotation);
            const from = top.clone().add(new Vector3(0, -0.15, 0.1));
            for (const t of this.animate(0.45)) {
                const p = from.clone().lerp(home.position, t);
                p.y += Math.sin(t * Math.PI) * 0.25;
                setWorldPosition(shape, p);
                yield;
            }
            setWorldPosition(shape, home.position);
            this.setDraggable(shape, true);
        }
        this.posted.clear();
        yield* this.wait(0.2);
        yield* this.turnLid(1, 0);
    }

    private *turnLid(from: number, to: number) {
        const lid = this.lid;
        if (!lid) return;
        const open = this.lidClosed.clone().multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Mathf.toRadians(this.lidOpenAngle)));
        for (const t of this.animate(0.5)) {
            const eased = t * t * (3 - 2 * t);
            lid.quaternion.slerpQuaternions(this.lidClosed, open, Mathf.lerp(from, to, eased));
            yield;
        }
    }

    private setDraggable(shape: Object3D, draggable: boolean) {
        const drag = GameObject.getComponent(shape, DragControls);
        if (drag) drag.enabled = draggable;
    }

    /** Progress from 0 to 1 over the given seconds, one value per frame, ending on exactly 1. */
    private *animate(duration: number) {
        const start = this.context.time.time;
        while (true) {
            const t = Math.min(1, (this.context.time.time - start) / duration);
            yield t;
            if (t >= 1) return;
        }
    }

    private *wait(seconds: number) {
        const end = this.context.time.time + seconds;
        while (this.context.time.time < end) yield;
    }
}
