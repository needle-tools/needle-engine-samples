<script lang="ts">
import { onMount } from "svelte";

export let src: string = "";

onMount(async () => {
    window.NEEDLE_ENGINE_META = { version: "custom", generator: "svelte-kit" };
    window.NEEDLE_USE_RAPIER = false;
    await import("./../generated/gen.js");
    await import('@needle-tools/engine');
});
</script>

<needle-engine src={src}></needle-engine>