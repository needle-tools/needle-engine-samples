<script lang="ts">
import { base } from "$app/paths";
import { page } from "$app/stores";
import NeedleEngine from "../NeedleEngine.svelte";

export let data;

$: src = $page.data.sceneFile;
</script>

<menu>
{#each data.entries as entry}
    <a href="{base}/scenes/{entry.url}">{entry.name}</a>
{/each}
</menu>

{#if src}
<NeedleEngine src="{base}/{src}" />
{/if}

<slot />

<!-- for debugging -->
<pre>{JSON.stringify($page, null, 2)}</pre>

<style>
menu {
    background-color: white;
    padding: 10px;
    border-radius: 40px;
    display: inline-block;
}

menu a {
    margin: 4px 10px;
    text-decoration: none;
    color: black;
}

menu a:hover {
    color: #4d7716;
}
</style>