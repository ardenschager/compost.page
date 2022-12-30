<script setup>
import UrlForm from '../components/UrlForm.vue';
</script>

<template>
    <div class="container">
        <div/>
        <UrlForm id="form" @init=" $emit('init') "/>
    </div>
</template>

<style scoped>
.container {
    display: grid;
    place-items: center;
    place-content: stretch;
    grid-template-columns: 0.5% 30%;
}

#form {
    align-self: stretch;
    justify-self: stretch;
}
</style>
