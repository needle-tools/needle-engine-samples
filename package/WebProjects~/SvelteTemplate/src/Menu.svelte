<script lang="ts">

import Button from "./Button.svelte";
import Group from "./Group.svelte";
import { CameraSpot } from "./scripts/CameraSpot";

export let cameraSpots: Array<CameraSpot> = [];
export let selectedSpot: CameraSpot | null = null;

let foldoutIsOpen = false;

</script>

<div class="container">
    <Group>
        <span slot="label" class="uppercase">Menu</span>
        {#each cameraSpots as spot}
            <Button on:click={() => selectedSpot = spot}>{spot.name}</Button>
        {/each}
    </Group>

    {#if selectedSpot || foldoutIsOpen}
    <Group>
        {#if selectedSpot}
        <h4 class="uppercase">Current selection</h4>
        <h2>{selectedSpot.name}</h2>
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

.uppercase {
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 0.8em;
}

h2, h4 {
    margin: 5px;
}

</style>