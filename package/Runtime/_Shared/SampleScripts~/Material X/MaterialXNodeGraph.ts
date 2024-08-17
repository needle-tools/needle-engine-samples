import { Behaviour, GameObject, LogType, Renderer, getParam, isDevEnvironment, showBalloonMessage } from '@needle-tools/engine';
import { MeshPhysicalNodeMaterial, Swizzable, TimerNode, mx_noise_vec3, normalWorld, timerLocal } from "three";

const debug = getParam("debugmaterialx");

export class ShadeWithMaterialX extends Behaviour {
    private material?: MeshPhysicalNodeMaterial;

    start() {
        const renderer = GameObject.getComponent(this.gameObject, Renderer);
        if (!renderer) return;

        // construct node material
        this.material = new MeshPhysicalNodeMaterial({});
        renderer.sharedMaterial = this.material;

        // construct the graph
        this.constructNodeGraph(this.material);
        this.material.needsUpdate = true;   

        // optional, just showing the code on screen for live editing.
        // It's better to delete this and do live editing in VS Code (can adjust imports and so on)
        // this.makeRepl();
    }

    constructNodeGraph(material: MeshPhysicalNodeMaterial) {
        // construct node graph from Swizzable<> nodes
        const timeBasedOffset = timerLocal(1);
        const customUV = normalWorld.mul( 10 ).add( timeBasedOffset );
        const noiseNode = mx_noise_vec3( customUV );

        // assign as colorNode for the PBR material
        material.colorNode = noiseNode;
    }

    private methodCacheKey?: any;

    update() {
        // quick hack to allow changing the node graph with hot reload
        if (isDevEnvironment() && this.material) {
            if (this.constructNodeGraph !== this.methodCacheKey) {
                if (debug) console.log('rebuilding node graph');
                this.methodCacheKey = this.constructNodeGraph;
                try {
                    this.constructNodeGraph(this.material);
                    this.material.needsUpdate = true;
                } catch (e: any) {
                    console.error(e);
                    showBalloonMessage(e.message, LogType.Error);
                    throw e;    
                }
            }
        }

        // we can cache nodes and set values on them
        // but the timerNode sets its value by itself (or rather, NodeFrame does)
        //if (this.timerNode)
        //    this.timerNode.value = Math.sin(this.context.time.time);
    }

    /*
    // The following is absolutely not needed – quick test to have an on-page REPL for the node graph
    private makeRepl() {
        const initialCode =
`// construct node graph from Swizzable<> nodes
const offsetNode = timerLocal(1);
this.timerNode = offsetNode;
const customUV = normalWorld.mul( 10 ).add( offsetNode );
const noiseNode = mx_noise_vec3( customUV );
// assign as colorNode for the PBR material
material.colorNode = noiseNode;`;
        
        // Show a little REPL so you can play with the graph right in your browser
        if (isDevEnvironment()) {
            const repl = document.createElement('div');
            repl.setAttribute('contenteditable', 'true');
            repl.style.resize = 'both';
            repl.style.position = 'absolute';
            repl.style.top = '10px';
            repl.style.left = '10px';
            repl.style.zIndex = '1000';
            repl.style.backgroundColor = 'rgba(0,0,0,0.5)';
            repl.style.color = 'white';
            repl.style.fontFamily = 'monospace';
            repl.style.whiteSpace = 'pre';
            repl.style.fontSize = '12px';
            repl.style.padding = '5px';
            repl.style.boxSizing = 'border-box';
            repl.style.overflow = 'auto';
            repl.style.lineHeight = '1.5';
            repl.style.textShadow = '0 0 1px black';
            repl.style.userSelect = 'text';
            repl.style.cursor = 'text';

            document.body.appendChild(repl);

            const t = this;
            // on changes to the repl, update the constructNodeGraph method
            repl.addEventListener('input', () => {
                const method = repl.innerText;
                try {
                    t.constructNodeGraph = eval('(material) => { ' + method + ' }');
                } catch (e) {
                    showBalloonMessage(e.message, LogType.Error);
                }
            });

            // prevent default on key presses
            repl.addEventListener('keydown', (e) => {
                e.stopPropagation();
            });

            repl.innerText = initialCode;
        }
    }
    */
}