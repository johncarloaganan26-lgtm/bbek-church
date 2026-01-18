<template>
  <div class="notification-list-container">
    <!-- Dismiss Confirmation Dialog -->
    <v-dialog v-model="showDismissDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Confirm Dismiss</v-card-title>
        <v-card-text>
          Are you sure you want to dismiss this notification? It will be hidden from your notifications list.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDismissDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="text" @click="confirmDismiss">Dismiss</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state pa-4 text-center">
      <v-progress-circular 
        indeterminate 
        size="32" 
        color="primary"
        class="mb-4"
      ></v-progress-circular>
      <p class="text-body-2 text-grey">Loading notifications...</p>
    </div>

    <!-- Notification Items -->
    <template v-else>
      <div v-for="notification in notifications" :key="notification.id" class="notification-item">
        <!-- Notification Header -->
        <div class="notification-header">
          <div class="notification-meta">
            <!-- Category Icon -->
            <v-icon 
              :size="18"
              :color="getCategoryColor(notification.category)"
              class="category-icon mr-2"
            >
              {{ getCategoryIcon(notification.category) }}
            </v-icon>
            
            <!-- Category Label -->
            <span class="category-label text-caption font-weight-medium">
              {{ getCategoryLabel(notification.category) }}
            </span>
            
            <!-- Timestamp -->
            <span class="timestamp text-caption text-grey ml-2">
              {{ formatDate(notification.date_created) }}
            </span>
          </div>
          
          <!-- Action Buttons -->
          <div class="action-buttons">
            <v-btn
              v-if="!notification.read"
              icon
              x-small
              @click.stop="markAsRead(notification.id)"
              title="Mark as read"
              class="mark-read-btn"
            >
              <v-icon size="16">mdi-email-mark-as-unread</v-icon>
            </v-btn>
            <v-btn
              icon
              x-small
              @click.stop="openDismissDialog(notification.id)"
              title="Dismiss notification"
              class="dismiss-btn"
            >
              <v-icon size="16">mdi-close</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- Notification Content -->
        <div 
          class="notification-content"
          :class="{ 'unread': !notification.read }"
          @click="handleNotificationClick(notification)"
        >
          <h4 class="notification-title text-subtitle-2 font-weight-medium mb-1">
            {{ notification.title }}
          </h4>
          <p class="notification-message text-body-2 text-grey-darken-1 mb-2">
            {{ notification.message }}
          </p>
          
          <!-- Additional Details -->
          <div v-if="notification.details" class="notification-details text-caption text-grey">
            {{ notification.details }}
          </div>
        </div>

        <!-- Notification Footer (for service notifications) -->
        <div v-if="notification.category === 'service'" class="notification-footer">
          <v-chip 
            small
            :color="getServiceStatusColor(notification.status)"
            class="status-chip"
          >
            {{ notification.status }}
          </v-chip>
          <span v-if="notification.serviceType" class="service-type text-caption ml-2">
            {{ notification.serviceType }}
          </span>
        </div>
      </div>
    </template>

    <!-- Empty State (handled by parent component) -->
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'NotificationList',
  props: {
    notifications: {
      type: Array,
      required: true,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['mark-as-read', 'notification-click', 'dismiss'],
  setup(props, { emit }) {
    // Reactive variables for dismiss confirmation
    const showDismissDialog = ref(false);
    const notificationToDismiss = ref(null);

    // Format date using native JavaScript with proper timezone handling
    const formatDate = (dateString) => {
      if (!dateString) return 'Just now';

      // Parse the date string - backend sends ISO strings, convert to Philippine time
      let date;
      try {
        // Parse as UTC first
        const utcDate = new Date(dateString);

        // Convert to Philippine time (UTC+8)
        date = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));

        // Validate the date
        if (isNaN(date.getTime())) {
          console.warn('Invalid date string:', dateString);
          return 'Invalid date';
        }
      } catch (error) {
        console.warn('Error parsing date:', dateString, error);
        return 'Invalid date';
      }

      const now = new Date();
      const diffMs = now - date;
      const diffHours = diffMs / (1000 * 60 * 60);

      // Show absolute time for better accuracy
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    // Get category icon
    const getCategoryIcon = (category) => {
      const icons = {
        message: 'mdi-email-outline',
        prayer_request: 'mdi-hands-pray',
        schedule_change: 'mdi-calendar-clock',
        service: 'mdi-church',
        default: 'mdi-information-outline'
      };
      return icons[category] || icons.default;
    };

    // Get category label
    const getCategoryLabel = (category) => {
      const labels = {
        message: 'Message',
        prayer_request: 'Prayer Request',
        schedule_change: 'Schedule Change',
        service: 'Service Update',
        default: 'Notification'
      };
      return labels[category] || labels.default;
    };

    // Get category color
    const getCategoryColor = (category) => {
      const colors = {
        message: '#1976D2',
        prayer_request: '#4CAF50',
        schedule_change: '#FF9800',
        service: '#14b8a6',
        default: '#666666'
      };
      return colors[category] || colors.default;
    };

    // Get service status color
    const getServiceStatusColor = (status) => {
      const statusColors = {
        pending: 'warning',
        approved: 'success',
        completed: 'info',
        cancelled: 'error',
        disapproved: 'error',
        default: 'grey'
      };
      return statusColors[status?.toLowerCase()] || statusColors.default;
    };

    // Mark notification as read
    const markAsRead = (notificationId) => {
      emit('mark-as-read', notificationId);
    };

    const dismiss = (notificationId) => {
      emit('dismiss', notificationId);
    };

    const openDismissDialog = (notificationId) => {
      notificationToDismiss.value = notificationId;
      showDismissDialog.value = true;
    };

    const confirmDismiss = () => {
      if (notificationToDismiss.value) {
        dismiss(notificationToDismiss.value);
        showDismissDialog.value = false;
        notificationToDismiss.value = null;
      }
    };

    // Handle notification click
    const handleNotificationClick = (notification) => {
      emit('notification-click', notification);
    };

    return {
      showDismissDialog,
      notificationToDismiss,
      formatDate,
      getCategoryIcon,
      getCategoryLabel,
      getCategoryColor,
      getServiceStatusColor,
      markAsRead,
      dismiss,
      openDismissDialog,
      confirmDismiss,
      handleNotificationClick
    };
  }
});
</script>

