<script setup>
import { onMounted, onUnmounted, ref, reactive } from 'vue';
import { useStore } from '@/stores/store';
// import Cell from './Cell.vue';
import P5Sketch from './P5Sketch.vue';

const props = defineProps(['width', 'height', 'controls']);
const store = useStore();

let simWorker = null;

const windowWidth = ref(1200);
const windowHeight = ref(1200);

const settings = {
    width: props.width,
    height: props.height,
}

function initSimData() {
    const _simData = {};
    const numCells = settings.width * settings.height;
    // clear previous timeouts
    var id = window.setTimeout(function() {}, 0);
    while (id--) {
        window.clearTimeout(id); // will do nothing if no timeout with id is present
    }
    for (let idx = 0; idx < numCells; idx++) {
        const data = {
            isInit: true,
            letter: "",
            fontColor: "",
            markColor: "",
            bgColor: "",
        }
        _simData[idx] = data;
    }
    return _simData;
}

const simData = reactive(initSimData());

function receiveSimData(data) {
    for (let datum of data[1]) {
        const idx = datum.coords.row * settings.width + datum.coords.col;
        simData[idx] = datum.result;
    }
    simData['fps'] = data[0];
}

// process scrape data to send to simulation, to turn into sim data
function initScrapeData() {
    const _scrapeData = [];
    const numCells = settings.width * settings.height;
    let hasData = false;
    for (let i = 0; i < numCells; i++) {
        if (store.scrapeData[i] != null) {
            hasData = true;
            const scrapeData = store.scrapeData[i];
            const letter = scrapeData.letter;
            const word = scrapeData.word;
            // const sentence = scrapeData.sentence;
            const analysis = {
                identityAttack: scrapeData.analysis.identity_attack,
                insult: scrapeData.analysis.insult,
                obscene: scrapeData.analysis.obscene,
                sentiment: scrapeData.analysis.sentiment,
                threat: scrapeData.analysis.threat,
                toxicity: scrapeData.analysis.toxicity,
                severeToxicity: scrapeData.analysis.severe_toxicity,
                sexualExplicit: scrapeData.analysis.sexual_explicit,
            };
            _scrapeData.push({
                letter: letter,
                word: word,
                // sentence: sentence,
                analysis: analysis,
            });
        } 
    }
    if (hasData) {
        return _scrapeData;
    } else {
        return null;
    }
}

function reset() {
    if (window.Worker) {
        if (simWorker != null) {
            simWorker.terminate();
        }
        simWorker = new Worker(new URL('../sim/worker.js', import.meta.url));
        simWorker.onmessage = (event) => {
            const _simData = event.data;
            receiveSimData(_simData);
        }
        const scrapeData = initScrapeData();
        if (scrapeData != null) {
            const initData = { scrapeData: scrapeData, settings: settings };
            simWorker.postMessage(['init', initData]);
        } else {
            console.log("Cannot start sim, no scrape data in store.");
        }
    }
}

function addFood() {
    simWorker.postMessage(['addFood']);
}

defineExpose({
    reset,
    addFood
});

onUnmounted(() => {
    if (simWorker != null) {
        simWorker.terminate();
    }
});

</script>

<template>
    <P5Sketch id="sketch" :data="simData" :gridWidth="props.width" :gridHeight="props.height" :sketchWidth="windowWidth" :sketchHeight="windowHeight"></P5SKetch>
</template>

<style scoped>
    #sketch {
        height: 100%;
        width: 100%;
    }
</style>
