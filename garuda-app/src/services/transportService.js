/**
 * Multi-Modal Transport Integration Service
 * Compares different transport modes between locations
 */

/**
 * Transport modes supported
 */
export const TRANSPORT_MODES = {
  DRIVING: 'DRIVING',
  WALKING: 'WALKING',
  BICYCLING: 'BICYCLING',
  TRANSIT: 'TRANSIT'
};

/**
 * Get transport options between two locations
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @param {Array} modes - Array of transport modes to check
 * @returns {Promise<Array>} Array of transport options with details
 */
export async function getTransportOptions(origin, destination, modes = Object.values(TRANSPORT_MODES)) {
  const directionsService = new google.maps.DirectionsService();
  const options = [];

  for (const mode of modes) {
    try {
      const result = await getDirectionsForMode(
        directionsService,
        origin,
        destination,
        mode
      );

      if (result) {
        options.push(result);
      }
    } catch (error) {
      console.warn(`Failed to get directions for ${mode}:`, error);
    }
  }

  return options.sort((a, b) => a.duration - b.duration);
}

/**
 * Get directions for a specific transport mode
 */
function getDirectionsForMode(service, origin, destination, mode) {
  return new Promise((resolve, reject) => {
    service.route(
      {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: google.maps.TravelMode[mode]
      },
      (result, status) => {
        if (status === 'OK' && result.routes.length > 0) {
          const route = result.routes[0];
          const leg = route.legs[0];

          resolve({
            mode,
            duration: leg.duration.value, // seconds
            durationText: leg.duration.text,
            distance: leg.distance.value, // meters
            distanceText: leg.distance.text,
            steps: leg.steps.length,
            polyline: route.overview_polyline,
            cost: estimateCost(mode, leg.distance.value),
            carbonFootprint: calculateCarbonFootprint(mode, leg.distance.value),
            details: extractModeDetails(mode, leg)
          });
        } else {
          resolve(null);
        }
      }
    );
  });
}

/**
 * Estimate cost for a transport mode
 * @param {string} mode - Transport mode
 * @param {number} distanceMeters - Distance in meters
 * @returns {Object} Cost estimate
 */
function estimateCost(mode, distanceMeters) {
  const distanceKm = distanceMeters / 1000;

  const rates = {
    DRIVING: { perKm: 0.5, base: 0, currency: 'USD' }, // Fuel cost approximation
    WALKING: { perKm: 0, base: 0, currency: 'USD' },
    BICYCLING: { perKm: 0, base: 0, currency: 'USD' },
    TRANSIT: { perKm: 0.15, base: 2.5, currency: 'USD' } // Public transport estimate
  };

  const rate = rates[mode] || rates.DRIVING;
  const total = rate.base + (distanceKm * rate.perKm);

  return {
    amount: total.toFixed(2),
    currency: rate.currency,
    breakdown: {
      base: rate.base.toFixed(2),
      distance: (distanceKm * rate.perKm).toFixed(2)
    }
  };
}

/**
 * Calculate carbon footprint for transport mode
 * @param {string} mode - Transport mode
 * @param {number} distanceMeters - Distance in meters
 * @returns {Object} Carbon footprint data
 */
function calculateCarbonFootprint(mode, distanceMeters) {
  const distanceKm = distanceMeters / 1000;

  // CO2 emissions in kg per km
  const emissions = {
    DRIVING: 0.192, // Average car
    WALKING: 0,
    BICYCLING: 0,
    TRANSIT: 0.089 // Average public transport
  };

  const emissionRate = emissions[mode] || 0;
  const totalCO2 = distanceKm * emissionRate;

  return {
    co2Kg: totalCO2.toFixed(3),
    rating: getCarbonRating(totalCO2),
    equivalentTrees: (totalCO2 / 21.77).toFixed(2) // Trees needed to offset per year
  };
}

/**
 * Get carbon rating based on CO2 amount
 */
function getCarbonRating(co2Kg) {
  if (co2Kg === 0) return 'excellent';
  if (co2Kg < 1) return 'good';
  if (co2Kg < 3) return 'moderate';
  return 'high';
}

/**
 * Extract mode-specific details from directions
 */
