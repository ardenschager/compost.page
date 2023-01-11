<script setup>
import 'vue-select/dist/vue-select.css';
import { useStore } from '@/stores/store';
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router'; // remove later

const router = useRouter();

const emit = defineEmits(['init']);
const targetUrl = ref('');

const store = useStore();

// todo: move serverside
function getOptions() {
    return [
                'angelfire.com/trek/caver/page9.html',
                'cameronsworld.net', 
                'foxnews.com',
                'nytimes.com', 
                'pastebin.com/FxKf1Xnz',
                'taxi1010.com/index0.htm', 
                'taxi1010.com/juicy-bonus/',
                'timecube.2enp.com/',
                'tinyurl.com/50-affirmations',
                'tinyurl.com/sexual-dimorphism',
                'tinyurl.com/suffering-faq',
                'www.yyyyyyy.info/'
            ];
}

function getRandomUrl() {
    return getOptions()[Math.floor(getOptions().length * Math.random())];
}

// on init
if (store.url != null) {
    targetUrl.value = store.url;
} else {
    targetUrl.value = getRandomUrl();
}

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
                store.saveScrapeData(result);
                store.url = targetUrl.value;
                emit('init');
            } else {
                console.error("Scrape is blank");
            }
        }).catch(error => {
            console.error(error);
        });
}

function clearIntervals() {
    // clear previous timeouts
    var id = window.setInterval(function() {}, 1000);
    while (id--) {
        window.clearInterval(id); // will do nothing if no timeout with id is present
    }
}

// remove after GA exhibition
// clearIntervals();
// const REFRESH_TIME = 1000 * 60 * 3.5;
// setInterval(() => {
//     targetUrl.value = getRandomUrl();
//     sendInput();
// }, REFRESH_TIME); // after 5m, change page

// watch(targetUrl, (newVal, oldVal) => {
//     clearIntervals();
//     // remove after GA exhibition
//     setInterval(() => {
//         targetUrl.value = getRandomUrl();
//         sendInput();
//     }, REFRESH_TIME); // after 5m, change page
// })

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
