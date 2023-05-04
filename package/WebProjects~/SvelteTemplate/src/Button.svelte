<script lang="ts">
</script>

<button on:click>
    <slot></slot>
</button>

<style>

button {
    border-radius: 40px;
    padding: 5px;
    outline: none;
    color: black;
    background-color: white;
    border: 1px solid rgba(75, 75, 75, 0.25);
    font-family: sans-serif;
    font-size: inherit;
    margin: 2px 4px;
}

button:hover {
    cursor: pointer;
    border-bottom: 2px solid rgba(85, 85, 85, 0.5);
    margin-bottom: -3px;
    transform: scale(1.05);
}

</style>