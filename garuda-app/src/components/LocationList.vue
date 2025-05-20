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
            <div class="location-content">
              <div class="location-header">
                <span class="location-index">{{ index + 1 }}.</span>
                <span class="location-name">{{ element.name }}</span>
              </div>
              
              <div class="notes-section">
                <div v-if="editingNoteId !== element.id" class="notes-preview">
                  {{ truncateNotes(element.notes) || 'Click to add notes...' }}
                </div>
                <textarea
                  v-else
                  v-model="editedNotes"
                  @blur="saveNotes(element)"
                  class="notes-editor"
                  placeholder="Enter notes..."
                ></textarea>
              </div>
            </div>

            <div class="item-actions">
              <button 
                class="notes-button"
                @click.stop="toggleNotesEdit(element)"
                :title="editingNoteId === element.id ? 'Save notes' : 'Edit notes'"
              >
                📝
              </button>
              <button 
                class="nav-button"
                @click.stop="$emit('navigate-to', element)"
                title="Center on location"
              >
                📍
              </button>
              <button 
                class="delete-button"
                @click.stop="$emit('delete-location', element.id)"
                title="Delete location"
              >
                🗑️
              </button>
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
      required: true,
      validator: (locations) => locations.every(loc => 'notes' in loc)
    }
  },
  emits: ['navigate-to', 'delete-location', 'reorder', 'update-notes'],
  data() {
    return {
      localLocations: [...this.locations],
      editingNoteId: null,
      editedNotes: ''
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
    },
    truncateNotes(notes, maxLength = 40) {
      return notes?.length > maxLength 
        ? notes.substring(0, maxLength) + '...' 
        : notes;
    },
    toggleNotesEdit(location) {
      if (this.editingNoteId === location.id) {
        this.saveNotes(location);
      } else {
        this.editingNoteId = location.id;
        this.editedNotes = location.notes || '';
      }
    },
    saveNotes(location) {
      this.$emit('update-notes', {
        id: location.id,
        notes: this.editedNotes.trim()
      });
      this.editingNoteId = null;
      this.editedNotes = '';
    }
  }
});
</script>

<style>
.notes-section {
  margin-top: 0.5rem;
}

.notes-preview {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.notes-preview:hover {
  background: #f8f9fa;
}

.notes-preview:empty::before {
  content: 'Click to add notes...';
  color: #999;
  font-style: italic;
}

.notes-editor {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 60px;
}

.item-actions {
  display: flex;
  gap: 0.25rem;
  padding-left: 0.5rem;
  flex-shrink: 0;
}
</style>