import { Behaviour, CornerGrabAction, DragControls, DragMode, DragTarget, EdgeGrabAction, findObjectOfType, GameObject, getBoundingBox, OrbitControls, serializable } from "@needle-tools/engine";
import { Box3, Matrix4, Object3D, Ray, Vector2, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

const _box = new Box3();
const _invMatrix = new Matrix4();
const _point = new Vector3();
const _camPos = new Vector3();
const _ray = new Ray();
const svgNS = "http://www.w3.org/2000/svg";

/** When a {@link HintBubble} is shown. */
export enum HintShowMode {
    /** Until the hint has been used, see hideAfterDrag. */
    Always = 0,
    /** Only while the user drags something the DragTarget on this object accepts: a hint saying where it can go. */
    WhileDraggingAccepted = 1,
    /** Only while a dragged object hovers one of the DragTarget's slots, pointing at that slot. Once one
     *  is used, every hint of this kind with the same text goes away, so it can go on many targets. */
    WhileHovering = 2,
}

/**
 * A text bubble next to an object with an arrow pointing at it, telling the user what they can do
 * with it. Add it next to a DragControls, or next to a DragTarget to say where a dragged object can
 * go. Drawn as HTML over the canvas, so it is not shown in XR.
 */
export class HintBubble extends Behaviour {

    /** What the user can do here. Leave empty to describe the DragControls or DragTarget on this object. */
    @serializable()
    text: string = "";

    /** Where the bubble sits, in screen pixels from the object: X right, Y up. */
    @serializable(Vector2)
    screenOffset: Vector2 = new Vector2(90, 70);

    /** Only show the hint while the camera is closer than this. 0 shows it at any distance. */
    @serializable()
    maxDistance: number = 0;

    /** Hide the hint while another object is in front of this one, for example a wall. */
    @serializable()
    hideWhenOccluded: boolean = true;

    /** When the hint is shown. */
    @serializable()
    showWhen: HintShowMode = HintShowMode.Always;

    /** Hide the hint for good once it has been used: the object dragged, or for a DragTarget hint something dropped onto it. */
    @serializable()
    hideAfterDrag: boolean = true;

    /** The object the arrow points at. Defaults to this object. */
    @serializable(Object3D)
    target: Object3D | null = null;

    /** Clicking the bubble moves the camera to the object. Needs OrbitControls on the camera. */
    @serializable()
    clickToFocus: boolean = true;

    /** Space around the object when focused: 1 fits it tightly, larger values keep more of the room in view. */
    @serializable()
    focusPadding: number = 1.6;

    /** Moves the camera to the object, keeping the current viewing direction. */
    focus() {
        const cam = this.context.mainCamera;
        const controls = (cam ? GameObject.getComponent(cam, OrbitControls) : null) ?? findObjectOfType(OrbitControls, this.context);
        if (!controls) return;
        controls.autoRotate = false;
        // keep the clip planes: fitted to a small object, the far plane would cut off the rest of the scene
        controls.fitCamera({ objects: [this.target ?? this.gameObject], immediate: false, fitOffset: this.focusPadding, cameraNearFar: "keep" });
    }

    private root: HTMLElement | null = null;
    private bubble: HTMLElement | null = null;
    private line: SVGLineElement | null = null;
    private dragControls: DragControls | null = null;
    private dragTarget: DragTarget | null = null;
    private unsubscribe: Function[] = [];
    private wasDragged = false;
    private localCenter = new Vector3();
    private radius = 0;
    private centerTarget: Object3D | null = null;
    private occluded = false;
    private nextOcclusionCheck = 0;
    private shown = false;

    /** Texts of WhileHovering hints that have been used. */
    private static readonly usedHoverTexts = new Set<string>();

    awake(): void {
        // everything made here, not lazily: a clone of this component gets copies of these fields and must not share them
        this.localCenter = new Vector3();
        this.centerTarget = null;
        this.wasDragged = false;
        this.shown = false;
        this.unsubscribe = [];
        this.build();
    }

    onEnable(): void {
        this.dragControls = this.gameObject.getComponent(DragControls);
        this.dragTarget = this.gameObject.getComponent(DragTarget);
        if (this.dragTarget && this.showWhen === HintShowMode.WhileDraggingAccepted)
            this.unsubscribe.push(this.dragTarget.objectDropped.addEventListener(() => this.wasDragged = true));
        // used once something is dropped while the hint is up, so it was there to be read
        if (this.dragTarget && this.showWhen === HintShowMode.WhileHovering)
            this.unsubscribe.push(this.dragTarget.objectDropped.addEventListener(() => {
                if (this.shown) HintBubble.usedHoverTexts.add(this.bubble!.textContent ?? "");
            }));
        this.context.domElement.appendChild(this.root!);
        this.bubble!.textContent = this.text || this.describe();
    }

    onDisable(): void {
        for (const unsubscribe of this.unsubscribe) unsubscribe();
        this.unsubscribe.length = 0;
        this.root?.remove();
    }

    /** Measures the object's bounds again. Call this after it changed its shape. */
    refresh() {
        this.centerTarget = null;
    }

    onBeforeRender(): void {
        if (!this.root || !this.bubble || !this.line) return;
        if (this.showWhen === HintShowMode.Always && this.dragControls?.pointerState) this.wasDragged = true;
        const visible = this.shown = this.updatePosition();
        this.root.classList.toggle("hint-bubble-visible", visible);
    }

    private updatePosition(): boolean {
        const target = this.target ?? this.gameObject;
        const cam = this.context.mainCamera;
        if (!cam || this.context.isInXR || !this.measure(target)) return false;
        if (this.hideAfterDrag && this.wasDragged) return false;
        const hovering = this.showWhen === HintShowMode.WhileHovering;
        if (hovering && this.hideAfterDrag && HintBubble.usedHoverTexts.has(this.bubble!.textContent ?? "")) return false;
        let dragged: Object3D | null = null;
        let slot = -1;
        if (this.showWhen === HintShowMode.WhileDraggingAccepted || hovering) {
            dragged = this.dragTarget?.activeAndEnabled ? this.dragTarget.draggedObject : null;
            if (hovering && dragged) slot = this.dragTarget!.currentSlot;
            if (!dragged || (hovering && slot < 0)) {
                // check right away once a drag starts, not with a result from before it
                this.nextOcclusionCheck = 0;
                return false;
            }
        }
        // out of the way while anything is dragged, which leaves the hints saying where it can go
        else if (DragControls.HasAnySelected) return false;
        else if (this.dragControls && !this.dragControls.activeAndEnabled) return false;

        target.updateWorldMatrix(true, false);
        if (slot >= 0) this.dragTarget!.getSlotWorldPosition(slot, _point);
        else _point.copy(this.localCenter).applyMatrix4(target.matrixWorld);
        const distance = cam.getWorldPosition(_camPos).distanceTo(_point);
        if (this.maxDistance > 0 && distance > this.maxDistance) return false;
        if (this.hideWhenOccluded) {
            // a few times a second is plenty, and spread out so many hints don't raycast in the same frame
            const time = this.context.time.time;
            if (time >= this.nextOcclusionCheck) {
                this.nextOcclusionCheck = time + 0.2 + Math.random() * 0.1;
                this.occluded = this.isOccluded(target, dragged, distance);
            }
            if (this.occluded) return false;
        }
        _point.project(cam);
        // behind the camera or far off screen
        if (_point.z > 1 || Math.abs(_point.x) > 1.2 || Math.abs(_point.y) > 1.2) return false;

        const width = this.context.domWidth, height = this.context.domHeight;
        const tx = (_point.x + 1) / 2 * width;
        const ty = (1 - _point.y) / 2 * height;
        // flip to the other side near the screen edges, then keep the bubble on screen
        const w = this.bubble!.offsetWidth / 2 + 8, h = this.bubble!.offsetHeight / 2 + 8;
        let ox = this.screenOffset.x, oy = -this.screenOffset.y;
        if (tx + ox + w > width || tx + ox - w < 0) ox = -ox;
        if (ty + oy + h > height || ty + oy - h < 0) oy = -oy;
        const bx = Math.min(Math.max(tx + ox, w), width - w);
        const by = Math.min(Math.max(ty + oy, h), height - h);
        this.bubble!.style.transform = `translate(${bx}px, ${by}px) translate(-50%, -50%)`;

        // the arrow runs from the bubble's edge to just short of the object
        const halfW = this.bubble!.offsetWidth / 2 + 4, halfH = this.bubble!.offsetHeight / 2 + 4;
        const dx = tx - bx, dy = ty - by;
        const length = Math.hypot(dx, dy);
        const exit = Math.min(dx !== 0 ? halfW / Math.abs(dx) : Infinity, dy !== 0 ? halfH / Math.abs(dy) : Infinity);
        const end = length > 0 ? 1 - 8 / length : 1;
        // the bubble covers the object
        this.line!.style.display = exit >= end ? "none" : "";
        this.line!.setAttribute("x1", String(bx + dx * exit));
        this.line!.setAttribute("y1", String(by + dy * exit));
        this.line!.setAttribute("x2", String(bx + dx * end));
        this.line!.setAttribute("y2", String(by + dy * end));
        return true;
    }

    /** Whether something other than the target sits clearly in front of its centre. Expects _camPos and _point to be set. */
    private isOccluded(target: Object3D, dragged: Object3D | null, distance: number): boolean {
        // things right next to the object, like a neighbouring chess piece, don't count
        const maxDistance = distance - Math.max(this.radius, 0.3);
        if (maxDistance <= 0) return false;
        _ray.origin.copy(_camPos);
        _ray.direction.copy(_point).sub(_camPos).normalize();
        const hits = this.context.physics.raycastFromRay(_ray, {
            maxDistance,
            // skips the target together with its children, and the dragged object hovering in front of it
            testObject: obj => obj !== target && obj !== dragged,
            // a mesh still building its BVH is skipped instead of tested slowly
            allowSlowRaycastFallback: false,
        });
        return hits.length > 0;
    }

    /** A sentence for the DragControls or DragTarget on this object, used while text is empty */
    private describe(): string {
        if (this.showWhen === HintShowMode.WhileDraggingAccepted) return "Drop it here";
        if (this.showWhen === HintShowMode.WhileHovering) return this.dragTarget?.autoRotate ? "Keep holding to turn it" : "Let go to drop it here";
        const drag = this.dragControls;
        if (!drag) return "";
        let action = "Drag to move";
        switch (drag.dragMode) {
            case DragMode.Slide: action = "Drag to slide"; break;
            case DragMode.HingeRotate: action = "Drag to swing"; break;
            case DragMode.Rotate: action = "Drag to rotate"; break;
            case DragMode.Scale: action = "Drag to resize"; break;
            case DragMode.ScaleAndRotate: action = "Drag to resize and rotate"; break;
            case DragMode.SnapToSurfaces: action = "Drag to place it on a surface"; break;
        }
        const extras: string[] = [];
        if (drag.edgeGrab === EdgeGrabAction.Rotate) extras.push("grab an edge to rotate");
        if (drag.edgeGrab === EdgeGrabAction.Stretch) extras.push("grab an edge to stretch");
        if (drag.cornerGrab === CornerGrabAction.Rotate) extras.push("grab a corner to rotate");
        else if (drag.cornerGrab) extras.push("grab a corner to resize");
        return extras.length ? `${action}, ${extras.join(", ")}` : action;
    }

    private measure(target: Object3D): boolean {
        if (this.centerTarget === target) return true;
        target.updateWorldMatrix(true, false);
        getBoundingBox(target, undefined, undefined, _box);
        // still loading
        if (_box.isEmpty()) return false;
        _invMatrix.copy(target.matrixWorld).invert();
        _box.getCenter(this.localCenter).applyMatrix4(_invMatrix);
        this.radius = _box.getSize(_point).length() / 2;
        this.centerTarget = target;
        return true;
    }

    private build() {
        if (!document.getElementById("hint-bubble-style"))
            document.head.insertAdjacentHTML("beforeend", `<style id="hint-bubble-style">${css}</style>`);

        this.root = document.createElement("div");
        this.root.className = "hint-bubble-root";

        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("class", "hint-bubble-arrow");
        const id = `hint-bubble-head-${this.guid}`;
        svg.innerHTML = `<defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>`;
        this.line = document.createElementNS(svgNS, "line");
        this.line.setAttribute("marker-end", `url(#${id})`);
        svg.appendChild(this.line);
        this.root.appendChild(svg);

        this.bubble = document.createElement("div");
        this.bubble.className = "hint-bubble";
        this.root.appendChild(this.bubble);
        // the bubble sits inside the engine's element: keep its presses from also reaching the scene
        for (const type of ["pointerdown", "click", "dblclick"]) {
            this.bubble.addEventListener(type, evt => {
                evt.stopPropagation();
                if (type === "click" && this.clickToFocus) this.focus();
            });
        }
    }
}

const css = `
.hint-bubble-root {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.25s;
}
.hint-bubble-root.hint-bubble-visible { opacity: 1; }
.hint-bubble-arrow {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
}
.hint-bubble-arrow line {
    stroke: rgba(20, 22, 30, 0.7);
    stroke-width: 1.5;
    stroke-linecap: round;
}
.hint-bubble-arrow path { fill: rgba(20, 22, 30, 0.7); }
.hint-bubble {
    position: absolute;
    left: 0;
    top: 0;
    max-width: 200px;
    padding: 8px 12px;
    border-radius: 12px;
    font-family: 'Roboto Flex', system-ui, -apple-system, 'Segoe UI', sans-serif;
    font-size: 13px;
    line-height: 1.35;
    color: #1d1f24;
    background: rgba(250, 249, 247, 0.8);
    backdrop-filter: blur(18px) saturate(1.4);
    -webkit-backdrop-filter: blur(18px) saturate(1.4);
    box-shadow: 0 8px 24px rgba(20, 22, 30, 0.12), 0 1px 2px rgba(20, 22, 30, 0.08);
    white-space: normal;
    width: max-content;
    pointer-events: auto;
    cursor: pointer;
    transition: background-color 0.15s, box-shadow 0.15s;
}
.hint-bubble:hover {
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 10px 28px rgba(20, 22, 30, 0.18), 0 1px 2px rgba(20, 22, 30, 0.1);
}
.hint-bubble-root:not(.hint-bubble-visible) .hint-bubble { pointer-events: none; }
`;
