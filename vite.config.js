import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    build: {
        outDir: 'dist',
        manifest: false,
        rollupOptions: {
            // input: 'server.js',
        },
    },
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            'vue': 'vue/dist/vue.esm-bundler.js'
        },
    },
    server: {
        proxy: {
            // '/scrape': 'https://www.compost.page'
            '/scrape': 'http://localhost:3000'
        }
    },
});
