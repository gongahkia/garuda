<template>
  <div class="ai-visual-planner">
    <div class="planner-header">
      <h2 class="planner-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        AI Visual Trip Planner
      </h2>
      <p class="planner-subtitle">Upload travel photos to auto-generate your itinerary</p>
    </div>

    <div
      class="upload-zone"
      :class="{ 'drag-over': isDragging, 'has-images': images.length > 0 }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        @change="handleFileSelect"
        style="display: none"
      />

      <div v-if="images.length === 0" class="upload-prompt">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <p class="upload-text">
          <strong>Click to upload</strong> or drag and drop
        </p>
        <p class="upload-hint">PNG, JPG up to 10MB (up to 10 images)</p>
      </div>

      <div v-else class="image-grid">
        <div v-for="(img, index) in images" :key="index" class="image-preview">
          <img :src="img.preview" :alt="`Upload ${index + 1}`" />
          <button class="remove-btn" @click.stop="removeImage(index)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="add-more" @click.stop="triggerFileInput">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Add more</span>
        </div>
      </div>
    </div>

    <div v-if="images.length > 0" class="action-bar">
      <button class="analyze-btn" @click="analyzeImages" :disabled="isProcessing">
        <svg v-if="!isProcessing" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4"/>
          <path d="M12 8h.01"/>
        </svg>
        <div v-else class="spinner"></div>
        {{ isProcessing ? 'Analyzing...' : `Analyze ${images.length} image${images.length > 1 ? 's' : ''}` }}
      </button>
      <button class="clear-btn" @click="clearImages" :disabled="isProcessing">
        Clear all
      </button>
    </div>

    <div v-if="isProcessing" class="progress-bar">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <p class="progress-text">{{ progressText }}</p>
    </div>

    <div v-if="extractedLocations.length > 0" class="results-section">
      <div class="results-header">
        <h3>Found {{ extractedLocations.length }} location{{ extractedLocations.length > 1 ? 's' : '' }}</h3>
        <button class="add-all-btn" @click="addAllToItinerary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Add all to itinerary
        </button>
      </div>

      <div class="location-cards">
        <div v-for="location in extractedLocations" :key="location.id" class="location-card">
          <div class="card-content">
            <div class="location-icon">
              {{ getLocationEmoji(location.type) }}
            </div>
            <div class="location-info">
              <h4 class="location-title">{{ location.name }}</h4>
              <p class="location-address">{{ location.address }}</p>
              <p v-if="location.description" class="location-desc">{{ location.description }}</p>
              <div class="location-meta">
                <span class="location-type">{{ location.type }}</span>
                <span
                  class="confidence-badge"
                  :class="`confidence-${location.metadata.confidence}`"
                >
                  {{ location.metadata.confidence }} confidence
                </span>
              </div>
            </div>
            <button class="add-single-btn" @click="addSingleToItinerary(location)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {{ error }}
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { fileToBase64, processMultipleImages } from '../services/aiVisionService';

export default {
  emits: ['add-locations'],
  setup(props, { emit }) {
    const images = ref([]);
    const isDragging = ref(false);
    const isProcessing = ref(false);
    const extractedLocations = ref([]);
    const error = ref(null);
    const fileInput = ref(null);
    const progress = ref(0);
    const progressText = ref('');

    const MAX_IMAGES = 10;
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    const handleDragOver = (e) => {
      isDragging.value = true;
    };

    const handleDragLeave = (e) => {
      isDragging.value = false;
    };

    const handleDrop = async (e) => {
      isDragging.value = false;
      const files = Array.from(e.dataTransfer.files);
      await addImages(files);
    };

    const triggerFileInput = () => {
      fileInput.value?.click();
    };

    const handleFileSelect = async (e) => {
      const files = Array.from(e.target.files);
      await addImages(files);
    };

    const addImages = async (files) => {
      error.value = null;

      const imageFiles = files.filter(file => file.type.startsWith('image/'));

      if (images.value.length + imageFiles.length > MAX_IMAGES) {
        error.value = `Maximum ${MAX_IMAGES} images allowed`;
        return;
      }

      const validFiles = imageFiles.filter(file => {
        if (file.size > MAX_FILE_SIZE) {
          error.value = `${file.name} is too large (max 10MB)`;
          return false;
        }
        return true;
      });

      const newImages = await Promise.all(
        validFiles.map(async (file) => ({
          file,
          preview: await fileToBase64(file)
        }))
      );

      images.value = [...images.value, ...newImages];
    };

    const removeImage = (index) => {
      images.value = images.value.filter((_, i) => i !== index);
    };

    const clearImages = () => {
      images.value = [];
      extractedLocations.value = [];
      error.value = null;
      progress.value = 0;
    };

    const analyzeImages = async () => {
      if (images.value.length === 0) return;

      isProcessing.value = true;
      error.value = null;
      extractedLocations.value = [];
      progress.value = 0;

      try {
        const base64Images = images.value.map(img => img.preview);

        const locations = await processMultipleImages(base64Images, (progressData) => {
          const percentage = (progressData.current / progressData.total) * 100;
          progress.value = percentage;

          if (progressData.status === 'analyzing') {
            progressText.value = `Analyzing image ${progressData.current} of ${progressData.total}...`;
          } else if (progressData.status === 'geocoding') {
            progressText.value = 'Finding locations on map...';
          }
        });

        extractedLocations.value = locations;

        if (locations.length === 0) {
          error.value = 'No travel locations found in the images. Try uploading photos with landmarks or destinations.';
        }
      } catch (err) {
        error.value = err.message || 'Failed to analyze images. Please check your API key and try again.';
        console.error('Analysis error:', err);
      } finally {
        isProcessing.value = false;
        progress.value = 100;
      }
    };

    const addSingleToItinerary = (location) => {
      emit('add-locations', [location]);
    };

    const addAllToItinerary = () => {
      emit('add-locations', extractedLocations.value);
      extractedLocations.value = [];
      images.value = [];
    };

    const getLocationEmoji = (type) => {
      const emojiMap = {
        landmark: '🗼',
        restaurant: '🍽️',
        hotel: '🏨',
        beach: '🏖️',
        mountain: '⛰️',
        museum: '🏛️',
        park: '🌳',
        shopping: '🛍️',
        temple: '⛩️',
        church: '⛪',
        mosque: '🕌',
        castle: '🏰',
        default: '📍'
      };
      return emojiMap[type] || emojiMap.default;
    };

    return {
      images,
      isDragging,
      isProcessing,
      extractedLocations,
      error,
      fileInput,
      progress,
      progressText,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      triggerFileInput,
      handleFileSelect,
      removeImage,
      clearImages,
      analyzeImages,
      addSingleToItinerary,
      addAllToItinerary,
      getLocationEmoji
    };
  }
};
</script>

