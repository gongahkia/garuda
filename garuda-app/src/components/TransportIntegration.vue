<template>
  <div class="transport-integration">
    <div class="transport-header">
      <h3 class="transport-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="1" y="3" width="15" height="13"/>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
        Multi-Modal Transport
      </h3>
      <p class="transport-subtitle">Compare travel options and environmental impact</p>
    </div>

    <div v-if="locations.length < 2" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>Add at least 2 locations to compare transport options</p>
    </div>

    <div v-else class="transport-content">
      <div class="route-selector">
        <label class="selector-label">Select Route Segment</label>
        <select v-model="selectedSegmentIndex" class="segment-select" @change="loadTransportOptions">
          <option v-for="(segment, index) in routeSegments" :key="index" :value="index">
            {{ segment.from.name }} → {{ segment.to.name }}
          </option>
        </select>
      </div>

      <button
        class="analyze-btn"
        @click="analyzeAllSegments"
        :disabled="isAnalyzing"
      >
        <svg v-if="!isAnalyzing" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        </svg>
        <div v-else class="spinner"></div>
        {{ isAnalyzing ? 'Analyzing...' : 'Analyze Full Route' }}
      </button>

      <div v-if="transportOptions.length > 0" class="options-container">
        <div class="options-header">
          <h4>Transport Options</h4>
          <div class="filter-chips">
            <button
              v-for="mode in availableModes"
              :key="mode"
              class="filter-chip"
              :class="{ active: !hiddenModes.has(mode) }"
              @click="toggleMode(mode)"
            >
              {{ getModeIcon(mode) }} {{ mode.toLowerCase() }}
            </button>
          </div>
        </div>

        <div class="options-list">
          <div
            v-for="(option, index) in visibleOptions"
            :key="index"
            class="transport-option"
            :class="{ recommended: index === 0 }"
          >
            <div class="option-header">
              <div class="mode-icon" :style="{ backgroundColor: getModeColor(option.mode) }">
                {{ getModeIcon(option.mode) }}
              </div>
              <div class="option-info">
                <h5 class="mode-name">{{ option.mode }}</h5>
                <span v-if="index === 0" class="recommended-badge">Recommended</span>
              </div>
            </div>

            <div class="option-metrics">
              <div class="metric">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>{{ option.durationText }}</span>
              </div>

              <div class="metric">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>{{ option.distanceText }}</span>
              </div>

              <div class="metric cost">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                <span>${{ option.cost.amount }}</span>
              </div>

              <div class="metric carbon" :class="`carbon-${option.carbonFootprint.rating}`">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
                <span>{{ option.carbonFootprint.co2Kg }} kg CO₂</span>
              </div>
            </div>

            <div v-if="option.mode === 'TRANSIT' && option.details.transitInfo" class="transit-details">
              <div class="transit-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
                <span>{{ option.details.transfers }} transfer{{ option.details.transfers !== 1 ? 's' : '' }}</span>
              </div>
              <div class="transit-lines">
                <div v-for="(transit, tIndex) in option.details.transitInfo" :key="tIndex" class="transit-line">
                  <span class="line-badge">{{ transit.line }}</span>
                  <span class="line-info">{{ transit.vehicle }} • {{ transit.stops }} stops</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="fullRouteAnalysis" class="route-summary">
        <h4>Full Route Summary</h4>
        <div class="summary-grid">
          <div class="summary-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <div class="summary-info">
              <span class="summary-label">Total Time</span>
              <span class="summary-value">{{ fullRouteAnalysis.summary.totalDuration }}</span>
            </div>
          </div>

          <div class="summary-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <div class="summary-info">
              <span class="summary-label">Total Distance</span>
              <span class="summary-value">{{ fullRouteAnalysis.summary.totalDistance }}</span>
            </div>
          </div>

          <div class="summary-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <div class="summary-info">
              <span class="summary-label">Total Cost</span>
              <span class="summary-value">${{ fullRouteAnalysis.summary.totalCost }}</span>
            </div>
          </div>

          <div class="summary-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
            </svg>
            <div class="summary-info">
              <span class="summary-label">Carbon Footprint</span>
              <span class="summary-value">{{ fullRouteAnalysis.summary.totalCO2 }}</span>
            </div>
          </div>
        </div>

        <div class="modes-used">
          <span class="modes-label">Modes:</span>
          <div class="modes-badges">
            <span
              v-for="mode in fullRouteAnalysis.summary.modes"
              :key="mode"
              class="mode-badge"
              :style="{ backgroundColor: getModeColor(mode) }"
            >
              {{ getModeIcon(mode) }} {{ mode }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import {
  getTransportOptions,
  calculateMultiModalRoute,
  getModeIcon,
  getModeColor
} from '../services/transportService';

export default {
  props: {
    locations: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const selectedSegmentIndex = ref(0);
    const transportOptions = ref([]);
    const fullRouteAnalysis = ref(null);
    const isAnalyzing = ref(false);
    const hiddenModes = ref(new Set());

    const routeSegments = computed(() => {
      const segments = [];
      for (let i = 0; i < props.locations.length - 1; i++) {
        segments.push({
          from: props.locations[i],
          to: props.locations[i + 1],
          index: i
        });
      }
      return segments;
    });

    const availableModes = computed(() => {
      return [...new Set(transportOptions.value.map(opt => opt.mode))];
    });

    const visibleOptions = computed(() => {
      return transportOptions.value.filter(opt => !hiddenModes.value.has(opt.mode));
    });

    const loadTransportOptions = async () => {
      if (routeSegments.value.length === 0) return;

      const segment = routeSegments.value[selectedSegmentIndex.value];
      transportOptions.value = [];

      try {
        const options = await getTransportOptions(
          segment.from.position,
          segment.to.position
        );
        transportOptions.value = options;
      } catch (error) {
        console.error('Failed to load transport options:', error);
      }
    };

    const analyzeAllSegments = async () => {
      isAnalyzing.value = true;
      fullRouteAnalysis.value = null;

      try {
        const analysis = await calculateMultiModalRoute(props.locations);
        fullRouteAnalysis.value = analysis;
      } catch (error) {
        console.error('Failed to analyze route:', error);
      } finally {
        isAnalyzing.value = false;
      }
    };

    const toggleMode = (mode) => {
      if (hiddenModes.value.has(mode)) {
        hiddenModes.value.delete(mode);
      } else {
        hiddenModes.value.add(mode);
      }
      hiddenModes.value = new Set(hiddenModes.value);
    };

    return {
      selectedSegmentIndex,
      transportOptions,
      fullRouteAnalysis,
      isAnalyzing,
      hiddenModes,
      routeSegments,
      availableModes,
      visibleOptions,
      loadTransportOptions,
      analyzeAllSegments,
      toggleMode,
      getModeIcon,
      getModeColor
    };
  }
};
</script>

<style scoped lang="scss">
.transport-integration {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.transport-header {
  margin-bottom: 1.5rem;
}

.transport-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;

  svg {
    color: #0969da;
  }
}

.transport-subtitle {
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

.transport-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.route-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.selector-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.segment-select {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-sidebar-bg);
  color: var(--color-text);
  font-size: 0.95rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #0969da;
    box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
  }
}