<style scoped>
.notification-list-container {
  position: relative;
}

.loading-state {
  padding: 24px;
  text-align: center;
}

.notification-item {
  position: relative;
  padding: 12px 16px;
  border-bottom: 1px solid #eeeeee;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.notification-item:hover {
  background-color: #f5f5f5;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-icon {
  flex-shrink: 0;
}

.category-label {
  color: #666666;
  text-transform: capitalize;
}

.timestamp {
  color: #999999;
  white-space: nowrap;
}

.mark-read-btn {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.mark-read-btn:hover {
  opacity: 1;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.dismiss-btn {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.dismiss-btn:hover {
  opacity: 1;
  color: #f44336;
}

.notification-content {
  padding: 8px 0;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.notification-content.unread {
  background-color: rgba(20, 184, 168, 0.05);
  border-left: 2px solid #14b8a6;
  padding-left: 10px;
}

.notification-title {
  color: #333333;
  line-height: 1.4;
}

.notification-message {
  color: #666666;
  line-height: 1.5;
}

.notification-details {
  color: #999999;
  margin-top: 4px;
}

.notification-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #eeeeee;
}

.status-chip :deep(.v-chip__content) {
  font-size: 11px;
  font-weight: 500;
  text-transform: capitalize;
}

.service-type {
  color: #666666;
  font-style: italic;
}

/* Animation for new notifications */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notification-item.new {
  animation: fadeIn 0.3s ease-out;
}
</style>