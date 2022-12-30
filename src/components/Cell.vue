<script setup>
import { useStore } from '@/stores/store';

const store = useStore();
const props = defineProps(['data', 'width', 'height']);

function getLetter() {
    if (props.data != null) {
        return props.data.letter;
    } else {
        return '.';
    }
}

function getColor() {
    if (props.data != null) {
        return props.data.color;
    } else {
        return 'black';
    }
}

function getBgColor() {
    if (props.data != null) {
        return props.data.bgColor;
    } else {
        return 'white';
    }
}
</script>

<template>
    <div class="glyph">
        {{ getLetter() }}
    </div>
</template>

<style scoped>
    .glyph {
        color: v-bind(getColor());
        background-color: v-bind(getBgColor());
        height: 100%;
    }
</style>
