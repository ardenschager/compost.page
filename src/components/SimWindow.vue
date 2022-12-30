<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useStore } from '@/stores/store';
import Cell from './Cell.vue';

const props = defineProps(['width', 'height']);
const store = useStore();

let simWorker = null;

const settings = {
    width: props.width,
    height: props.height,
}

const simData = ref([]);

function shouldUpdateDatum(idx, datum) {
    return simData.value[idx] == null || 
           datum.letter != simData.value[idx].letter || 
           datum.color != simData.value[idx].color || 
           datum.bgColor != simData.value[idx].bgColor;
}

function receiveData(data) {
    for (let r = 0; r < props.height; r++) {
        for (let c = 0; c < props.width; c++) {
            const datum = data[1][r][c];
            const idx = r * props.width + c;
            if (shouldUpdateDatum(idx, datum)) {
                simData.value[idx] = datum;
            }
        }
    }
}

function init() {
    const _scrapeData = [];
    const numCells = settings.width * settings.height;
    for (let i = 0; i < numCells; i++) {
        simData[i] = {letter: ".", color: "black", bgColor: "white"};
        if (store.scrapeData[i] != null) {
            const scrapeData = store.scrapeData[i];
            const letter = scrapeData.letter;
            const word = scrapeData.word;
            const sentence = scrapeData.sentence;
            const analysis = {
                identity_attack: scrapeData.analysis.identity_attack,
                insult: scrapeData.analysis.insult,
                obscene: scrapeData.analysis.obscene,
                sentiment: scrapeData.analysis.sentiment,
                threat: scrapeData.analysis.threat,
                toxicity: scrapeData.analysis.toxicity,
                severe_toxicity: scrapeData.analysis.severe_toxicity,
                sexual_explicit: scrapeData.analysis.sexual_explicit,
            };
            _scrapeData.push({
                letter: letter,
                word: word,
                sentence: sentence,
                analysis: analysis,
            });
        }
    }
    return _scrapeData;
}

function reset() {
    if (window.Worker) {
        if (simWorker != null) {
            simWorker.terminate();
        }
        simWorker = new Worker(new URL('../js/sim_worker.js', import.meta.url));
        simWorker.onmessage = (event) => {
            const data = event.data;
            receiveData(data);
        }
        const scrapeData = init();
        const initData = { scrapeData: scrapeData, settings: settings };
        simWorker.postMessage(['init', initData]);
    }
}

defineExpose({
    reset
})

onMounted(() => {
    reset();
});

onUnmounted(() => {
    if (simWorker != null) {
        simWorker.terminate();
    }
});

</script>

<template>
    <div class="container">
        <!-- <div class="row" v-for="j in Number(props.height)">
            <Cell v-for="i in Number(props.width)" :i='i' :j='j' :width='Number(props.width)' :height='Number(props.height)'/>
        </div> -->
        <div class='row' v-for="idx in Number(props.width * props.height)">
            <Cell :data='simData[idx - 1]' :width='Number(props.width)' :height='Number(props.height)' />
        </div>
    </div>
</template>

<style scoped>
.container {
    display: grid;
    grid-template-columns: repeat(v-bind('props.width'), 1fr);
    grid-template-rows: repeat(v-bind('props.height'), 1fr);
}

.row {
    grid-auto-rows: fit-content(1em);
}
</style>
