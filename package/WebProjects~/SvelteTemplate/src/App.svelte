<script lang="ts">
import NeedleEngine from "./NeedleEngine.svelte";
import { CameraSpot } from "./scripts/CameraSpot";
import Menu from "./Menu.svelte";

let cameraSpots: Array<CameraSpot> = [];
let selectedSpot: CameraSpot | null = null;

</script>

<NeedleEngine bind:cameraSpots={cameraSpots} bind:selectedSpot={selectedSpot}></NeedleEngine>
<Menu bind:cameraSpots={cameraSpots} bind:selectedSpot={selectedSpot}></Menu>


<style>

</style>