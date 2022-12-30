<script setup>
import {ref} from 'vue';
import ControlBar from '../components/ControlBar.vue';
import SimWindow from '../components/SimWindow.vue';

const simWindowRef = ref(null);

function onInit() {
    simWindowRef.value.reset();
}

</script>

<template>
	<div class="grid">
		<ControlBar @init="onInit()"/>
		<SimWindow width="120" height="46" ref="simWindowRef"/>
	</div>
</template>

<style scoped>
.grid {
    display: grid;
    row-gap: 15px;
    object-fit: cover;
    max-height: 100%;
}
</style>
