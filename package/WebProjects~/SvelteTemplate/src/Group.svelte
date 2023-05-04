<script lang="ts">

let expanded = true;

</script>

<div class="group">
    {#if $$slots.label}
    <button on:click={() => expanded = !expanded}>
        <slot name="label"></slot>
    </button>
    {/if}

    {#if expanded}
    <slot></slot>
    {/if}
</div>

<style>

div.group {
    background-color: rgba(255, 255, 255, 0.795);
    border-radius: 20px;
    padding: 6px;
    margin: 6px;
}

button {
    border: 0;
    outline: 0;
    color: rgb(90, 90, 90);
    background: none;
    margin: 5px;
}

</style>