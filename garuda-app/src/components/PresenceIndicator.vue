<template>
  <div class="presence-indicator">
    <div class="presence-header">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <span class="presence-title">
        Online ({{ onlineUsers.length }})
      </span>
    </div>

    <div v-if="onlineUsers.length > 0" class="presence-list">
      <div
        v-for="user in onlineUsers"
        :key="user.userId"
        class="presence-user"
      >
        <div
          class="user-avatar"
          :style="{ backgroundColor: user.color }"
        >
          {{ user.initials }}
        </div>
        <div class="user-info">
          <span class="user-name">{{ user.name }}</span>
          <span v-if="user.userId === currentUser.id" class="you-badge">(You)</span>
        </div>
        <div class="online-dot" :style="{ backgroundColor: user.color }"></div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>No other users online</p>
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
      required: true
    }
  },
  setup(props) {
    const onlineUsers = ref([]);
    let channel = null;

    const userColor = generateUserColor();
    const userInitials = getUserInitials(props.currentUser.name);

    const setupPresence = async () => {
      channel = initializePresenceChannel(props.tripId, {
        id: props.currentUser.id,
        name: props.currentUser.name,
        color: userColor,
        initials: userInitials
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const users = [];

          Object.keys(state).forEach((userId) => {
            const presences = state[userId];
            if (presences.length > 0) {
              const user = presences[0];
              users.push({
                userId,
                name: user.name || 'Anonymous',
                color: user.color,
                initials: user.initials
              });
            }
          });

          onlineUsers.value = users;
        })
        .on('presence', { event: 'join' }, () => {
          // Handled by sync event
        })
        .on('presence', { event: 'leave' }, () => {
          // Handled by sync event
        });

      await channel.subscribe();

      // Track presence
      await channel.track({
        name: props.currentUser.name,
        color: userColor,
        initials: userInitials,
        userId: props.currentUser.id,
        online_at: new Date().toISOString()
      });
    };

    const cleanup = async () => {
      if (channel) {
        await channel.untrack();
        await channel.unsubscribe();
      }
    };

    onMounted(() => {
      setupPresence();
    });

    onUnmounted(() => {
      cleanup();
    });

    return {
      onlineUsers,
      currentUser: props.currentUser
    };
  }
};
</script>

<style scoped lang="scss">
.presence-indicator {
  background: var(--color-sidebar-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.presence-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: var(--color-text-secondary);

  svg {
    flex-shrink: 0;
  }
}

.presence-title {
  font-size: 0.875rem;
  font-weight: 600;
}

.presence-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.presence-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.you-badge {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-weight: 400;
}

.online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.empty-state {
  text-align: center;
  padding: 1rem 0;

  p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }
}
</style>