.analyze-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #0969da 0%, #0550ae 100%);
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
    box-shadow: 0 4px 12px rgba(9, 105, 218, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.spinner {
  width: 18px;
  height: 18px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.options-container {
  margin-top: 1rem;
}

.options-header {
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

.filter-chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-sidebar-bg);
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: #ddf4ff;
    border-color: #0969da;
    color: #0969da;
  }

  &:hover {
    border-color: #0969da;
  }
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.transport-option {
  background: var(--color-sidebar-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 1rem;
  transition: all 0.2s;

  &.recommended {
    border-color: #2ea043;
    box-shadow: 0 0 0 1px #2ea043;
  }

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.option-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.mode-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.option-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mode-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  text-transform: capitalize;
}

.recommended-badge {
  padding: 0.25rem 0.5rem;
  background: #dafbe1;
  color: #116329;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.option-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.metric {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text);

  svg {
    color: var(--color-icon);
    flex-shrink: 0;
  }

  &.cost svg {
    color: #7d4e00;
  }

  &.carbon {
    &.carbon-excellent {
      color: #116329;
      svg { color: #116329; }
    }
    &.carbon-good {
      color: #4d7c0f;
      svg { color: #4d7c0f; }
    }
    &.carbon-moderate {
      color: #7d4e00;
      svg { color: #7d4e00; }
    }
    &.carbon-high {
      color: #d1242f;
      svg { color: #d1242f; }
    }
  }
}

.transit-details {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.transit-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;

  svg {
    flex-shrink: 0;
  }
}

.transit-lines {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.transit-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.line-badge {
  padding: 0.25rem 0.5rem;
  background: #0969da;
  color: white;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.75rem;
}

.line-info {
  color: var(--color-text-secondary);
}

.route-summary {
  background: var(--color-sidebar-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;

  h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: var(--color-text);
  }
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;

  svg {
    color: var(--color-icon);
    flex-shrink: 0;
  }
}

.summary-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.summary-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.summary-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.modes-used {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.modes-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.modes-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.mode-badge {
  padding: 0.25rem 0.75rem;
  color: white;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}
</style>
