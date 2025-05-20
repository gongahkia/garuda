<script setup>
import { ref, computed } from 'vue';
import { useAuth, SignOutButton } from '@clerk/vue'; // Added Clerk imports
import MapComponent from './components/MapComponent.vue';
import LocationList from './components/LocationList.vue';

// Clerk authentication state
const { isSignedIn, user } = useAuth();

// Existing location state management
const locations = ref([]);
const currentLocationIndex = ref(-1);
const mapCenter = ref({ lat: 51.5074, lng: -0.1278 });
const mapZoom = ref(12);

// Existing computed properties and methods
const totalLocations = computed(() => locations.value.length);

const addLocation = (newLocation) => {
  locations.value = [...locations.value, {
    ...newLocation,
    tags: [],
    notes: '',
    createdAt: new Date().toISOString()
  }]
};

const reorderLocations = (newOrder) => {
  locations.value = newOrder;
};

const updateLocation = (updatedLocation) => {
  locations.value = locations.value.map(loc => 
    loc.id === updatedLocation.id ? updatedLocation : loc
  );
};

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
</script>

<template>

  <header class="app-header">
    <div class="header-content">
      <img alt="Garuda logo" class="logo" src="./../garuda.png" width="50" height="50" />
      <div class="header-info">
        <h1 class="app-title">ガルーダ</h1>
      </div>
      <div class="user-controls">
        <template v-if="isSignedIn">
          <span class="user-greeting">
            {{ user?.firstName || user?.emailAddresses[0]?.emailAddress }}
          </span>
          <SignOutButton class="sign-out-button" redirectUrl="/sign-in" />
        </template>
        <template v-else>
          <span style="width: 120px; display: inline-block;"></span>
        </template>
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
    />

    <div class="map-container">
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
  </main>

  <footer class="app-footer">
    <span>
      Made with <span class="footer-heart">❤️</span> by
      <a href="https://gabrielongzm.com" class="footer-link" target="_blank" rel="noopener">Gabriel Ong</a>.
      &nbsp;•&nbsp;
      Source code <a href="https://github.com/gongahkia/garuda" class="footer-link" target="_blank" rel="noopener">here</a>.
    </span>
  </footer>
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

  .logo {
    border-radius: 6px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
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

  // Added user controls styling
  .user-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    
    .user-greeting {
      font-family: 'Roboto', sans-serif;
      color: var(--color-text);
      font-size: 1rem;
    }

    .sign-out-button {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: 6px 12px;
      color: var(--color-text);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    }
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
  border-right: 1px solid var(--color-border);
  background: var(--color-sidebar-bg);
  padding: 1rem;
  overflow-y: auto;
}

.map-container {
  font-family: 'Roboto', Arial, sans-serif;
  background: var(--color-bg);
  position: relative;
  border-left: 1px solid var(--color-border);
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