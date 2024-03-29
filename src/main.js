import { createApp } from "vue";
import App from "./App.vue";
import vSelect from 'vue-select';
import { createRouter, createWebHistory } from "vue-router";
import InputView from "./views/InputView.vue";
import { createPinia } from 'pinia';

const app = createApp(App);
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "input",
      component: InputView,
    },
    {
      path: "/sim",
      name: "sim",
      component: () => import("./views/SimView.vue"),
    },
  ],
});
const pinia = createPinia();

app.component('v-select', vSelect);

app.use(router);
app.use(pinia);
app.config.globalProperties.window = window;

app.mount("#app");
