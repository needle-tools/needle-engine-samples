import { Behaviour, Camera, ClearFlags, GameObject, OrbitControls, serializable } from "@needle-tools/engine";
import { Color, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, PlaneGeometry, Texture } from "three";

// Documentation → https://docs.needle.tools/scripting

export class CameraScissorSample extends Behaviour {

    @serializable()
    x: number = 20;
    @serializable()
    y: number = 20;
    @serializable()
    width: number = 200;
    @serializable()
    height: number = 200;

    private camera?: Camera;
    private renderDiv?: HTMLDivElement;
    private controls?: OrbitControls;

    awake(): void {
        this.camera = GameObject.getComponent(this.gameObject, Camera)!;

        // make new div
        const div = document.createElement("div");
        div.style.position = "absolute";
        div.style.top = this.y + "px";
        div.style.left = this.x + "px";
        div.style.width = this.width + "px";
        div.style.height = this.height + "px";
        div.style.border = "2px solid white";
        // box-shadow
        div.style.boxShadow = "rgb(0 0 0 / 25%) 0px 0px 15px 0px;"

        // add div
        document.body.appendChild(div);
        document.body.style.overflow = "hidden";

        this.renderDiv = div;

        // set the div CSS style so that "resize" works
        div.style.resize = "both";
        div.style.overflow = "auto";

        // get OrbitControls of this object and assign the div
        const controls = GameObject.getComponent(this.gameObject, OrbitControls)!;
        controls.targetElement = div;
        this.controls = controls;

        // make the header draggable
        this.dragElement(div, null);
    }

    dragElement(elmnt, header) {
        const ctrl = this.controls;

        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        if (header) {
            // if present, the header is where you move the DIV from:
            header.onmousedown = dragMouseDown;
        } else {
            // otherwise, move the DIV from anywhere inside the DIV:
            elmnt.onmousedown = dragMouseDown;
        }
        
        function dragMouseDown(e) {
            if (!ctrl) return;
            e = e || window.event;

            // check if we're near the border
            const rect = elmnt.getBoundingClientRect();
            const border = 25;
            const x = e.clientX;
            const y = e.clientY;

            console.log(x,y, rect);

            // disable controls
            ctrl.controls!.enabled = false;

            // check if resize corner (bottom right)
            if ((x > rect.right - border && y > rect.bottom - border)) {
                ctrl.controls!.enabled = false;
                return;
            }

            // check if we're inside the border area
            if (!(x > rect.right - border || x < rect.left + border || y > rect.bottom - border || y < rect.top + border)) {
                // we're near the border, don't drag
                ctrl.controls!.enabled = true;
                return;
            }

            e.preventDefault();

            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;

            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        }
        
        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";

            // disable orbit controls
        }
        
        function closeDragElement() {
            if (!ctrl) return;
            // stop moving when mouse button is released:
            document.onmouseup = null;
            document.onmousemove = null;
            ctrl.controls!.enabled = true;
        }
    }


    // from https://codepen.io/jdrew1303/pen/poyVOyG
    setScissorForElement(elem) {
        const canvas = this.context.renderer.domElement;
        const renderer = this.context.renderer;
        const canvasRect = canvas.getBoundingClientRect();
        const elemRect = elem.getBoundingClientRect();
    
        // compute a canvas relative rectangle
        const right = Math.min(elemRect.right, canvasRect.right) - canvasRect.left;
        const left = Math.max(0, elemRect.left - canvasRect.left);
        const bottom = Math.min(elemRect.bottom, canvasRect.bottom) - canvasRect.top;
        const top = Math.max(0, elemRect.top - canvasRect.top);
    
        const width = Math.min(canvasRect.width, right - left);
        const height = Math.min(canvasRect.height, bottom - top);
    
        // setup the scissor to only render to that part of the canvas
        const positiveYUpBottom = canvasRect.height - bottom;
        renderer.setScissor(left, positiveYUpBottom, width, height);
        renderer.setViewport(left, positiveYUpBottom, width, height);
    
        // return the aspect
        return width / height;
    }

    private fullscreenQuad?: Mesh;
    private orthoCamera?: OrthographicCamera;
    private fullscreenQuadMat?: MeshBasicMaterial;

    onAfterRender() {
        if (!this.camera) return;

        const prevClear = this.context.renderer.autoClearColor;
        this.context.renderer.autoClearColor = false;

        // set scissor
        const aspect = this.setScissorForElement(this.renderDiv);
        const threeCam = this.camera.cam as PerspectiveCamera;
        threeCam.aspect = aspect;
        threeCam.updateProjectionMatrix();

        if (this.camera.clearFlags === ClearFlags.SolidColor) {
            // Lazily intialize a fullscreen quad for custom clearing,
            // when we're rendering into a scissor we can't use the regular clear calls.
            if (!this.fullscreenQuad) {
                this.fullscreenQuadMat = new MeshBasicMaterial({color: '#000', depthWrite: false, transparent: true});
                this.fullscreenQuad = new Mesh(
                    new PlaneGeometry(2, 2),
                    this.fullscreenQuadMat,
                );
            }
            if (!this.orthoCamera) {
                this.orthoCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
            }

            this.context.scene.background = null;
            if (this.fullscreenQuadMat) {
                this.fullscreenQuadMat.color.copy(this.camera.backgroundColor as Color);
                this.fullscreenQuadMat.opacity = this.camera.backgroundColor?.a ?? 1;
            }
            this.context.renderer.render(this.fullscreenQuad, this.orthoCamera);
        }
        this.context.renderNow(this.camera.cam);
        
        // reset viewport
        this.setScissorForElement(this.context.renderer.domElement);

        if (this.context.mainCameraComponent)
            this.context.mainCameraComponent.applyClearFlags();

        this.context.renderer.autoClearColor = prevClear;
    }
}
