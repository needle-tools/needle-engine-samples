<script lang="ts">
import NeedleEngine from "./NeedleEngine.svelte";
import Menu from "./Menu.svelte";
import { CameraSpot } from "needle.sveltesample/CameraSpot";

let cameraSpots: Array<CameraSpot> = [];
let selectedSpot: CameraSpot | null = null;

</script>

<NeedleEngine bind:cameraSpots={cameraSpots} bind:selectedSpot={selectedSpot}></NeedleEngine>
<Menu bind:cameraSpots={cameraSpots} bind:selectedSpot={selectedSpot}></Menu>
