// START MARKER javascript interop inside engine
import { Behaviour, showBalloonMessage } from "@needle-tools/engine";

export class MyJsInteropSampleComponent extends Behaviour {

    static get instance() {
        return this._instance;
    }
    private static _instance: MyJsInteropSampleComponent;

    constructor() {
        super();
        MyJsInteropSampleComponent._instance = this;
    }

    sampleMethod() {
        showBalloonMessage("Hello, im a message inside a npm package accessed via a static getter");
    }
}

// this method is exported inside the package.json main file
export function myJsInteropMethod() {
    showBalloonMessage("Hello, im a message inside a npm package")
}
// END MARKER javascript-interop-sample inside engine