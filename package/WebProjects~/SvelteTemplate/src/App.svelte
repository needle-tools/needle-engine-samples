<script lang="ts">
import NeedleEngine from "./NeedleEngine.svelte";
import { CameraSpot } from "./scripts/CameraSpot";

let foldoutIsOpen = false;
let counter = 0;
let appState: AppState = "menu";
let cameraSpots: Array<CameraSpot> = [];
let selectedSpot: CameraSpot | null = null;

function wasClicked(_evt: MouseEvent) {
    foldoutIsOpen = !foldoutIsOpen;
    counter++;
}

$: {
    if (appState)
        selectedSpot = null;
}

</script>

<NeedleEngine bind:cameraSpots={cameraSpots} bind:selectedSpot={selectedSpot} bind:appState={appState}></NeedleEngine>

<div class="container">
    {#if selectedSpot}
    <h1>Selected: {selectedSpot.name}</h1>
    {/if}

    {#if foldoutIsOpen}
    <h2>Test: {counter}</h2>
    {/if}
    
    <button on:click={wasClicked}>Click Me</button>

    <button on:click={() => appState = "menu"}>Menu</button>
    <button on:click={() => appState = "map"}>Map</button>
    <button on:click={() => appState = "closeup"}>Closeup</button>

    <div>
        {#each cameraSpots as spot}
            <button on:click={() => selectedSpot = spot}>{spot.name}</button>
        {/each}
    </div>
</div>

<style>

div.container {
    position: absolute;
    top: 0px;
    left: 0px;
}

</style>