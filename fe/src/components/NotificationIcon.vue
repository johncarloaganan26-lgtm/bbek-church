<template>
  <div class="notification-icon-container">
    <!-- Notification Bell Icon with Badge -->
    <v-menu
      v-model="showNotificationPanel"
      :close-on-content-click="false"
      location="bottom"
      transition="slide-y-transition"
      max-width="400"
      min-width="350"
      offset="8"
      content-class="notification-panel"
    >
      <template v-slot:activator="{ props }">
        <v-badge
          :content="unreadCount"
          :value="unreadCount"
          color="red"
          bordered
          overlap
          offset-x="10"
          offset-y="10"
          class="notification-badge"
        >
          <v-btn
            icon
            class="notification-btn"
            v-bind="props"
            title="Notifications"
            aria-label="View notifications"
          >
            <v-icon size="24">mdi-bell</v-icon>
          </v-btn>
        </v-badge>
      </template>

      <!-- Notification Panel (Dropdown) -->
      <v-card class="notification-card">
        <!-- Panel Header -->
        <v-card-title class="notification-header">
          <span class="text-h6 font-weight-bold">Notifications</span>
          <v-spacer></v-spacer>
          <div class="header-actions">
            <v-btn
              icon
              small
              @click="fetchNotifications"
              title="Refresh notifications"
              :loading="loading"
              class="header-btn"
            >
              <v-icon size="18">mdi-refresh</v-icon>
            </v-btn>
            <v-btn
              icon
              small
              @click="markAllAsRead"
              title="Mark all as read"
              :disabled="unreadCount === 0"
              class="header-btn"
            >
              <v-icon size="18">mdi-email-mark-as-unread</v-icon>
            </v-btn>
          </div>
        </v-card-title>

        <!-- Notification Categories Tabs -->
        <v-tabs 
          v-model="activeTab"
          class="notification-tabs"
          background-color="grey-lighten-4"
          slider-color="primary"
          density="compact"
        >
          <v-tab value="all" class="text-capitalize">
            All ({{ allNotifications.length }})
          </v-tab>
          <v-tab value="messages" class="text-capitalize">
            Messages ({{ messageNotifications.length }})
          </v-tab>
          <v-tab value="prayers" class="text-capitalize">
            Prayers ({{ prayerNotifications.length }})
          </v-tab>
          <v-tab value="schedules" class="text-capitalize">
            Schedules ({{ scheduleNotifications.length }})
          </v-tab>
          <v-tab value="services" class="text-capitalize">
            Services ({{ serviceNotifications.length }})
          </v-tab>
        </v-tabs>

        <!-- Show Read Notifications Toggle -->
        <div class="d-flex align-center justify-space-between px-4 py-2">
          <v-switch
            v-model="showReadNotifications"
            label="Show read notifications"
            density="compact"
            hide-details
            class="notification-toggle"
          ></v-switch>
        </div>

        <!-- Notification List -->
        <v-card-text class="notification-list pa-0">
          <v-window v-model="activeTab">
            <!-- All Notifications -->
            <v-window-item value="all">
              <notification-list
                :notifications="allNotifications"
                @mark-as-read="handleMarkAsRead"
                @dismiss="handleDismiss"
                @notification-click="handleNotificationClick"
              />
            </v-window-item>

            <!-- Messages -->
            <v-window-item value="messages">
              <notification-list
                :notifications="messageNotifications"
                @mark-as-read="handleMarkAsRead"
                @dismiss="handleDismiss"
                @notification-click="handleNotificationClick"
              />
            </v-window-item>

            <!-- Prayers -->
            <v-window-item value="prayers">
              <notification-list
                :notifications="prayerNotifications"
                @mark-as-read="handleMarkAsRead"
                @dismiss="handleDismiss"
                @notification-click="handleNotificationClick"
              />
            </v-window-item>

            <!-- Schedules -->
            <v-window-item value="schedules">
              <notification-list
                :notifications="scheduleNotifications"
                @mark-as-read="handleMarkAsRead"
                @dismiss="handleDismiss"
                @notification-click="handleNotificationClick"
              />
            </v-window-item>

            <!-- Services -->
            <v-window-item value="services">
              <notification-list
                :notifications="serviceNotifications"
                @mark-as-read="handleMarkAsRead"
                @dismiss="handleDismiss"
                @notification-click="handleNotificationClick"
              />
            </v-window-item>
          </v-window>
        </v-card-text>

        <!-- Loading State -->
        <v-overlay 
          :model-value="loading"
          class="align-center justify-center"
          contained
          persistent
        >
          <v-progress-circular 
            indeterminate 
            size="48" 
            color="primary"
          ></v-progress-circular>
        </v-overlay>

        <!-- Empty State -->
        <div v-if="!loading && filteredNotifications.length === 0" class="empty-state pa-4 text-center">
          <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-bell-off</v-icon>
          <h3 class="text-h6 font-weight-medium text-grey">No notifications</h3>
          <p class="text-body-2 text-grey">You're all caught up! Check back later.</p>
        </div>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from '@/api/axios';

