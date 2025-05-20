<template>
  <div class="map-container">
    <GMapAutocomplete
      placeholder="Search location"
      @place_changed="handlePlaceSelect"
      class="search-bar"
    />
    
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
    }
  },
  emits: ['add-location', 'center-changed'],
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
.search-bar {
  width: 100%;
  max-width: 400px;
  margin: 1rem 0;
  display: block;
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

.map-container {
  position: relative;
  height: 100%;
}
</style>