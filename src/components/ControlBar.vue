<script setup>
import UrlForm from '../components/UrlForm.vue';
</script>

<template>
    <div class="container">
        <div/>
        <UrlForm id="form" @init=" $emit('init') "/>
        <div/>
        <button @click="$emit('addFood')" id="button">Add Food</button>
    </div>
</template>

<style scoped>
.container {
    display: grid;
    place-items: center;
    place-content: stretch;
    grid-template-columns: 0.5% 30% 0.5% 7%;
}

#button {
    width: 100%;
    border-radius: 8px;
    background-color: #7bc570;
    color: rgb(74, 116, 62);
    border: none;
    transition-duration: 0.3s;
    height: 100%;
}

#button:hover {
    background-color: #97cf8e;
    /* Green */
    color: rgb(60, 114, 13);
    border: dotted;
}

#form {
    align-self: stretch;
    justify-self: stretch;
}
</style>
