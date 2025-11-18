<template>
  <div class="route-optimizer">
    <div class="optimizer-header">
      <h3 class="optimizer-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
        Neural Route Optimizer
      </h3>
      <p class="optimizer-subtitle">AI-powered route optimization for minimal travel time</p>
    </div>

    <div v-if="locations.length < 2" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
      <p>Add at least 2 locations to optimize your route</p>
    </div>

    <div v-else class="optimizer-content">
      <div class="algorithm-selector">
        <label class="selector-label">Optimization Algorithm</label>
        <select v-model="selectedAlgorithm" class="algorithm-select">
          <option value="hybrid">🧠 Hybrid (Best Results)</option>
          <option value="nearest">⚡ Nearest Neighbor (Fast)</option>
          <option value="2opt">🔄 2-Opt (Balanced)</option>
          <option value="annealing">🌡️ Simulated Annealing (Thorough)</option>
        </select>
      </div>

      <div class="current-stats">
        <div class="stat-card">
          <span class="stat-label">Locations</span>
          <span class="stat-value">{{ locations.length }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Current Order</span>
          <span class="stat-value">{{ currentDistance }} km</span>
        </div>
      </div>

      <button
        class="optimize-btn"
        @click="runOptimization"
        :disabled="isOptimizing || locations.length < 2"
      >
        <svg v-if="!isOptimizing" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
          <polyline points="7.5 19.79 7.5 14.6 3 12"/>
          <polyline points="21 12 16.5 14.6 16.5 19.79"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
        <div v-else class="spinner"></div>
        {{ isOptimizing ? 'Optimizing...' : 'Optimize Route' }}
      </button>

      <div v-if="optimizationResult" class="results-panel">
        <div class="results-header">
          <h4>Optimization Results</h4>
          <button class="close-btn" @click="optimizationResult = null">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="improvement-banner" :class="improvementClass">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <div class="improvement-text">
            <strong>{{ optimizationResult.improvement }}% improvement</strong>
            <span>Saved {{ optimizationResult.savings.distance }} km</span>
          </div>
        </div>

        <div class="result-stats">
          <div class="result-stat">
            <span class="result-label">Original Distance</span>
            <span class="result-value old">{{ optimizationResult.originalDistance }} km</span>
          </div>
          <div class="result-stat">
            <span class="result-label">Optimized Distance</span>
            <span class="result-value new">{{ optimizationResult.totalDistance }} km</span>
          </div>
          <div class="result-stat">
            <span class="result-label">Algorithm</span>
            <span class="result-value">{{ getAlgorithmName(optimizationResult.algorithm) }}</span>
          </div>
        </div>

        <div class="action-buttons">
          <button class="apply-btn" @click="applyOptimization">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Apply Optimized Route
          </button>
          <button class="cancel-btn" @click="optimizationResult = null">
            Cancel
          </button>
        </div>
      </div>

      <div v-if="showDirections && directionsData" class="directions-panel">
        <h4>Route Directions</h4>
        <div class="directions-summary">
          <div class="direction-stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {{ directionsData.totalDuration }} minutes
          </div>
          <div class="direction-stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {{ directionsData.totalDistance.toFixed(1) }} km
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { optimizeRoute, getRouteDirections } from '../services/routeOptimizer';

export default {
  props: {
    locations: {
      type: Array,
      required: true
    }
  },
  emits: ['update-locations', 'update-directions'],
  setup(props, { emit }) {
    const selectedAlgorithm = ref('hybrid');
    const isOptimizing = ref(false);
    const optimizationResult = ref(null);
    const showDirections = ref(false);
    const directionsData = ref(null);

    const currentDistance = computed(() => {
      if (props.locations.length < 2) return 0;

      let total = 0;
      for (let i = 0; i < props.locations.length - 1; i++) {
        const loc1 = props.locations[i].position;
        const loc2 = props.locations[i + 1].position;
        total += calculateDistance(loc1, loc2);
      }
      return total.toFixed(2);
    });

    const improvementClass = computed(() => {
      if (!optimizationResult.value) return '';
      const improvement = parseFloat(optimizationResult.value.improvement);
      if (improvement >= 20) return 'excellent';
      if (improvement >= 10) return 'good';
      return 'moderate';
    });

    function calculateDistance(coord1, coord2) {
      const R = 6371;
      const dLat = toRad(coord2.lat - coord1.lat);
      const dLng = toRad(coord2.lng - coord1.lng);

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(coord1.lat)) *
          Math.cos(toRad(coord2.lat)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    function toRad(degrees) {
      return degrees * (Math.PI / 180);
    }

    const runOptimization = async () => {
      isOptimizing.value = true;
      optimizationResult.value = null;

      try {
        const result = await optimizeRoute(props.locations, {
          algorithm: selectedAlgorithm.value
        });

        optimizationResult.value = result;

        // Get directions for the optimized route
        try {
          const directions = await getRouteDirections(result.optimizedLocations);
          directionsData.value = directions;
          showDirections.value = true;
        } catch (err) {
          console.warn('Could not get directions:', err);
        }
      } catch (error) {
        console.error('Optimization failed:', error);
      } finally {
        isOptimizing.value = false;
      }
    };

    const applyOptimization = () => {
      if (optimizationResult.value) {
        emit('update-locations', optimizationResult.value.optimizedLocations);

        if (directionsData.value) {
          emit('update-directions', directionsData.value);
        }

        optimizationResult.value = null;
      }
    };

    const getAlgorithmName = (algorithm) => {
      const names = {
        hybrid: 'Hybrid AI',
        nearest: 'Nearest Neighbor',
        '2opt': '2-Opt',
        annealing: 'Simulated Annealing'
      };
      return names[algorithm] || algorithm;
    };

    return {
      selectedAlgorithm,
      isOptimizing,
      optimizationResult,
      showDirections,
      directionsData,
      currentDistance,
      improvementClass,
      runOptimization,
      applyOptimization,
      getAlgorithmName
    };
  }
};
</script>

<style scoped lang="scss">
.route-optimizer {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.optimizer-header {
  margin-bottom: 1.5rem;
}

.optimizer-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;

  svg {
    color: #8250df;
  }
}

.optimizer-subtitle {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary);

  svg {
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 0.95rem;
  }
}

.optimizer-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.algorithm-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.selector-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.algorithm-select {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-sidebar-bg);
  color: var(--color-text);
  font-size: 0.95rem;
  cursor: pointer;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #8250df;
    box-shadow: 0 0 0 3px rgba(130, 80, 223, 0.1);
  }
}

