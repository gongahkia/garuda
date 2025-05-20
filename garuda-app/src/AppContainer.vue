<script setup>
import { useAuth } from '@clerk/vue';
import { computed } from 'vue';

const { isSignedIn, isLoaded } = useAuth();
const showLoader = computed(() => !isLoaded.value);
</script>

<template>
  <div v-if="showLoader" class="loader-container">
    <div class="loader"></div>
  </div>
  <router-view v-else></router-view>
</template>

<style>
.loader-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
}

.loader {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>