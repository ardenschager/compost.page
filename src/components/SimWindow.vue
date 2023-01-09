<script setup>
import { onMounted, onUnmounted, ref, reactive } from 'vue';
import { useStore } from '@/stores/store';
// import Cell from './Cell.vue';
import P5Sketch from './P5Sketch.vue';

const props = defineProps(['width', 'height', 'controls']);
const store = useStore();

let simWorker = null;
let isInit = ref(false);

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

// let evenFrame = ref(true);
// const evenData = reactive(initSimData());
// const oddData = reactive(initSimData());
const simData = reactive(initSimData());

function receiveSimData(data) {
    for (let datum of data[2]) {
        const idx = datum.coords.row * settings.width + datum.coords.col;
        // simData[idx].renderDelay = data[0];
        // if (evenFrame) {
        //     evenData[idx].isFirstFrame = data[1];
        //     evenData[idx] = datum.result;
        // } else {
        //     oddData[idx].isFirstFrame = data[1];
        //     oddData[idx] = datum.result;
        // }
        simData[idx].isFirstFrame = data[1];
        simData[idx] = datum.result;
    }
    // evenFrame.value = !evenFrame.value;
    if (!isInit.value) isInit.value = true;
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

function sendFood() {
    simWorker.postMessage(['sendFood']);
}

defineExpose({
    reset,
    sendFood
});

onMounted(() => {

});

onUnmounted(() => {
    if (simWorker != null) {
        simWorker.terminate();
    }
});

</script>

<template>
    <!-- <div class="container"> -->

        <!-- <div class='row' v-for="r in Number(props.height)">
            <template v-for="c in Number(props.width)">
                <Cell v-if="isInit" :data="simData[r-1][c-1]" />
            </template>
        </div> -->

        <!-- <div class="row" v-for="j in Number(props.height)">
            <Cell v-for="i in Number(props.width)" :i='i' :j='j' :width='Number(props.width)' :height='Number(props.height)'/>
        </div> -->
        <!-- <div class='row' v-for="idx in Number(props.width * props.height)">
            <Cell :data="oddData[idx-1]" />
        </div> -->

        <!-- <div v-show="evenFrame.value" class='row' v-for="idx in Number(props.width * props.height)">
            <Cell :data="oddData[idx-1]" />
        </div>
        <div v-show="!evenFrame.value" class='row' v-for="idx in Number(props.width * props.height)">
            <Cell :data="evenData[idx-1]" />
        </div> -->
    <!-- </div> -->
    <P5Sketch :data="simData" :width="props.width" :height="props.height"></P5SKetch>
</template>

<style scoped>
/* .container {
    display: grid;
    grid-template-columns: repeat(v-bind('props.width'), 1fr);
    grid-template-rows: repeat(v-bind('props.height'), 1fr);
}

.row {
    grid-auto-rows: fit-content(1em);
} */

</style>
