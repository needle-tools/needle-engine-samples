import { Behaviour } from "needle.tiny.engine/engine-components/Component";
import { EventList } from "needle.tiny.engine/engine-components/EventList";
import { RGBAColor } from "needle.tiny.engine/engine-components/js-extensions/RGBAColor";
import { serializeable } from "needle.tiny.engine/engine/engine_serialization_decorator";
import { HTMLMesh } from 'three/examples/jsm/interactive/HTMLMesh.js';
import { InteractiveGroup } from 'three/examples/jsm/interactive/InteractiveGroup.js';

export class HtmlMesh extends Behaviour {

    public buttonText : string = "Hello World";
    public otherButtonText : string = "Hello World";

    @serializeable(EventList)
    public onClick?: EventList;

    @serializeable(EventList)
    public onClickOtherButton?: EventList;

    @serializeable(RGBAColor) 
    public color : RGBAColor = new RGBAColor(1,1,1,1);

    private group : InteractiveGroup | undefined;

    onEnable()
    {
        // seems that in awake() context.mainCamera might not be available yet
        if (this.group) return;

        const me = this;

        const div = document.createElement('div');
        div.style.position = "absolute";
        div.style.left = "0px";
        div.style.top = "0px";
        div.style.zIndex = "100";
        div.style.backgroundColor = "rgba(1,1,1,0.1)";
        div.style.width = "200px";
        div.style.height = "200px";

        // first button
        const p = document.createElement('button');
        p.style.margin = "10px";
        p.style.fontSize = "20px";
        p.textContent = this.buttonText;
        p.onclick = function() {
            me.onClick?.invoke();
        };
        div.append(p);

        // second button
        const p2 = document.createElement('button');
        p2.style.margin = "10px";
        p2.style.fontSize = "20px";
        p2.textContent = this.otherButtonText;
        p2.onclick = function() {
            me.onClickOtherButton?.invoke();
        };
        div.append(p2);

        this.context.domElement.append(div);

        div.style.visibility = "hidden";
        
        this.group = new InteractiveGroup( this.context.renderer, this.context.mainCamera! );
        this.gameObject.add( this.group );

        const mesh = new HTMLMesh( div );
        mesh.scale.set(5,5,5);
        this.group.add( mesh );
    }
}
