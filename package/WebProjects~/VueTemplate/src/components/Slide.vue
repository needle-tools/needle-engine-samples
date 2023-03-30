<script setup lang="ts">
import { Color } from 'three';
import { onMounted } from 'vue';

const props = defineProps<{
    backgroundColor?: string
}>();

onMounted(() => {
    
    // console.log("Slide mounted");
    // const slides = document.querySelectorAll(".slide *");
    // console.log(slides);
});

</script>

<template>
    <div class="slide">
        <slot></slot>
    </div>
</template>

<style scoped>

.slide {
    font-size: 20rem;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: v-bind(backgroundColor);
    /* opacity: 0;
    transition: opacity .1s ease-in-out; */
}

/* .slide[active] {
    opacity: 1;
} */
</style>