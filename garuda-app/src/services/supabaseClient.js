import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

/**
 * Initialize a presence channel for collaborative features
 * @param {string} tripId - Unique identifier for the trip/session
 * @param {Object} userInfo - User information (id, name, avatar, color)
 * @returns {Object} Channel instance
 */
export function initializePresenceChannel(tripId, userInfo) {
  const channel = supabase.channel(`trip:${tripId}`, {
    config: {
      presence: {
        key: userInfo.id
      }
    }
  });

  return channel;
}

/**
 * Generates a random user color for cursor/avatar
 * @returns {string} Hex color code
 */
export function generateUserColor() {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
    '#F8B195', // Peach
    '#95E1D3'  // Aqua
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Gets user initials from name for avatar
 * @param {string} name - User's full name
 * @returns {string} Initials (max 2 characters)
 */
export function getUserInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
