import { createApp } from 'vue'
import { clerkPlugin } from '@clerk/vue'
import VueGoogleMaps from '@fawmi/vue-google-maps'
import AppContainer from './AppContainer.vue' 
import router from './router' 

const app = createApp(AppContainer) 

app.use(clerkPlugin, {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  appearance: {
    variables: {
      colorPrimary: '#4f46e5', 
      borderRadius: '6px',
      fontFamily: 'your-preferred-font, sans-serif'
    }
  }
})

app.use(router)

app.use(VueGoogleMaps, {
  load: {
    key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: "places"
  }
})

app.mount('#app')