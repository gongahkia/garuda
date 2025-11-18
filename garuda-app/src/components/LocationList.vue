<template>
  <div class="location-list">
    <slot name="header"></slot>
    <h3 class="list-title">Saved Locations ({{ locations.length }})</h3>
    <draggable 
      v-model="localLocations"
      item-key="id"
      handle=".drag-handle"
      @update="handleDragUpdate"
      tag="ul"
      class="location-ul"
    >
      <template #item="{ element, index }">
        <li class="location-li">
          <div class="location-item">
            <span class="drag-handle" title="Drag to reorder">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="7" cy="6" r="1" fill="currentColor"/>
                <circle cx="13" cy="6" r="1" fill="currentColor"/>
                <circle cx="7" cy="10" r="1" fill="currentColor"/>
                <circle cx="13" cy="10" r="1" fill="currentColor"/>
                <circle cx="7" cy="14" r="1" fill="currentColor"/>
                <circle cx="13" cy="14" r="1" fill="currentColor"/>
              </svg>
            </span>
            <div class="location-content">
              <div class="location-header">
                <span class="location-index">{{ index + 1 }}.</span>
                <span class="location-name">{{ element.name }}</span>
              </div>
              
              <div class="notes-section">
                <div
                  v-if="editingNoteId !== element.id"
                  class="notes-preview"
                  @click="toggleNotesEdit(element)"
                >
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
                class="icon-btn"
                @click.stop="toggleNotesEdit(element)"
                :title="editingNoteId === element.id ? 'Save notes' : 'Edit notes'"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
              </button>
              <button 
                class="icon-btn"
                @click.stop="$emit('navigate-to', element)"
                title="Center on location"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </button>
              <button 
                class="icon-btn delete"
                @click.stop="$emit('delete-location', element.id)"
                title="Delete location"
              >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
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

<style scoped lang="scss">
.location-list {
  padding: 0;
  background: var(--color-sidebar-bg);
  color: var(--color-text);
  height: 100%;
}

.list-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 1rem 0;
  padding: 0.5rem 0 0.5rem 0.5rem;
  border-bottom: 1px solid var(--color-border);
  background: transparent;
  letter-spacing: 0.01em;
}

.location-ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.location-li + .location-li {
  border-top: 1px solid var(--color-border);
}

.location-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.8rem 0.5rem;
  border-radius: 6px;
  transition: background 0.15s;
  background: transparent;

  &:hover {
    background: #eaeef2;
  }
}

.drag-handle {
  cursor: grab;
  color: var(--color-icon);
  font-size: 1.2em;
  margin-right: 0.5rem;
  user-select: none;
}

.location-content {
  flex: 1 1 0;
  min-width: 0;
}

.location-header {
  display: flex;
  align-items: center;
  gap: 0.4em;
  margin-bottom: 0.2em;
}

.location-index {
  color: var(--color-text-secondary);
  font-weight: 500;
  font-size: 2em;
  font-family: 'Exile', Arial, sans-serif;
  margin-right: 0.5rem;
}

.location-name {
  font-weight: 600;
  color: var(--color-text);
  font-size: 1em;
  word-break: break-word;
}

.notes-section {
  margin-top: 0.25rem;
}

.notes-preview {
  color: var(--color-text-secondary);
  font-size: 0.95em;
  line-height: 1.4;
  cursor: pointer;
  padding: 0.25rem 0.4rem;
  border-radius: 4px;
  transition: background 0.2s;
  background: transparent;

  &:hover {
    background: #f6f8fa;
  }
}

.notes-editor {
  width: 100%;
  padding: 0.5rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.95em;
  resize: vertical;
  min-height: 60px;
  color: var(--color-text);
  background: var(--color-bg);
}

.item-actions {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-left: 0.5rem;
}

.icon-btn {
  background: var(--color-sidebar-bg);
  border: 1px solid var(--color-border);
  color: var(--color-icon);
  border-radius: 5px;
  padding: 0.25rem 0.5rem;
  font-size: 1.1em;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &:focus-visible {
    outline: none;
    border-color: #58a6ff;
    box-shadow: 0 0 0 2px #b6e3ff;
  }
}

.icon-btn:not(.delete):hover, .icon-btn:not(.delete):active {
  background: #dafbe1;
  color: #116329;
  border-color: #2ea043;
}

.icon-btn.delete {
  color: #f85149;

  &:hover,
  &:active {
    background: #ffe2e0;
    color: #b62324;
    border-color: #f85149;
  }
}
</style>
