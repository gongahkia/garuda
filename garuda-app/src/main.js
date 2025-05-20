import { createApp } from 'vue'
import { clerkPlugin } from '@clerk/vue'
import VueGoogleMaps from '@fawmi/vue-google-maps'
import App from './App.vue'
import router from './router' 

const app = createApp(App)
app.use(clerkPlugin, {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
})
app.use(router)
app.use(VueGoogleMaps, {
  load: {
    key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: "places"
  }
})
app.mount('#app')