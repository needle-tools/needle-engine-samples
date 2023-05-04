<script lang="ts">
import NeedleEngine from "./NeedleEngine.svelte";
import { CameraSpot } from "./scripts/CameraSpot";
import Menu from "./Menu.svelte";

let appState: AppState = "menu";
let cameraSpots: Array<CameraSpot> = [];
let selectedSpot: CameraSpot | null = null;

$: {
    if (appState)
        selectedSpot = null;
}

</script>

<NeedleEngine bind:cameraSpots={cameraSpots} bind:selectedSpot={selectedSpot} bind:appState={appState}></NeedleEngine>
<Menu bind:cameraSpots={cameraSpots} bind:selectedSpot={selectedSpot} bind:appState={appState}></Menu>


<style>

</style>