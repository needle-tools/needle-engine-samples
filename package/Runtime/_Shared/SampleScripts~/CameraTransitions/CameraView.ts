import { Behaviour, GameObject, OrbitControls, PointerEventData, serializable, IPointerClickHandler } from "@needle-tools/engine";
import { getWorldPosition } from "@needle-tools/engine";

// Copy of OrbitControlsView from SpatialAudio sample
export class CameraView extends Behaviour implements IPointerClickHandler {

    @serializable(GameObject)
    lookAt?: GameObject;

    @serializable(GameObject)
    from?: GameObject;

    @serializable()
    triggerByClick: boolean = true;
    
    private controls: OrbitControls | null = null;

    onPointerClick(_args: PointerEventData) {
        if (this.triggerByClick) {
            this.setView();
        }
    }

    setView() {
        this.controls ??= GameObject.findObjectOfType(OrbitControls);
        const from = this.from ?? this.gameObject;
        
        if (!this.controls || !this.lookAt) return;

        this.controls.setLookTargetPosition(getWorldPosition(this.lookAt));
        this.controls.setCameraTargetPosition(getWorldPosition(from));
    }
}