.current-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.stat-card {
  background: var(--color-sidebar-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.optimize-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #8250df 0%, #6e40c9 100%);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(130, 80, 223, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.results-panel {
  background: var(--color-sidebar-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 1rem;
  margin-top: 0.5rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h4 {
    margin: 0;
    font-size: 1rem;
    color: var(--color-text);
  }
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--color-icon);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.improvement-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  border-radius: 6px;
  margin-bottom: 1rem;

  &.excellent {
    background: #dafbe1;
    color: #116329;
  }

  &.good {
    background: #fff8c5;
    color: #7d4e00;
  }

  &.moderate {
    background: #ddf4ff;
    color: #0969da;
  }

  svg {
    flex-shrink: 0;
  }
}

.improvement-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;

  strong {
    font-size: 1rem;
  }

  span {
    font-size: 0.875rem;
    opacity: 0.9;
  }
}

.result-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.result-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
}

.result-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.result-value {
  font-weight: 600;
  color: var(--color-text);

  &.old {
    text-decoration: line-through;
    opacity: 0.6;
  }

  &.new {
    color: #2ea043;
  }
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.apply-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #2ea043;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #2c974b;
  }
}

.cancel-btn {
  background: var(--color-sidebar-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #eaeef2;
  }
}

.directions-panel {
  background: var(--color-sidebar-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 1rem;
  margin-top: 0.5rem;

  h4 {
    margin: 0 0 0.75rem 0;
    font-size: 1rem;
    color: var(--color-text);
  }
}

.directions-summary {
  display: flex;
  gap: 1rem;
}

.direction-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-text);

  svg {
    color: var(--color-icon);
  }
}
</style>
