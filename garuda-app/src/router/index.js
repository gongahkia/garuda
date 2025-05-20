import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@clerk/vue'
import App from '../App.vue'
import SignIn from '../views/SignIn.vue'
import SignUp from '../views/SignUp.vue'

const routes = [
  {
    path: '/sign-in',
    component: SignIn,
    meta: { requiresAuth: false }
  },
  {
    path: '/sign-up',
    component: SignUp,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: App,  
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const { isSignedIn, isLoaded } = useAuth()
  
  if (!isLoaded.value) return 
  
  if (to.meta.requiresAuth && !isSignedIn.value) {
    return { name: 'SignIn' }
  }
  
  if ((to.path === '/sign-in' || to.path === '/sign-up') && isSignedIn.value) {
    return { path: '/' }
  }
})

export default router