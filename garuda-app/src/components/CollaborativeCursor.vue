<template>
  <div class="cursors-container">
    <div
      v-for="cursor in cursors"
      :key="cursor.userId"
      class="remote-cursor"
      :style="{
        left: `${cursor.x}px`,
        top: `${cursor.y}px`,
        '--cursor-color': cursor.color
      }"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="cursor-icon"
      >
        <path
          d="M5.65376 12.3673L10.6718 17.3852L13.0648 19.7782C13.4884 20.2018 14.2283 19.9366 14.3108 19.3718L15.4311 11.8509L21.5537 8.92853C22.0698 8.66639 22.0698 7.9338 21.5537 7.67166L6.34341 0.292954C5.8626 0.0480763 5.31008 0.513487 5.44169 1.0419L8.31743 12.3673C8.40606 12.7253 8.74758 12.9783 9.12919 12.9783H12.5432C13.0912 12.9783 13.4543 13.5616 13.1929 14.0542L11.6564 16.9515C11.2615 17.699 10.1359 17.5183 9.98796 16.6885L9.12919 12.3673H5.65376Z"
          :fill="cursor.color"
          stroke="white"
          stroke-width="1"
        />
      </svg>

      <div class="cursor-label" :style="{ backgroundColor: cursor.color }">
        <span class="cursor-avatar">{{ cursor.initials }}</span>
        <span class="cursor-name">{{ cursor.name }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { initializePresenceChannel, generateUserColor, getUserInitials } from '../services/supabaseClient';

export default {
  props: {
    tripId: {
      type: String,
      required: true
    },
    currentUser: {
      type: Object,
      required: true,
      validator: (user) => user.id && user.name
    }
  },
  setup(props) {
    const cursors = ref([]);
    let channel = null;
    let mouseMoveThrottle = null;

    const userColor = generateUserColor();
    const userInitials = getUserInitials(props.currentUser.name);

    const updateCursorPosition = (e) => {
      if (!channel) return;

      // Throttle cursor updates to 60fps
      if (mouseMoveThrottle) return;

      mouseMoveThrottle = setTimeout(() => {
        mouseMoveThrottle = null;
      }, 16); // ~60fps

      const x = e.clientX;
      const y = e.clientY;

      // Broadcast cursor position to other users
      channel.track({
        x,
        y,
        color: userColor,
        name: props.currentUser.name,
        initials: userInitials,
        userId: props.currentUser.id,
        timestamp: Date.now()
      });
    };

    const setupPresence = async () => {
      channel = initializePresenceChannel(props.tripId, {
        id: props.currentUser.id,
        name: props.currentUser.name,
        color: userColor,
        initials: userInitials
      });

      // Listen for presence changes
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const remoteCursors = [];

          Object.keys(state).forEach((userId) => {
            if (userId !== props.currentUser.id) {
              const presences = state[userId];
              if (presences.length > 0) {
                const latest = presences[0];
                remoteCursors.push({
                  userId,
                  x: latest.x || 0,
                  y: latest.y || 0,
                  color: latest.color,
                  name: latest.name,
                  initials: latest.initials
                });
              }
            }
          });

          cursors.value = remoteCursors;
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('User joined:', key, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('User left:', key, leftPresences);
          cursors.value = cursors.value.filter(c => c.userId !== key);
        });

      // Subscribe to the channel
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Connected to presence channel');
        }
      });

      // Track mouse movements
      window.addEventListener('mousemove', updateCursorPosition);
    };

    const cleanup = async () => {
      window.removeEventListener('mousemove', updateCursorPosition);

      if (channel) {
        await channel.untrack();
        await channel.unsubscribe();
      }

      if (mouseMoveThrottle) {
        clearTimeout(mouseMoveThrottle);
      }
    };

    onMounted(() => {
      setupPresence();
    });

    onUnmounted(() => {
      cleanup();
    });

    return {
      cursors
    };
  }
};
</script>

<style scoped lang="scss">
.cursors-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
}

.remote-cursor {
  position: absolute;
  pointer-events: none;
  transition: left 0.05s linear, top 0.05s linear;
  z-index: 9999;
  will-change: left, top;
}

.cursor-icon {
  display: block;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.cursor-label {
  position: absolute;
  top: 20px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  pointer-events: none;
}

.cursor-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  font-size: 0.65rem;
  font-weight: 600;
}

.cursor-name {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
