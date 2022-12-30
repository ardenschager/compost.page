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
      // route level code-splitting
      // this generates a separate chunk (grid.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("./views/SimView.vue"),
    },
  ],
});
const pinia = createPinia();

app.component('v-select', vSelect);

app.use(router);
app.use(pinia);

app.mount("#app");
