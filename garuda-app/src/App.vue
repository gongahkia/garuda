<script setup>
import { ref, computed } from 'vue';
import MapComponent from './components/MapComponent.vue';
import LocationList from './components/LocationList.vue';
import NavigationControls from './components/NavigationControls.vue';

const locations = ref([]);
const currentLocationIndex = ref(-1);
const mapCenter = ref({ lat: 51.5074, lng: -0.1278 });
const mapZoom = ref(12);

const totalLocations = computed(() => locations.value.length);

const addLocation = (newLocation) => {
  locations.value = [...locations.value, newLocation];
  currentLocationIndex.value = locations.value.length - 1;
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
  <header>
    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />
    <div class="title">
      <h1>Garuda Location Manager</h1>
      <NavigationControls
        :current-index="currentLocationIndex"
        :total="totalLocations"
        @prev="navigateTo(currentLocationIndex - 1)"
        @next="navigateTo(currentLocationIndex + 1)"
      />
    </div>
  </header>

  <main class="app-main">
    <LocationList
      class="sidebar"
      :locations="locations"
      @navigate-to="loc => navigateTo(locations.indexOf(loc))"
      @delete-location="deleteLocation"
    />
    
    <div class="map-wrapper">
      <MapComponent
        :locations="locations"
        :center="currentLocation"
        :zoom="mapZoom"
        @add-location="addLocation"
        @center-changed="newCenter => mapCenter = newCenter"
      />
    </div>
  </main>
</template>

<style>
.app-main {
  display: grid;
  grid-template-columns: 300px 1fr;
  height: calc(100vh - 160px);
}

.sidebar {
  border-right: 1px solid #ddd;
}

.map-wrapper {
  height: 100%;
  position: relative;
}

.title {
  flex-grow: 1;
}
</style>