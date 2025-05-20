<script setup>
import { useAuth } from '@clerk/vue'
import { computed } from 'vue'

const { isSignedIn, isLoaded } = useAuth()
const showLoader = computed(() => !isLoaded.value)
</script>

<template>
  <div v-if="showLoader" class="loader-container">
    <div class="loader"></div>
  </div>
  <router-view v-else />
</template>