<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '@/stores/store';
import ControlBar from '../components/ControlBar.vue';
import SimWindow from '../components/SimWindow.vue';

const store = useStore();
const router = useRouter();

if (!store.visitedHomePage) {
    router.push({ name: 'input' }); // go to landing page first
}

const simWindowRef = ref(null);
const controlsRef = ref({
    speed: 0.5,
});

function init() {
    simWindowRef.value.reset();
}

function addFood() {
    simWindowRef.value.addFood();
}

onMounted(() => {
    init();
});

</script>

<template>
	<div class="grid" @wheel.prevent @touchmove.prevent @scroll.prevent>
		<ControlBar @init="init()" @addFood="addFood" controls="controlsRef"/>
		<SimWindow width="120" height="52" ref="simWindowRef" controls="controlsRef"/>
	</div>
</template>

<style scoped>
.grid {
    display: grid;
    row-gap: 15px;
    object-fit: cover;
    max-height: 100%;
    width: 100%;
    overflow: hidden;
}
</style>
