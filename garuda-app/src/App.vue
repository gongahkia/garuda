<script setup>
import { ref, computed } from 'vue';
import MapComponent from './components/MapComponent.vue';
import LocationList from './components/LocationList.vue';
import AIVisualPlanner from './components/AIVisualPlanner.vue';
import CollaborativeCursor from './components/CollaborativeCursor.vue';
import PresenceIndicator from './components/PresenceIndicator.vue';
import RouteOptimizer from './components/RouteOptimizer.vue';
import TransportIntegration from './components/TransportIntegration.vue';

const locations = ref([]);
const currentLocationIndex = ref(-1);
const mapCenter = ref({ lat: 51.5074, lng: -0.1278 });
const mapZoom = ref(12);

// Collaborative features
const tripId = ref('default-trip-' + Date.now());
const currentUser = ref({
  id: 'user-' + Math.random().toString(36).substr(2, 9),
  name: 'Guest User'
});

const totalLocations = computed(() => locations.value.length);

const addLocation = (newLocation) => {
  locations.value = [...locations.value, {
    ...newLocation,
    tags: newLocation.tags || [],
    notes: newLocation.notes || '',
    createdAt: newLocation.createdAt || new Date().toISOString()
  }]
}

const addMultipleLocations = (newLocations) => {
  locations.value = [...locations.value, ...newLocations];
  if (newLocations.length > 0 && newLocations[0].position) {
    mapCenter.value = newLocations[0].position;
    mapZoom.value = 12;
  }
}

const reorderLocations = (newOrder) => {
  locations.value = newOrder;
};

const updateLocation = (updatedLocation) => {
  locations.value = locations.value.map(loc => 
    loc.id === updatedLocation.id ? updatedLocation : loc
  )
}

const deleteLocation = (id) => {
  locations.value = locations.value.filter(loc => loc.id !== id);
  currentLocationIndex.value = Math.min(
    currentLocationIndex.value, 
    locations.value.length - 1
  );
};

const navigateTo = (index) => {
  if (index >= 0 && index < locations.value.length) {
    currentLocationIndex.value = index;
    mapCenter.value = locations.value[index].position;
  }
};

const currentLocation = computed(() =>
  locations.value[currentLocationIndex.value]?.position || mapCenter.value
);

const updateLocationsFromOptimizer = (optimizedLocations) => {
  locations.value = optimizedLocations;
  currentLocationIndex.value = 0;
  if (optimizedLocations.length > 0) {
    mapCenter.value = optimizedLocations[0].position;
  }
};

const updateDirections = (directions) => {
  // Store directions for map rendering if needed
  console.log('Route directions updated:', directions);
};
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <div class="logo-placeholder">
        <svg width="50" height="50" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="45" fill="#58a6ff"/>
          <path d="M50 20 L70 40 L60 40 L60 70 L40 70 L40 40 L30 40 Z" fill="white"/>
        </svg>
      </div>
      <div class="header-info">
        <h1 class="app-title">ガルーダ</h1>
      </div>
    </div>
  </header>

  <main class="app-main">
    <LocationList
      class="sidebar"
      :locations="locations"
      @navigate-to="loc => navigateTo(locations.indexOf(loc))"
      @delete-location="deleteLocation"
      @reorder="reorderLocations"
    >
      <template #header>
        <PresenceIndicator
          :trip-id="tripId"
          :current-user="currentUser"
        />
      </template>
    </LocationList>

    <div class="map-container">
      <div class="map-content">
        <AIVisualPlanner @add-locations="addMultipleLocations" />

        <RouteOptimizer
          :locations="locations"
          @update-locations="updateLocationsFromOptimizer"
          @update-directions="updateDirections"
        />

        <TransportIntegration
          :locations="locations"
        />

        <MapComponent
          :locations="locations"
          :center="currentLocation"
          :zoom="mapZoom"
          :current-index="currentLocationIndex"
          @add-location="addLocation"
          @center-changed="newCenter => mapCenter = newCenter"
          @update-location="updateLocation"
          @prev="navigateTo(currentLocationIndex - 1)"
          @next="navigateTo(currentLocationIndex + 1)"
        />
      </div>
    </div>
  </main>

  <footer class="app-footer">
    <span>
      Made with <span class="footer-heart">❤️</span> by
      <a href="https://gabrielongzm.com" class="footer-link" target="_blank" rel="noopener">Gabriel Ong</a>.
      &nbsp;•&nbsp;
      Source code <a href="https://github.com/gongahkia/garuda" class="footer-link" target="_blank" rel="noopener">here</a>.
    </span>
  </footer>

  <!-- Collaborative cursors overlay -->
  <CollaborativeCursor
    :trip-id="tripId"
    :current-user="currentUser"
  />
</template>

<style scoped lang="scss">

.app-header {
  font-family: 'Cherry Bomb One', cursive;
  background: var(--color-header-bg);
  border-bottom: 1px solid var(--color-border);
  padding: 0 1.5rem;
  height: 60px;
  display: flex;
  align-items: center;

  .header-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
  }

  .logo-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-info {
    flex-grow: 1;
  }

  .app-title {
    font-size: 2.5rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }
}

.app-main {
  display: grid;
  grid-template-columns: 300px 1fr;
  height: calc(100vh - 60px - 56px); // header + footer
  background: var(--color-bg);
}

.sidebar {
  font-family: 'Roboto', Arial, sans-serif;
  right: 1px solid var(--color-border);
  background: var(--color-sidebar-bg);
  padding: 1rem;
  overflow-y: auto;
}

.map-container {
  font-family: 'Roboto', Arial, sans-serif;
  background: var(--color-bg);
  position: relative;
  border-left: 1px solid var(--color-border);
  overflow-y: auto;
}

.map-content {
  padding: 1rem;
}

.app-footer {
  font-family: 'Roboto', Arial, sans-serif;
  background: var(--color-header-bg);
  border-top: 1px solid var(--color-border);
  text-align: center;
  font-size: 1rem;
  letter-spacing: 0.01em;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .footer-link {
    color: #58a6ff;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;

    &:hover {
      color: #79c0ff;
      text-decoration: underline;
    }
  }

  .footer-heart {
    color: #f85149;
    font-size: 1.1em;
    vertical-align: middle;
  }
}

:root {
  --color-header-bg: #24292f;
  --color-bg: #ffffff;
  --color-sidebar-bg: #f6f8fa;
  --color-text: #1f2328;
  --color-text-secondary: #656d76;
  --color-border: #d0d7de;
  --color-icon: #57606a;
}
</style>