<script setup lang="ts">
import SlideDeck from "./components/SlideDeck.vue"
import Slide from "./components/Slide.vue"
import "@needle-tools/engine"
import "./generated/gen.js"
</script>

<template>
    <div class="root">
        <SlideDeck>
            <Slide background-color="transparent">Slide-1</Slide>
            <Slide background-color="#cbe9b0">Slide-2</Slide>
            <Slide background-color="transparent">Slide-3</Slide>
        </SlideDeck>
        <!-- You can also put ^ this below or above the <needle-engine> component (make sure the Needle Engine camera has a transparent clearColor)-->
        <needle-engine camera-controls></needle-engine>
    </div>
</template>

<style scoped>
.root {
    position: absolute;
    display: block;
    width: 100%;
    height: 100%;
    background: #a8c291;
}

needle-engine {
    position: fixed;
    width: 100%;
    height: 100%;
}
</style>