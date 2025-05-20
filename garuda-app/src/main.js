import { createApp } from 'vue'
import { clerkPlugin } from '@clerk/vue'
import VueGoogleMaps from '@fawmi/vue-google-maps'
import App from './App.vue'

const app = createApp(App)

app.use(VueGoogleMaps, {
  load: {
    key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: "places"
  }
}).mount('#app')