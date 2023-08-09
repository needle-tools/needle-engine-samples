<script lang="ts">
import { onMount } from "svelte";

export let src: string = "";

onMount(async () => {
    await import('./../generated/gen.js');
    await import('@needle-tools/engine');
});

</script>

<needle-engine src={src}></needle-engine>