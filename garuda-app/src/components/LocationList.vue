<template>
  <div class="location-list">
    <h3>Saved Locations ({{ locations.length }})</h3>
    <ul>
      <li v-for="(location, index) in locations" :key="location.id">
        <div class="location-item">
          <span>{{ index + 1 }}. {{ location.name }}</span>
          <div class="item-actions">
            <button @click="$emit('navigate-to', location)">📍</button>
            <button @click="$emit('delete-location', location.id)">🗑️</button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    locations: {
      type: Array,
      required: true
    }
  },
  emits: ['navigate-to', 'delete-location']
};
</script>

<style>
.location-list {
  padding: 1rem;
  background: #f5f5f5;
  height: 100%;
  overflow-y: auto;
}

.location-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  margin: 0.25rem 0;
  background: white;
  border-radius: 4px;
}

.item-actions button {
  margin-left: 0.5rem;
  padding: 0.25rem 0.5rem;
}
</style>
