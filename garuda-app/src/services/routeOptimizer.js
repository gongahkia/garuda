/**
 * Neural Route Optimizer Service
 * Uses constraint optimization and heuristics to find optimal route order
 */

/**
 * Calculates distance between two coordinates using Haversine formula
 * @param {Object} coord1 - {lat, lng}
 * @param {Object} coord2 - {lat, lng}
 * @returns {number} Distance in kilometers
 */
function calculateDistance(coord1, coord2) {
  const R = 6371; // Earth's radius in km
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

/**
 * Calculates total route distance
 * @param {Array} locations - Array of location objects with position
 * @returns {number} Total distance in km
 */
function calculateTotalDistance(locations) {
  let total = 0;
  for (let i = 0; i < locations.length - 1; i++) {
    total += calculateDistance(locations[i].position, locations[i + 1].position);
  }
  return total;
}

/**
 * Nearest neighbor heuristic for initial route
 * @param {Array} locations - Locations to order
 * @param {number} startIndex - Index of starting location
 * @returns {Array} Ordered locations
 */
function nearestNeighborRoute(locations, startIndex = 0) {
  if (locations.length <= 1) return locations;

  const visited = new Set();
  const route = [];
  let current = startIndex;

  visited.add(current);
  route.push(locations[current]);

  while (visited.size < locations.length) {
    let nearest = -1;
    let minDistance = Infinity;

    for (let i = 0; i < locations.length; i++) {
      if (!visited.has(i)) {
        const distance = calculateDistance(
          locations[current].position,
          locations[i].position
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearest = i;
        }
      }
    }

    if (nearest !== -1) {
      visited.add(nearest);
      route.push(locations[nearest]);
      current = nearest;
    }
  }

  return route;
}

/**
 * 2-opt optimization to improve route
 * @param {Array} route - Initial route
 * @param {number} maxIterations - Maximum optimization iterations
 * @returns {Array} Optimized route
 */
function twoOptOptimization(route, maxIterations = 100) {
  if (route.length <= 3) return route;

  let improved = true;
  let iterations = 0;
  let currentRoute = [...route];
  let bestDistance = calculateTotalDistance(currentRoute);

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 1; i < currentRoute.length - 2; i++) {
      for (let j = i + 1; j < currentRoute.length - 1; j++) {
        // Try reversing the segment between i and j
        const newRoute = [
          ...currentRoute.slice(0, i),
          ...currentRoute.slice(i, j + 1).reverse(),
          ...currentRoute.slice(j + 1)
        ];

        const newDistance = calculateTotalDistance(newRoute);

        if (newDistance < bestDistance) {
          currentRoute = newRoute;
          bestDistance = newDistance;
          improved = true;
        }
      }
    }
  }

  return currentRoute;
}

/**
 * Simulated annealing for global optimization
 * @param {Array} locations - Locations to optimize
 * @param {number} initialTemp - Starting temperature
 * @param {number} coolingRate - How fast to cool (0-1)
 * @returns {Array} Optimized route
 */
function simulatedAnnealing(locations, initialTemp = 1000, coolingRate = 0.995) {
  if (locations.length <= 2) return locations;

  let currentRoute = [...locations];
  let bestRoute = [...currentRoute];
  let currentDistance = calculateTotalDistance(currentRoute);
  let bestDistance = currentDistance;
  let temperature = initialTemp;

  while (temperature > 1) {
    // Generate neighbor by swapping two random locations
    const newRoute = [...currentRoute];
    const i = Math.floor(Math.random() * newRoute.length);
    const j = Math.floor(Math.random() * newRoute.length);
    [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]];

    const newDistance = calculateTotalDistance(newRoute);
    const deltaDistance = newDistance - currentDistance;

    // Accept if better, or with probability if worse
    if (deltaDistance < 0 || Math.random() < Math.exp(-deltaDistance / temperature)) {
      currentRoute = newRoute;
      currentDistance = newDistance;

      if (currentDistance < bestDistance) {
        bestRoute = [...currentRoute];
        bestDistance = currentDistance;
      }
    }

    temperature *= coolingRate;
  }

  return bestRoute;
}

/**
 * Main optimization function
 * @param {Array} locations - Locations to optimize
 * @param {Object} options - Optimization options
 * @returns {Promise<Object>} Optimized result with route and stats
 */
