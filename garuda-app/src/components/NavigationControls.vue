<template>
  <div class="navigation-controls">
    <button 
      class="nav-btn"
      @click="$emit('prev')" 
      :disabled="currentIndex <= 0"
      aria-label="Previous location"
    >
      <span class="nav-arrow">←</span> Previous
    </button>
    
    <span class="nav-status">
      Location <strong>{{ currentIndex + 1 }}</strong> of <strong>{{ total }}</strong>
    </span>
    
    <button 
      class="nav-btn"
      @click="$emit('next')" 
      :disabled="currentIndex >= total - 1"
      aria-label="Next location"
    >
      Next <span class="nav-arrow">→</span>
    </button>
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

<style scoped lang="scss">
.navigation-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1.5rem;
  background: transparent;
  padding: 0;
  min-height: 40px;
}

.nav-status {
  color: var(--color-text-secondary);
  font-size: 1rem;
  letter-spacing: 0.01em;
  strong {
    color: var(--color-text);
    font-weight: 600;
  }
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.3em;
  background: var(--color-sidebar-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.4em 1.1em;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: 
    background 0.18s, 
    border-color 0.18s,
    color 0.18s;
  outline: none;

  &:hover:not(:disabled) {
    background: #eaeef2;
    border-color: #b6bac0;
    color: var(--color-text);
  }

  &:focus-visible {
    border-color: #58a6ff;
    box-shadow: 0 0 0 2px #b6e3ff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--color-sidebar-bg);
    color: var(--color-text-secondary);
    border-color: var(--color-border);
  }
}

.nav-arrow {
  font-size: 1.1em;
  vertical-align: middle;
  color: var(--color-icon);
}
</style>