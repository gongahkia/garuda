<template>
  <div class="location-list">
    <h3>Saved Locations ({{ locations.length }})</h3>
    <draggable 
      v-model="localLocations"
      item-key="id"
      handle=".drag-handle"
      @update="handleDragUpdate"
    >
      <template #item="{ element, index }">
        <li>
          <div class="location-item">
            <span class="drag-handle">↕️</span>
            <span class="location-info">{{ index + 1 }}. {{ element.name }}</span>
            <div class="item-actions">
              <button @click="$emit('navigate-to', element)">📍</button>
              <button @click="$emit('delete-location', element.id)">🗑️</button>
            </div>
          </div>
        </li>
      </template>
    </draggable>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import draggable from 'vuedraggable';

export default defineComponent({
  components: {
    draggable
  },
  props: {
    locations: {
      type: Array,
      required: true
    }
  },
  emits: ['navigate-to', 'delete-location', 'reorder'],
  data() {
    return {
      localLocations: [...this.locations]
    };
  },
  watch: {
    locations(newVal) {
      this.localLocations = [...newVal];
    }
  },
  methods: {
    handleDragUpdate() {
      this.$emit('reorder', this.localLocations);
    }
  }
});
</script>

<style>
.location-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  margin: 0.25rem 0;
  background: white;
  border-radius: 4px;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: move;
}

.location-item.sortable-chosen {
  background: #f8f9fa;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.drag-handle {
  cursor: grab;
  user-select: none;
  padding: 0 0.5rem;
}

.location-info {
  flex-grow: 1;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
}
</style>