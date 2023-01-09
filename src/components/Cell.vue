<script setup>
// import { useStore } from '@/stores/store';
import { reactive, ref, watch } from 'vue';

const props = defineProps(['data']);
const dataRef = ref(props.data);

const DEFAULT_LETTER = '.';
const DEFAULT_TONT_COLOR = 'black';
const DEFAULT_MARK_COLOR = 'white';
const DEFAULT_BG_COLOR = 'white';
const data = reactive({
    letter: DEFAULT_LETTER,
    fontColor: DEFAULT_TONT_COLOR,
    markColor: DEFAULT_MARK_COLOR,
    bgColor: DEFAULT_BG_COLOR,
});

const INIT_STAGGER_CHANCE = 0.05;
const INIT_STAGGER_NUM_BUCKETS = 5;
const INIT_STAGGER_MILLIS = 50;
const STAGGER_NUM_BUCKETS = 5;
const STAGGER_MILLIS = 75;
watch(props, (newProps, oldProps) => {
    if (newProps.data.isFirstFrame) {
        if (Math.random() > INIT_STAGGER_CHANCE) {
            data.letter = newProps.data.letter;
            data.fontColor = newProps.data.fontColor;
            data.markColor = newProps.data.markColor;
            data.bgColor = newProps.data.bgColor;
        } else {
            const timeout = Math.floor(Math.random() * INIT_STAGGER_NUM_BUCKETS) * INIT_STAGGER_MILLIS; 
            setTimeout(() => {
                data.letter = newProps.data.letter;
                data.fontColor = newProps.data.fontColor;
                data.markColor = newProps.data.markColor;
                data.bgColor = newProps.data.bgColor;
        }, timeout); // stagger rendering
        }
    } else {
        // data.letter = newProps.data.letter;
        // data.fontColor = newProps.data.fontColor;
        // data.markColor = newProps.data.markColor;
        // data.bgColor = newProps.data.bgColor;
        const timeout = Math.floor(Math.random() * STAGGER_NUM_BUCKETS) * STAGGER_MILLIS; 
        setTimeout(() => {
            data.letter = newProps.data.letter;
            data.fontColor = newProps.data.fontColor;
            data.markColor = newProps.data.markColor;
            data.bgColor = newProps.data.bgColor;
        }, timeout); // stagger rendering
    }
});

</script>

<template>
    <div class="glyph">
        <mark>
            {{ data.letter }} 
        </mark>
    </div>
</template>

<style scoped>
    .glyph {
        background-color: v-bind('data.bgColor');
        height: 100%;
        font-family: 'unifont';
        text-align: center;
    }
    
    @font-face {
        font-family: "unifont";
        src: url('../assets/unifont-15.0.01.ttf') format("truetype");
    }

    mark{
        color: v-bind('data.fontColor');
        background-color: v-bind('data.markColor');
    }
</style>
