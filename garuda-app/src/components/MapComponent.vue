<template>
  <div class="map-container">
    <div class="map-toolbar">
      <GMapAutocomplete
        placeholder="Search location"
        @place_changed="handlePlaceSelect"
        class="search-bar"
      />
      
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
          Location <strong>{{ currentIndex + 1 }}</strong> of <strong>{{ locations.length }}</strong>
        </span>
        
        <button 
          class="nav-btn"
          @click="$emit('next')" 
          :disabled="currentIndex >= locations.length - 1"
          aria-label="Next location"
        >
          Next <span class="nav-arrow">→</span>
        </button>
      </div>
    </div>

    <GMapMap
      ref="mapRef"
      :center="center"
      :zoom="zoom"
      map-type-id="terrain"
      style="width: 100%; height: 600px"
      @click="handleMapClick"
    >
      <GMapMarker
        v-for="(location, index) in locations"
        :key="location.id"
        :position="location.position"
        :label="String(index + 1)"
        @click="center = location.position"
      />
    </GMapMap>
  </div>
</template>

<script>
export default {
  props: {
    locations: {
      type: Array,
      required: true
    },
    center: {
      type: Object,
      required: true
    },
    zoom: {
      type: Number,
      default: 12
    },
    currentIndex: {
      type: Number,
      required: true
    }
  },
  emits: ['add-location', 'center-changed', 'prev', 'next'],
  methods: {
    handlePlaceSelect(place) {
      const position = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };
      const newLocation = {
        id: Date.now(),
        name: place.name || `Location ${this.locations.length + 1}`,
        position,
        address: place.formatted_address
      };
      this.$emit('add-location', newLocation);
      this.$emit('center-changed', position);
    },

    handleMapClick(event) {
      const newLocation = {
        id: Date.now(),
        name: `Custom Location ${this.locations.length + 1}`,
        position: {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        }
      };
      this.$emit('add-location', newLocation);
    }
  }
};
</script>

<style scoped lang="scss">

.map-container {
  position: relative;
  height: 100%;
}

.map-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-bar {
  width: 100%;
  max-width: 400px;
  padding: 0.75rem 1.25rem;
  font-size: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-sidebar-bg);
  color: var(--color-text);
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);

  &:focus {
    outline: none;
    border-color: var(--color-icon);
    box-shadow: 0 0 0 3px rgba(88,166,255,0.1);
  }

  &::placeholder {
    color: var(--color-text-secondary);
    opacity: 0.8;
  }
}

.navigation-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
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