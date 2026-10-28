import { Behaviour, DragControls, GameObject, getBoundingBox, serializable } from "@needle-tools/engine";
import { Box3, Camera, Color, Matrix4, Object3D, OrthographicCamera, PerspectiveCamera, Sprite, SpriteMaterial, Texture, Vector2, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

const _box = new Box3();
const _invMatrix = new Matrix4();
const _point = new Vector3();
const _camPos = new Vector3();
const _camRight = new Vector3();
const _camUp = new Vector3();

/**
 * Draws a screen-facing marker of constant pixel size over the centre of an object, on top of the
 * scene. Add it next to a DragControls to show that the object can be dragged, or to an empty child
 * of it to place the marker at that child, for example on a door handle.
 */
export class OverlayMarker extends Behaviour {

    /** The graphic to show, for example a dot. */
    @serializable(Texture)
    texture: Texture | null = null;

    /** Tint of the graphic. */
    @serializable(Color)
    color: Color = new Color(1, 1, 1);

    /** How solid the marker is. */
    @serializable()
    opacity: number = 1;

    /** Height of the marker on screen, in pixels, at any distance. */
    @serializable()
    size: number = 16;

    /** Moves the marker away from the centre of the object, in screen pixels: X right, Y up. */
    @serializable(Vector2)
    screenOffset: Vector2 = new Vector2(0, 0);

    /** Draw the marker in front of everything. When off, objects in front can hide the marker, but not the object it marks. */
    @serializable()
    alwaysOnTop: boolean = true;

    /** Hide the marker while the DragControls on this object is dragged or disabled. */
    @serializable()
    hideWhileDragging: boolean = true;

    /** Camera distance at which the marker starts to fade out. Fading is off while fadeEnd is not larger than this. */
    @serializable()
    fadeStart: number = 0;

    /** Camera distance at which the marker is gone. */
    @serializable()
    fadeEnd: number = 0;

    /** The object to mark. Defaults to this object: the centre of its bounds, or its position when it has no meshes. */
    @serializable(Object3D)
    target: Object3D | null = null;

    /** Hides the marker without disabling it. */
    //@nonSerialized
    hidden: boolean = false;

    private sprite: Sprite | null = null;
    private dragControls: DragControls | null = null;
    private localCenter = new Vector3();
    private radius = 0;
    private centerTarget: Object3D | null = null;

    awake(): void {
        // everything made here, not lazily: a clone of this component gets copies of these fields and must not share them
        this.localCenter = new Vector3();
        this.centerTarget = null;
        const material = new SpriteMaterial({ map: this.texture, transparent: true, toneMapped: false, fog: false, depthWrite: false });
        if (this.alwaysOnTop) material.depthTest = false;
        this.sprite = new Sprite(material);
        this.sprite.name = "Overlay Marker";
        // never hit by raycasts, or the marker would take the presses meant for the object it marks
        this.sprite.raycastAllowed = false;
        this.sprite.raycast = () => { };
        if (this.alwaysOnTop) this.sprite.renderOrder = 10000;
    }

    onEnable(): void {
        // on the object itself, or above it when the marker sits on a child placed somewhere on it
        this.dragControls = GameObject.getComponentInParent(this.gameObject, DragControls);
    }

    onDisable(): void {
        // hidden instead of removed: onDisable runs while the engine walks the scene's children, and removing one breaks that walk
        if (this.sprite) this.sprite.visible = false;
    }

    onDestroy(): void {
        this.sprite?.removeFromParent();
        this.sprite?.material.dispose();
        this.sprite = null;
    }

    /** Measures the object's bounds again. Call this after it changed its shape. */
    refresh() {
        this.centerTarget = null;
    }

    onBeforeRender(): void {
        const sprite = this.sprite;
        if (!sprite) return;
        // not a child: that would add to the bounds DragControls measures
        if (sprite.parent !== this.context.scene) this.context.scene.add(sprite);
        sprite.visible = false;

        const target = this.target ?? this.gameObject;
        const cam = this.context.mainCamera as Camera | null;
        if (this.hidden || !cam || !this.measure(target)) return;
        if (this.hideWhileDragging && this.dragControls && (!this.dragControls.activeAndEnabled || this.dragControls.pointerState)) return;
        // same layers as the marked object, so the marker hides with it when a camera stops rendering its layer
        sprite.layers.mask = target.layers.mask;

        target.updateWorldMatrix(true, false);
        _point.copy(this.localCenter).applyMatrix4(target.matrixWorld);
        cam.getWorldPosition(_camPos);
        let distance = _camPos.distanceTo(_point);
        const objectDistance = distance;
        if (!this.alwaysOnTop && distance > 0) {
            // to the front of the object's bounds, so the object itself does not hide its marker
            const pull = Math.min(this.radius, distance * 0.9);
            _point.lerp(_camPos, pull / distance);
            distance -= pull;
        }
        const perPixel = this.worldPerPixel(cam, distance);
        if (perPixel <= 0) return;

        let fade = 1;
        if (this.fadeEnd > this.fadeStart) {
            const t = Math.min(1, Math.max(0, (objectDistance - this.fadeStart) / (this.fadeEnd - this.fadeStart)));
            fade = 1 - t * t * (3 - 2 * t);
        }
        if (fade <= 0.001) return;

        if (this.screenOffset.x !== 0 || this.screenOffset.y !== 0) {
            _camRight.setFromMatrixColumn(cam.matrixWorld, 0).normalize();
            _camUp.setFromMatrixColumn(cam.matrixWorld, 1).normalize();
            _point.addScaledVector(_camRight, this.screenOffset.x * perPixel)
                .addScaledVector(_camUp, this.screenOffset.y * perPixel);
        }
        sprite.position.copy(_point);
        const size = this.size * perPixel;
        sprite.scale.set(size, size, 1);
        sprite.material.map = this.texture;
        sprite.material.color.copy(this.color);
        sprite.material.opacity = this.opacity * fade;
        sprite.visible = true;
    }

    /** The bounds centre in the object's own space, so a moving object costs one matrix multiply per frame */
    private measure(target: Object3D): boolean {
        if (this.centerTarget === target) return true;
        // an empty object marks its own position
        if (!hasMesh(target)) {
            this.localCenter.set(0, 0, 0);
            this.radius = 0;
            this.centerTarget = target;
            return true;
        }
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

    private worldPerPixel(cam: Camera, distance: number): number {
        const height = this.context.domHeight;
        if (!height) return 0;
        if ((cam as OrthographicCamera).isOrthographicCamera) {
            const ortho = cam as OrthographicCamera;
            return (ortho.top - ortho.bottom) / (ortho.zoom || 1) / height;
        }
        const fov = (cam as PerspectiveCamera).fov * Math.PI / 180;
        return 2 * distance * Math.tan(fov / 2) / height;
    }
}

function hasMesh(obj: Object3D): boolean {
    let found = false;
    obj.traverse(o => { if ((o as { isMesh?: boolean }).isMesh) found = true; });
    return found;
}
