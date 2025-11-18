import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
});

/**
 * Analyzes an image to extract travel-related locations
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<Array>} Array of extracted locations with details
 */
export async function analyzeImageForLocations(base64Image) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and extract any travel destinations, landmarks, restaurants, hotels, or points of interest visible or mentioned.

For each location found, provide:
1. Name of the location
2. Type (landmark, restaurant, hotel, beach, mountain, museum, etc.)
3. City (if identifiable)
4. Country (if identifiable)
5. A brief description
6. Confidence level (high, medium, low)

Return ONLY a valid JSON array with this structure:
[
  {
    "name": "Eiffel Tower",
    "type": "landmark",
    "city": "Paris",
    "country": "France",
    "description": "Iconic iron tower in Paris",
    "confidence": "high"
  }
]

If no travel locations are found, return an empty array: []`
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const content = response.choices[0].message.content.trim();

    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                     content.match(/```\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;

    const locations = JSON.parse(jsonString);
    return Array.isArray(locations) ? locations : [];

  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

/**
 * Geocodes a location name to lat/lng coordinates
 * @param {string} locationName - Name of the location to geocode
 * @returns {Promise<Object|null>} Object with lat, lng, formatted_address
 */
export async function geocodeLocation(locationName) {
  try {
    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode({ address: locationName }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve({
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
            formatted_address: results[0].formatted_address,
            place_id: results[0].place_id
          });
        } else {
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Processes multiple images and extracts unique locations
 * @param {Array<string>} base64Images - Array of base64 encoded images
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<Array>} Array of unique locations with coordinates
 */
export async function processMultipleImages(base64Images, progressCallback = null) {
  const allLocations = [];
  const seenNames = new Set();

  for (let i = 0; i < base64Images.length; i++) {
    if (progressCallback) {
      progressCallback({
        current: i + 1,
        total: base64Images.length,
        status: 'analyzing'
      });
    }

    try {
      const locations = await analyzeImageForLocations(base64Images[i]);

      // Filter out duplicates and low confidence results
      const validLocations = locations.filter(loc => {
        const key = `${loc.name}-${loc.city}`.toLowerCase();
        if (seenNames.has(key) || loc.confidence === 'low') {
          return false;
        }
        seenNames.add(key);
        return true;
      });

      allLocations.push(...validLocations);
    } catch (error) {
      console.error(`Error processing image ${i + 1}:`, error);
    }
  }

  if (progressCallback) {
    progressCallback({
      current: base64Images.length,
      total: base64Images.length,
      status: 'geocoding'
    });
  }

  // Geocode all locations
  const geocodedLocations = await Promise.all(
    allLocations.map(async (loc) => {
      const searchQuery = [loc.name, loc.city, loc.country]
        .filter(Boolean)
        .join(', ');

      const coords = await geocodeLocation(searchQuery);

      return {
        id: Date.now() + Math.random(),
        name: loc.name,
        type: loc.type,
        description: loc.description,
        position: coords ? { lat: coords.lat, lng: coords.lng } : null,
        address: coords?.formatted_address || searchQuery,
        metadata: {
          city: loc.city,
          country: loc.country,
          confidence: loc.confidence,
          source: 'ai-vision'
        },
        notes: loc.description || '',
        tags: [loc.type],
        createdAt: new Date().toISOString()
      };
    })
  );

  // Filter out locations that couldn't be geocoded
  return geocodedLocations.filter(loc => loc.position !== null);
}

/**
 * Converts a File object to base64 string
 * @param {File} file - Image file to convert
 * @returns {Promise<string>} Base64 encoded image with data URL prefix
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
