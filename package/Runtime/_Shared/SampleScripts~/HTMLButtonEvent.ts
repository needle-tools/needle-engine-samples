// START MARKER receive click from HTML button
import { Behaviour, EventList, serializable, serializeable } from "@needle-tools/engine";

export class HTMLButtonClick extends Behaviour {

    /** Enter a button query (e.g. button.some-button if you're interested in a button with the class 'some-button') 
     * Or you can also use an id (e.g. #some-button if you're interested in a button with the id 'some-button')
     * Or you can also use a tag (e.g. button if you're interested in any button
    */
    @serializeable()
    htmlSelector: string = "button.some-button";
    
    /** This is the event to be invoked when the html element is clicked. In Unity or Blender you can assign methods to be called in the Editor */
    @serializable(EventList)
    onClick: EventList = new EventList();

    private element? : HTMLButtonElement;

    onEnable() {
        // Get the element from the DOM
        this.element = document.querySelector(this.htmlSelector) as HTMLButtonElement;
        if (this.element) {
            this.element.addEventListener('click', this.onClicked);
        }
        else console.warn(`Could not find element with selector \"${this.htmlSelector}\"`);
    }

    onDisable() {
        if (this.element) {
            this.element.removeEventListener('click', this.onClicked);
        }
    }

    private onClicked = () => {
        this.onClick.invoke();
    }
}
// END MARKER receive click from HTML button