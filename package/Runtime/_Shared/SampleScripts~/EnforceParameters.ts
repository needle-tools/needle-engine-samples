import { Behaviour, getParam, serializable, setParamWithoutReload } from "@needle-tools/engine";

export class EnforceParameters extends Behaviour {

    @serializable()
    parameters: string[] = [];

    awake() {
        var needsReload = false;
        this.parameters.forEach(p => {
            const key = getParam(p);
            if(!key) {
                setParamWithoutReload(p, "");
                needsReload = true;
            }
        });

        if(needsReload) {
            window.location.reload();
        }
    }
}