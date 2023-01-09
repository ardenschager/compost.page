import { defineStore } from 'pinia';
import { ref } from 'vue';


export const useStore = defineStore('store', () => {
    const scrapeData = ref([]);
    const urls = ref([]);
    const settings = ref();
    const visitedHomePage = ref(false);

    function saveScrapeData(data) {
        scrapeData.value = [];
        for (let datum of data) {
            scrapeData.value.push(datum);
        }
    }

    return { saveScrapeData, scrapeData, urls, visitedHomePage, settings};
});