function extractModeDetails(mode, leg) {
  const details = {
    startAddress: leg.start_address,
    endAddress: leg.end_address
  };

  if (mode === 'TRANSIT' && leg.steps) {
    const transitSteps = leg.steps.filter(step => step.transit);
    details.transitInfo = transitSteps.map(step => ({
      line: step.transit.line.short_name || step.transit.line.name,
      vehicle: step.transit.line.vehicle.type,
      departure: step.transit.departure_time?.text,
      arrival: step.transit.arrival_time?.text,
      stops: step.transit.num_stops,
      headsign: step.transit.headsign
    }));
    details.transfers = transitSteps.length - 1;
  }

  return details;
}

/**
 * Compare all transport options and rank them
 * @param {Array} options - Transport options to compare
 * @param {Object} preferences - User preferences for ranking
 * @returns {Array} Ranked transport options
 */
export function rankTransportOptions(options, preferences = {}) {
  const {
    prioritizeTime = 1,
    prioritizeCost = 1,
    prioritizeCarbon = 1
  } = preferences;

  // Normalize scores (0-1 scale)
  const maxDuration = Math.max(...options.map(o => o.duration));
  const maxCost = Math.max(...options.map(o => parseFloat(o.cost.amount)));
  const maxCarbon = Math.max(...options.map(o => parseFloat(o.carbonFootprint.co2Kg)));

  return options.map(option => {
    const durationScore = 1 - (option.duration / maxDuration);
    const costScore = maxCost > 0 ? 1 - (parseFloat(option.cost.amount) / maxCost) : 1;
    const carbonScore = maxCarbon > 0 ? 1 - (parseFloat(option.carbonFootprint.co2Kg) / maxCarbon) : 1;

    const totalScore =
      (durationScore * prioritizeTime) +
      (costScore * prioritizeCost) +
      (carbonScore * prioritizeCarbon);

    return {
      ...option,
      scores: {
        duration: durationScore,
        cost: costScore,
        carbon: carbonScore,
        total: totalScore
      }
    };
  }).sort((a, b) => b.scores.total - a.scores.total);
}

/**
 * Get recommended transport mode based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Recommended mode
 */
export function getRecommendedMode(distanceKm) {
  if (distanceKm < 1) return TRANSPORT_MODES.WALKING;
  if (distanceKm < 5) return TRANSPORT_MODES.BICYCLING;
  if (distanceKm < 20) return TRANSPORT_MODES.TRANSIT;
  return TRANSPORT_MODES.DRIVING;
}

/**
 * Format duration in human-readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Get icon/emoji for transport mode
 * @param {string} mode - Transport mode
 * @returns {string} Emoji representation
 */
export function getModeIcon(mode) {
  const icons = {
    DRIVING: '🚗',
    WALKING: '🚶',
    BICYCLING: '🚴',
    TRANSIT: '🚇'
  };
  return icons[mode] || '🚗';
}

/**
 * Get color for transport mode
 * @param {string} mode - Transport mode
 * @returns {string} Color hex code
 */
export function getModeColor(mode) {
  const colors = {
    DRIVING: '#4285F4',
    WALKING: '#34A853',
    BICYCLING: '#FBBC04',
    TRANSIT: '#EA4335'
  };
  return colors[mode] || '#4285F4';
}

/**
 * Calculate multi-leg journey combining different modes
 * @param {Array} locations - Array of locations
 * @returns {Promise<Object>} Multi-modal route plan
 */
export async function calculateMultiModalRoute(locations) {
  if (locations.length < 2) return null;

  const segments = [];

  for (let i = 0; i < locations.length - 1; i++) {
    const origin = locations[i].position;
    const destination = locations[i + 1].position;

    const options = await getTransportOptions(origin, destination);

    if (options.length > 0) {
      // Pick the best option (fastest by default)
      const bestOption = options[0];
      segments.push({
        from: locations[i],
        to: locations[i + 1],
        transport: bestOption,
        segmentIndex: i
      });
    }
  }

  const totalDuration = segments.reduce((sum, seg) => sum + seg.transport.duration, 0);
  const totalDistance = segments.reduce((sum, seg) => sum + seg.transport.distance, 0);
  const totalCost = segments.reduce((sum, seg) => sum + parseFloat(seg.transport.cost.amount), 0);
  const totalCO2 = segments.reduce((sum, seg) => sum + parseFloat(seg.transport.carbonFootprint.co2Kg), 0);

  return {
    segments,
    summary: {
      totalDuration: formatDuration(totalDuration),
      totalDistance: (totalDistance / 1000).toFixed(1) + ' km',
      totalCost: totalCost.toFixed(2),
      totalCO2: totalCO2.toFixed(2) + ' kg',
      modes: [...new Set(segments.map(s => s.transport.mode))]
    }
  };
}
