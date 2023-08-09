<script lang="ts">
import { Context, ContextRegistry, GameObject } from "@needle-tools/engine";
import { CameraSpot } from "./scripts/CameraSpot";
import { StateManager } from "./scripts/StateManager";

// exposed state - can be bound from outside components
export let cameraSpots: Array<CameraSpot> = [];
export let selectedSpot: CameraSpot | null = null;

// internal state - we manage that here
let context: Context;
let stateManager: StateManager | null = null;

// wait for the Needle Engine context to be ready (then we have GameObjects, components, ...)
ContextRegistry.addContextCreatedCallback((_context) => {
    context = _context.context as Context;
    cameraSpots = GameObject.findObjectsOfType(CameraSpot);
    stateManager = GameObject.findObjectOfType(StateManager);
    
    stateManager?.addEventListener(StateManager.CameraSpotClickedEvent, (evt: CustomEvent) => {
        const clickedOn = evt.detail as CameraSpot;
        if (clickedOn == selectedSpot) {
            selectedSpot = null;
        } else {
            selectedSpot = clickedOn;
        }
    });
});

// react to changes to the selected spot
let lastSelectedSpot : CameraSpot | null = null;
$: if (selectedSpot != lastSelectedSpot) {
    lastSelectedSpot?.deselect();
    selectedSpot?.select();
    lastSelectedSpot = selectedSpot;
}

// example for dispatching a custom event
/*
$: {
    stateManager?.dispatchEvent(new CustomEvent(StateManager.StateChangedEvent, { detail: appState }));
}
*/

</script>

<needle-engine></needle-engine>

<style>

</style>