<script setup>
import { SignIn, useAuth } from '@clerk/vue'; 
import { onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import '../assets/main.css';

const router = useRouter();
const { isSignedIn, isLoaded } = useAuth();

watch([isSignedIn, isLoaded], ([signedIn, loaded]) => {
  if (loaded && signedIn) {
    router.push('/');
  }
});
</script>

<template>
  <div v-if="isLoaded" class="auth-container">
    <div class="logo-container">
      <img src="/garuda.png" alt="Garuda Logo" />
      <h1>Garuda</h1>
    </div>
    
    <SignIn 
      v-if="!isSignedIn"
      :signUpUrl="'/sign-up'" 
      :forceRedirectUrl="'/'"
    />
    
    <div v-else class="loading-state">
      <div class="loader"></div>
      <p>Redirecting to dashboard...</p>
    </div>
  </div>
</template>

<style scoped>

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loader {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #4f46e5;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>