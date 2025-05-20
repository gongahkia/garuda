<script setup>
import { SignIn, useAuth } from '@clerk/vue'; // Added useAuth
import { onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import '../assets/main.css';

const router = useRouter();
const { isSignedIn, isLoaded } = useAuth();

// Redirect if already signed in
watch([isSignedIn, isLoaded], ([signedIn, loaded]) => {
  if (loaded && signedIn) {
    router.push('/');
  }
});
</script>

<template>
  <div v-if="isLoaded" class="auth-container">
    <div class="logo-container">
      <img src="../../public/garuda.png" alt="Garuda Logo" />
      <h1>Garuda</h1>
    </div>
    
    <!-- Only show SignIn component when NOT authenticated -->
    <SignIn 
      v-if="!isSignedIn"
      :signUpUrl="'/sign-up'" 
      :forceRedirectUrl="'/'"
    />
    
    <!-- Show loading state if already authenticated -->
    <div v-else class="loading-state">
      <div class="loader"></div>
      <p>Redirecting to dashboard...</p>
    </div>
  </div>
</template>

<style scoped>
/* Your existing styles remain the same */

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