// Notification List Component (will be created next)
import NotificationList from './NotificationList.vue';

export default {
  name: 'NotificationIcon',
  components: {
    NotificationList
  },
  setup() {
    const router = useRouter();
    const showNotificationPanel = ref(false);
    const activeTab = ref('all');
    const loading = ref(false);
    const notifications = ref([]);
    const lastFetchTime = ref(null);
    const readNotificationIds = ref(new Set());
    const dismissedNotificationIds = ref(new Set());
    const showReadNotifications = ref(false);

    // Load read notification IDs from localStorage
    const loadReadNotifications = () => {
      try {
        const stored = localStorage.getItem('readNotifications');
        if (stored) {
          const ids = JSON.parse(stored);
          readNotificationIds.value = new Set(ids);
        }
      } catch (error) {
        console.error('Error loading read notifications from localStorage:', error);
        readNotificationIds.value = new Set();
      }
    };

    // Save read notification IDs to localStorage
    const saveReadNotifications = () => {
      try {
        const ids = Array.from(readNotificationIds.value);
        localStorage.setItem('readNotifications', JSON.stringify(ids));
      } catch (error) {
        console.error('Error saving read notifications to localStorage:', error);
      }
    };

    // Load dismissed notification IDs from localStorage
    const loadDismissedNotifications = () => {
      try {
        const stored = localStorage.getItem('dismissedNotifications');
        if (stored) {
          const ids = JSON.parse(stored);
          dismissedNotificationIds.value = new Set(ids);
        }
      } catch (error) {
        console.error('Error loading dismissed notifications from localStorage:', error);
        dismissedNotificationIds.value = new Set();
      }
    };

    // Save dismissed notification IDs to localStorage
    const saveDismissedNotifications = () => {
      try {
        const ids = Array.from(dismissedNotificationIds.value);
        localStorage.setItem('dismissedNotifications', JSON.stringify(ids));
      } catch (error) {
        console.error('Error saving dismissed notifications to localStorage:', error);
      }
    };

    // Computed properties for filtering notifications
    const allNotifications = computed(() => {
      let filtered = notifications.value.filter(n => !dismissedNotificationIds.value.has(n.id));
      if (!showReadNotifications.value) {
        filtered = filtered.filter(n => !readNotificationIds.value.has(n.id));
      }
      return filtered;
    });

    const messageNotifications = computed(() => {
      let filtered = notifications.value.filter(n =>
        n.category === 'message' &&
        !dismissedNotificationIds.value.has(n.id)
      );
      if (!showReadNotifications.value) {
        filtered = filtered.filter(n => !readNotificationIds.value.has(n.id));
      }
      return filtered;
    });

    const prayerNotifications = computed(() => {
      let filtered = notifications.value.filter(n =>
        n.category === 'prayer_request' &&
        !dismissedNotificationIds.value.has(n.id)
      );
      if (!showReadNotifications.value) {
        filtered = filtered.filter(n => !readNotificationIds.value.has(n.id));
      }
      return filtered;
    });

    const scheduleNotifications = computed(() => {
      let filtered = notifications.value.filter(n =>
        n.category === 'schedule_change' &&
        !dismissedNotificationIds.value.has(n.id)
      );
      if (!showReadNotifications.value) {
        filtered = filtered.filter(n => !readNotificationIds.value.has(n.id));
      }
      return filtered;
    });

    const serviceNotifications = computed(() => {
      let filtered = notifications.value.filter(n =>
        n.category === 'service' &&
        !dismissedNotificationIds.value.has(n.id)
      );
      if (!showReadNotifications.value) {
        filtered = filtered.filter(n => !readNotificationIds.value.has(n.id));
      }
      return filtered;
    });

    const filteredNotifications = computed(() => {
      switch (activeTab.value) {
        case 'messages': return messageNotifications.value;
        case 'prayers': return prayerNotifications.value;
        case 'schedules': return scheduleNotifications.value;
        case 'services': return serviceNotifications.value;
        default: return allNotifications.value;
      }
    });

    const unreadCount = computed(() => {
      return notifications.value.filter(n =>
        !readNotificationIds.value.has(n.id) &&
        !dismissedNotificationIds.value.has(n.id)
      ).length;
    });

    // Fetch notifications from backend
    const fetchNotifications = async () => {
      try {
        loading.value = true;
        const response = await axios.get('/notifications/unified', {
          params: {
            lastFetch: lastFetchTime.value
          }
        });

        if (response.data.success) {
          // Merge new notifications with existing ones
          const existingIds = new Set(notifications.value.map(n => n.id));
          const newNotifications = response.data.data.filter(n => !existingIds.has(n.id));

          notifications.value = [...newNotifications, ...notifications.value];
          lastFetchTime.value = new Date().toISOString();
        }
      } catch (error) {
        // Handle 401 Unauthorized gracefully (user not logged in)
        if (error.response?.status === 401) {
          // User is not authenticated, clear notifications and don't show error
          notifications.value = [];
          return;
        }
        console.error('Error fetching notifications:', error);
      } finally {
        loading.value = false;
      }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
      try {
        await axios.put(`/notifications/mark-as-read/${notificationId}`, {
          sourceType: 'form'
        });

        // Add to read notifications set and save to localStorage
        readNotificationIds.value.add(notificationId);
        saveReadNotifications();
      } catch (error) {
        // Handle 401 Unauthorized gracefully
        if (error.response?.status === 401) {
          return;
        }
        console.error('Error marking notification as read:', error);
      }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
      try {
        await axios.put('/notifications/mark-all-as-read');

        // Add all current notification IDs to read set
        notifications.value.forEach(n => {
          readNotificationIds.value.add(n.id);
        });
        saveReadNotifications();
      } catch (error) {
        // Handle 401 Unauthorized gracefully
        if (error.response?.status === 401) {
          return;
        }
        console.error('Error marking all notifications as read:', error);
      }
    };

    // Dismiss (permanently remove) a notification
    const dismissNotification = (notificationId) => {
      dismissedNotificationIds.value.add(notificationId);
      saveDismissedNotifications();
    };

    // Toggle show/hide read notifications
    const toggleShowReadNotifications = () => {
      showReadNotifications.value = !showReadNotifications.value;
    };

    // Handle notification click
    const handleNotificationClick = (notification) => {
      // Mark as read when clicked
      if (!notification.read) {
        markAsRead(notification.id);
      }

      // Handle navigation based on notification type
      switch (notification.category) {
        case 'message':
        case 'prayer_request':
        case 'schedule_change':
          router.push('/admin/messages');
          break;
        case 'service':
          // Navigate to water baptism admin (most common service)
          // TODO: Add service_type to notification data for better routing
          router.push('/admin/water-baptism');
          break;
      }

      // Close the notification panel
      showNotificationPanel.value = false;
    };

    // Handle dismiss notification
    const handleDismiss = (notificationId) => {
      dismissedNotificationIds.value.add(notificationId);
      saveDismissedNotifications();
    };

    // Toggle notification panel
    const toggleNotificationPanel = () => {
      showNotificationPanel.value = !showNotificationPanel.value;
      
      // Refresh notifications when opening
      if (showNotificationPanel.value) {
        fetchNotifications();
      }
    };

    // Auto-refresh notifications every 30 seconds
    const setupAutoRefresh = () => {
      const refreshInterval = setInterval(() => {
        if (!showNotificationPanel.value) {
          fetchNotifications();
        }
      }, 30000); // 30 seconds

      // Clean up on component unmount
      onUnmounted(() => {
        clearInterval(refreshInterval);
      });
    };

    // Initialize
    onMounted(() => {
      loadReadNotifications(); // Load read notifications from localStorage
      loadDismissedNotifications(); // Load dismissed notifications from localStorage
      fetchNotifications();
      setupAutoRefresh();
    });

    return {
      showNotificationPanel,
      activeTab,
      loading,
      notifications,
      allNotifications,
      messageNotifications,
      prayerNotifications,
      scheduleNotifications,
      serviceNotifications,
      filteredNotifications,
      unreadCount,
      showReadNotifications,
      toggleNotificationPanel,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      dismissNotification,
      toggleShowReadNotifications,
      handleMarkAsRead: markAsRead,
      handleDismiss,
      handleNotificationClick,
    };
  }
};
</script>

<style scoped>
.notification-icon-container {
  position: relative;
  display: inline-block;
}

.notification-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.notification-btn:hover {
  background: #f5f5f5;
  transform: translateY(-1px);
}

.notification-badge :deep(.v-badge__badge) {
  font-size: 12px;
  font-weight: bold;
  min-width: 20px;
  height: 20px;
  padding: 2px;
}

.notification-panel {
  max-height: 600px;
  overflow-y: auto;
  z-index: 2000;
}

.notification-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.notification-header {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;
  padding: 12px 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.header-btn {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.notification-tabs :deep(.v-tab) {
  min-width: auto;
  padding: 0 12px;
  font-size: 12px;
  text-transform: capitalize;
}

.notification-list {
  max-height: 500px;
  overflow-y: auto;
}

.empty-state {
  padding: 48px 24px;
  text-align: center;
  color: #666;
}

.notification-toggle {
  font-size: 14px;
}

@media (max-width: 600px) {
  .notification-panel {
    max-width: 100vw !important;
    left: 0 !important;
    right: 0 !important;
    margin: 0 !important;
  }

  .notification-card {
    border-radius: 0;
    width: 100vw;
  }
}
</style>