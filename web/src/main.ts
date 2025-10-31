import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

import './assets/variables.css';
import { Chart, registerables } from 'chart.js';
import '@vuepic/vue-datepicker/dist/main.css';
import { useThemeStore } from './stores/themeStore';

const pinia = createPinia()

pinia.use(piniaPluginPersistedstate);

Chart.register(...registerables);

const app = createApp(App);
app.use(pinia);
app.use(router);

// Initialize theme before mounting
const themeStore = useThemeStore();
themeStore.initTheme();

app.mount('#app');