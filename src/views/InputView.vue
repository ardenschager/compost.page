<script setup>
import UrlForm from '../components/UrlForm.vue';
import { useRouter } from 'vue-router';
const router = useRouter();

function startSim() {
    router.push({ name: 'sim' });
}

</script>

<template>
    <main>
        <div class="bg">
            <!-- <img src="../assets/compost.jpg"> -->
        </div>
        <div id="form-container" class="centered">
            <UrlForm id="form" class="centered" @init="startSim()"/>
        </div>
    </main>
</template>

<style scoped>
.centered {
    margin: 0;
    position: absolute;
    top: 50%;
    left: 50%;
    -ms-transform: translate(-50%, -50%);
    transform: translate(-50%, -50%);
}

.bg {
    position: fixed;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background-color: rgb(187, 197, 168);
}

.bg img {
    z-index: -1;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin: auto;
    min-width: 50%;
    min-height: 50%;
}

#form {
    width: 480px;
}

#form-container {
    width: 525px;
    height: 75px;
    background-color: rgba(255, 255, 255, 0.33);
    border-radius: 8px;
}
</style>
