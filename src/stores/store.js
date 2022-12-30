import { defineStore } from 'pinia';
import { ref } from 'vue';


export const useStore = defineStore('store', () => {
    const scrapeData = ref([]);
    const urls = ref([]);
    const settings = ref();

    function initData(data) {
        for (let datum of data) {
            scrapeData.value.push(datum);
        }
    }

    return { initData, scrapeData, urls, settings};
});