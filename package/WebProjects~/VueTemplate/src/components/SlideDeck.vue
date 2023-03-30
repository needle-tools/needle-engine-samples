<script setup lang="ts">
import { Context, GameObject } from '@needle-tools/engine';
import { ContextEvent, ContextRegistry } from '@needle-tools/engine/src/engine/engine_context_registry';
import { getParam, setParamWithoutReload } from '@needle-tools/engine/src/engine/engine_utils';
import { onMounted } from 'vue';

const slides: HTMLElement[] = [];
let activeSlideIndex = -1;

let context: Context | null = null;
ContextRegistry.registerCallback(ContextEvent.ContextCreated, evt => {
    context = evt.context as Context;

    context.connection.beginListen("slide-changed", newSlide => {
        if (typeof newSlide === "number" && newSlide !== activeSlideIndex) {
            updateActiveSlide(newSlide);
        }
    });
});

onMounted(() => {
    console.log("Slidedeck mounted");
    const root = document.querySelector(".slidedeck") as HTMLElement;
    const content = root.querySelectorAll("*");
    for (let i = 0; i < content.length; i++) {
        const slideContent = content[i];
        if (slideContent instanceof HTMLElement) {
            if (slideContent.classList.contains("slide")) {
                slides.push(slideContent);
                continue;
            }
            const slideElement = document.createElement("div");
            slides.push(slideElement);
            slideElement.classList.add("slide");
            slideElement.appendChild(slideContent);
            root.appendChild(slideElement);
        }
    }

    onSetSlideIndexFromUrl();

    window.addEventListener("keyup", evt => {
        const key = evt.key.toLowerCase();
        let currentSlide = activeSlideIndex;
        switch (key) {
            case "a":
            case "arrowleft":
                currentSlide--;
                if (currentSlide < 0) {
                    currentSlide = slides.length - 1;
                }
                updateActiveSlide(currentSlide, true);
                break;
            case "d":
            case "arrowright":
                currentSlide++;
                if (currentSlide >= slides.length) {
                    currentSlide = 0;
                }
                updateActiveSlide(currentSlide, true);
                break;
        }
    });
});

function onSetSlideIndexFromUrl() {
    const slide = getParam("slide");
    let index = 0;
    if (slide) {
        if (slide === "string")
            index = parseInt(slide);
        else if (typeof slide === "number")
            index = slide;
    }
    else index = 0;
    updateActiveSlide(index);
}

function updateActiveSlide(index: number, userAction: boolean = false) {
    if (index === activeSlideIndex) return;
    activeSlideIndex = index;
    if (userAction)
        context?.connection.send("slide-changed", index);
    // here you can notify e.g. a component in the 3d engine to e.g. load another scene
    setParamWithoutReload("slide", index.toString());
    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const isActive = i === index;
        const isLeft = i > index;
        const isRight = i < index;
        if (isActive) {
            slide.setAttribute("active", "");
        }
        else {
            slide.removeAttribute("active");
        }
        if (isLeft) {
            slide.setAttribute("left", "");
        }
        else {
            slide.removeAttribute("left");
        }
        if (isRight) {
            slide.setAttribute("right", "");
        }
        else {
            slide.removeAttribute("right");
        }
    }
}
</script>

<template>
    <div class="slidedeck">
        <slot></slot>
    </div>
</template>

<style>
.slidedeck {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;

    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

.slide {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    transition: left .2s ease-in-out, opacity .01s ease-in;
    opacity: 1;
}

.slide[active] {
    left: 0;
    opacity: 1;
}

.slide[left] {
    left: 100%;
}

.slide[right] {
    left: -100%;
}
</style>
