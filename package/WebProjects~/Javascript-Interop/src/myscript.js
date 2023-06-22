// START MARKER javascript interop external script
import { NeedleEngine } from "@needle-tools/engine";

// you can do the following to import exports from your package
// this can be done from a javascript module file
import { myJsInteropMethod, MyJsInteropSampleComponent } from "my-sample-package"

myJsInteropMethod();

// We have to wait for Needle Engine to be ready
// Otherwise the static instance migth not be assigned yet
// Because it's a component :)
NeedleEngine.addContextCreatedCallback(()=>{
    MyJsInteropSampleComponent.instance.sampleMethod();
})
// END MARKER javascript interop external script