<style scoped lang="scss">
.ai-visual-planner {
  background: var(--color-bg);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.planner-header {
  margin-bottom: 1.5rem;
}

.planner-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;

  svg {
    color: #58a6ff;
  }
}

.planner-subtitle {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: 0.95rem;
}

.upload-zone {
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--color-sidebar-bg);
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: #58a6ff;
    background: #f0f6ff;
  }

  &.drag-over {
    border-color: #58a6ff;
    background: #e6f2ff;
    transform: scale(1.02);
  }

  &.has-images {
    padding: 1rem;
  }
}

.upload-prompt {
  svg {
    color: var(--color-icon);
    margin-bottom: 1rem;
  }
}

.upload-text {
  font-size: 1rem;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;

  strong {
    color: #58a6ff;
  }
}

.upload-hint {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  width: 100%;
}

.image-preview {
  position: relative;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  background: var(--color-border);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .remove-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 4px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;

    &:hover {
      background: rgba(255, 0, 0, 0.8);
    }
  }

  &:hover .remove-btn {
    opacity: 1;
  }
}

.add-more {
  aspect-ratio: 1;
  border: 2px dashed var(--color-border);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--color-icon);

  &:hover {
    border-color: #58a6ff;
    color: #58a6ff;
    background: #f0f6ff;
  }

  span {
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
}

.action-bar {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.analyze-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #58a6ff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #4a9aef;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.clear-btn {
  background: var(--color-sidebar-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #eaeef2;
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

.progress-bar {
  margin-top: 1rem;
}

.progress-track {
  height: 8px;
  background: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #58a6ff, #4a9aef);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-text {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin: 0.5rem 0 0 0;
}

.results-section {
  margin-top: 1.5rem;
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--color-text);
  }
}

.add-all-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #2ea043;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #2c974b;
  }
}

.location-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.location-card {
  background: var(--color-sidebar-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 1rem;
  transition: all 0.2s;

  &:hover {
    border-color: #58a6ff;
    box-shadow: 0 2px 8px rgba(88, 166, 255, 0.1);
  }
}

.card-content {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.location-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.location-info {
  flex: 1;
  min-width: 0;
}

.location-title {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
}

.location-address {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.location-desc {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: var(--color-text);
  line-height: 1.4;
}

.location-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.location-type {
  display: inline-block;
  background: #ddf4ff;
  color: #0969da;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.confidence-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;

  &.confidence-high {
    background: #dafbe1;
    color: #116329;
  }

  &.confidence-medium {
    background: #fff8c5;
    color: #7d4e00;
  }

  &.confidence-low {
    background: #ffebe9;
    color: #d1242f;
  }
}

.add-single-btn {
  flex-shrink: 0;
  background: var(--color-sidebar-bg);
  color: #2ea043;
  border: 1px solid #2ea043;
  border-radius: 6px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #dafbe1;
  }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #ffebe9;
  color: #d1242f;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
  border: 1px solid #f85149;
}
</style>
