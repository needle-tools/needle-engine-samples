import { Behaviour } from "needle.tiny.engine/engine-components/Component";
import { PointerEventData, IPointerClickHandler } from "needle.tiny.engine/engine-components/ui/PointerEvents";
import { WebXRController, ControllerEvents } from "needle.tiny.engine/engine-components/WebXRController";

export class ClickToOpenWebsite extends Behaviour implements IPointerClickHandler {

    url : string | null = null;
    keepQuery : boolean = false;
    keepHash : boolean = false;

    awake(): void {
        WebXRController.addEventListener(ControllerEvents.SelectStart, (_controller, args : {selected:THREE.Object3D}) => {
            if(args.selected === this.gameObject){
                this.onClick();
            }
        })
    }

    lastClickTime : number = 0;

    onClick(){
        // hack/workaround until we support onclick for xr controllers
        if(this.context.time.time - this.lastClickTime < .3) return;
        this.lastClickTime = this.context.time.time;

        if(!this.url || this.url.length <= 0){
            this.url = window.location.href;
        }

        console.log("click", this.url, this.keepHash, this.keepQuery, window.location.href, window.location.search, window.location.hash);

        if(this.url) {
            const targetUrl = new URL(this.url);
            if(this.keepQuery)
            {
                if(targetUrl.search) targetUrl.search += "&" + window.location.search.substring(1);
                else targetUrl.search = window.location.search;
            } 
            if(this.keepHash)
            {
                if(targetUrl.hash) targetUrl.hash += "&" + window.location.hash.substring(1);
                else targetUrl.hash = window.location.hash;
            }
            
            console.log("Target URL", targetUrl.toString());
            window.open(targetUrl, "_self");
        }
    }

    onPointerClick(args: PointerEventData) {
        this.onClick();
        args.Use();
    }

    // update(): void {
    //     if(this.context.input.mouseClick){
    //         const rc = this.context.physics.raycast();
    //         if(rc && rc.length > 0){
    //             const hit = rc[0];
    //             if(hit.object === this.gameObject){
    //                 // this.onClick();
    //             }
    //         }
    //     }
    // }

}