export async function optimizeRoute(locations, options = {}) {
  const {
    algorithm = 'hybrid', // 'nearest', '2opt', 'annealing', 'hybrid'
    startLocation = null,
    constraints = {}
  } = options;

  if (!locations || locations.length <= 1) {
    return {
      optimizedLocations: locations,
      totalDistance: 0,
      improvement: 0,
      algorithm: 'none'
    };
  }

  const originalDistance = calculateTotalDistance(locations);
  let optimizedRoute = [];

  // Find start index if specified
  let startIndex = 0;
  if (startLocation) {
    startIndex = locations.findIndex(loc => loc.id === startLocation.id);
    if (startIndex === -1) startIndex = 0;
  }

  switch (algorithm) {
    case 'nearest':
      optimizedRoute = nearestNeighborRoute(locations, startIndex);
      break;

    case '2opt':
      const initialRoute = nearestNeighborRoute(locations, startIndex);
      optimizedRoute = twoOptOptimization(initialRoute, 200);
      break;

    case 'annealing':
      optimizedRoute = simulatedAnnealing(locations, 1000, 0.995);
      break;

    case 'hybrid':
    default:
      // Use nearest neighbor for initial solution
      const nnRoute = nearestNeighborRoute(locations, startIndex);
      // Improve with 2-opt
      const twoOptRoute = twoOptOptimization(nnRoute, 150);
      // Further improve with simulated annealing
      optimizedRoute = simulatedAnnealing(twoOptRoute, 500, 0.99);
      break;
  }

  const optimizedDistance = calculateTotalDistance(optimizedRoute);
  const improvement = ((originalDistance - optimizedDistance) / originalDistance) * 100;

  return {
    optimizedLocations: optimizedRoute,
    originalDistance: originalDistance.toFixed(2),
    totalDistance: optimizedDistance.toFixed(2),
    improvement: improvement.toFixed(1),
    algorithm,
    savings: {
      distance: (originalDistance - optimizedDistance).toFixed(2),
      percentage: improvement.toFixed(1)
    }
  };
}

/**
 * Get route directions from Google Maps
 * @param {Array} locations - Ordered locations
 * @returns {Promise<Object>} Directions with polyline and duration
 */
export async function getRouteDirections(locations) {
  if (locations.length < 2) return null;

  const directionsService = new google.maps.DirectionsService();

  const waypoints = locations.slice(1, -1).map(loc => ({
    location: new google.maps.LatLng(loc.position.lat, loc.position.lng),
    stopover: true
  }));

  return new Promise((resolve, reject) => {
    directionsService.route(
      {
        origin: new google.maps.LatLng(
          locations[0].position.lat,
          locations[0].position.lng
        ),
        destination: new google.maps.LatLng(
          locations[locations.length - 1].position.lat,
          locations[locations.length - 1].position.lng
        ),
        waypoints,
        optimizeWaypoints: false, // We already optimized
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === 'OK') {
          const route = result.routes[0];
          const totalDuration = route.legs.reduce(
            (sum, leg) => sum + leg.duration.value,
            0
          );

          resolve({
            directions: result,
            totalDuration: Math.round(totalDuration / 60), // minutes
            totalDistance: route.legs.reduce(
              (sum, leg) => sum + leg.distance.value,
              0
            ) / 1000, // km
            polyline: route.overview_polyline
          });
        } else {
          reject(new Error(`Directions request failed: ${status}`));
        }
      }
    );
  });
}

/**
 * Cluster nearby locations for better organization
 * @param {Array} locations - Locations to cluster
 * @param {number} maxDistance - Max distance for clustering (km)
 * @returns {Array} Array of clusters
 */
export function clusterNearbyLocations(locations, maxDistance = 2) {
  const clusters = [];
  const visited = new Set();

  locations.forEach((loc, index) => {
    if (visited.has(index)) return;

    const cluster = [loc];
    visited.add(index);

    locations.forEach((otherLoc, otherIndex) => {
      if (visited.has(otherIndex)) return;

      const distance = calculateDistance(loc.position, otherLoc.position);
      if (distance <= maxDistance) {
        cluster.push(otherLoc);
        visited.add(otherIndex);
      }
    });

    clusters.push({
      locations: cluster,
      center: calculateClusterCenter(cluster)
    });
  });

  return clusters;
}

function calculateClusterCenter(locations) {
  const avgLat = locations.reduce((sum, loc) => sum + loc.position.lat, 0) / locations.length;
  const avgLng = locations.reduce((sum, loc) => sum + loc.position.lng, 0) / locations.length;
  return { lat: avgLat, lng: avgLng };
}
