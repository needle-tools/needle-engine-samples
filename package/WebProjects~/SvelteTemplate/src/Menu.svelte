<script lang="ts">

import Button from "./Button.svelte";
import Group from "./Group.svelte";
import { CameraSpot } from "./scripts/CameraSpot";

export let appState: AppState = "menu";
export let cameraSpots: Array<CameraSpot> = [];
export let selectedSpot: CameraSpot | null = null;

let foldoutIsOpen = false;
let counter = 0;

function wasClicked(_evt: MouseEvent) {
    foldoutIsOpen = !foldoutIsOpen;
    counter++;
}

</script>

<div class="container">    
    <Group>
        <span slot="label">Hello</span>
        <Button on:click={wasClicked}>Click Me</Button>

        <Button on:click={() => appState = "menu"}>Menu</Button>
        <Button on:click={() => appState = "map"}>Map</Button>
        <Button on:click={() => appState = "closeup"}>Closeup</Button>
    </Group>

    <Group>
        <span slot="label">Menu</span>
        {#each cameraSpots as spot}
            <Button on:click={() => selectedSpot = spot}>{spot.name}</Button>
        {/each}
    </Group>

    {#if selectedSpot || foldoutIsOpen}
    <Group>
        {#if selectedSpot}
        <h2>Selected: {selectedSpot.name}</h2>
        {/if}

        {#if foldoutIsOpen}
        <h3>Test: {counter}</h3>
        {/if}
    </Group>
    {/if}
</div>

<style>

div.container {
    position: absolute;
    top: 0px;
    left: 0px;
    font-size: 0.8em;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

</style>