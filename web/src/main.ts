import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

import './assets/variables.css';
import { Chart, registerables } from 'chart.js';
import '@vuepic/vue-datepicker/dist/main.css';

const pinia = createPinia()

pinia.use(piniaPluginPersistedstate);

Chart.register(...registerables);

document.title = 'Flux logs'

createApp(App)
  .use(pinia)
  .use(router)
  .mount('#app');