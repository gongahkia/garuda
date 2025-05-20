<template>
  <div class="navigation-controls">
    <button 
      @click="$emit('prev')" 
      :disabled="currentIndex <= 0"
    >⬅ Previous</button>
    
    <span>Location {{ currentIndex + 1 }} of {{ total }}</span>
    
    <button 
      @click="$emit('next')" 
      :disabled="currentIndex >= total - 1"
    >Next ➡</button>
  </div>
</template>

<script>
export default {
  props: {
    currentIndex: Number,
    total: Number
  },
  emits: ['prev', 'next']
};
</script>

<style>
.navigation-controls {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: #fff;
  border-bottom: 1px solid #ddd;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
