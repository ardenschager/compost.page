<script setup>
import 'vue-select/dist/vue-select.css';
import { useStore } from '@/stores/store';
import { ref } from 'vue';

const emit = defineEmits(['init']);
const targetUrl = ref('');

const store = useStore();

function sendInput() {
    if (targetUrl.value == '') return;
    const scrapeUrl = '/scrape';
    const data = JSON.stringify({ "target": targetUrl.value });
    const options = {
        method: `POST`,
        body: data,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };
    fetch(scrapeUrl, options)
        .then(data => {
            if (!data.ok) {
                throw data;
            }
            return data.text();
        }).then(data => {
            const result = JSON.parse(data).scrape;
            if (result.length > 0) {
                store.initData(result);
                emit('init');
            } else {
                console.error("Scrape is blank");
            }
        }).catch(error => {
            console.error(error);
        });
}

function getOptions() {
    return ['www.foxnews.com', 'www.nytimes.com'];
}
</script>

<template>
    <main>
        <div id="container">
            <!-- <input @keyup.enter="sendInput" v-model="url" type="text" id="url-button"><br>
            -->
            <v-select v-model="targetUrl" id="dropdown" class="style-chooser" :options="getOptions()" taggable
                push-tags></v-select>
            <div></div>
            <button @click="sendInput" id="button">Compost!</button>
        </div>
    </main>
</template>

<style scoped>
#container {
    width: 100%;
    display: grid;
    grid-template-columns: 73% 4% 23%;
}

#dropdown {
    width: 100%;
    z-index: 10030 !important;
}

#button {
    width: 100%;
    border-radius: 8px;
    background-color: #7bc570;
    color: rgb(74, 116, 62);
    border: none;
    transition-duration: 0.3s;
}

#button:hover {
    background-color: #97cf8e;
    /* Green */
    color: rgb(60, 114, 13);
    border: dotted;
}

:deep(.vs__dropdown-menu) {
    background: #c7d3bc;
}
</style>
