<script setup>
import { SignUp } from '@clerk/vue';
import '../assets/main.css'; 
</script>

<template>
  <div class="auth-container">
    <div class="logo-container">
      <img src="../../public/garuda.png" alt="Garuda Logo" />
      <h1>Garuda</h1>
    </div>
    <SignUp 
      :signInUrl="'/sign-in'" 
      :forceRedirectUrl="'/'" 
    />
  </div>
</template>

<style scoped>
/* Same styling as SignIn.vue */
.auth-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
  background-color: var(--app-background-color, #f9fafb);
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
}

.logo-container img {
  height: 80px;
  width: auto;
  margin-bottom: 1rem;
}

.logo-container h1 {
  font-size: 2rem;
  color: var(--app-text-color, #111827);
}
</style>