<template>
  <div class="give-in-person">
    <v-card class="mb-4" elevation="2">
      <v-card-text class="text-center">
        <v-icon size="48" color="blue" class="mb-4">mdi-cash</v-icon>
        <h3 class="text-h5 font-weight-bold mb-2" style="font-family: 'Georgia', serif; font-style: italic;">{{ giveInPersonData.giveInPersonTitle || 'Give in Person' }}</h3>
        <p class="text-body-1 text-grey-darken-1 mb-4" style="font-family: 'Georgia', serif; font-style: italic;">
          {{ giveInPersonData.giveInPersonText || 'You can give during any of our worship services by placing your donation in the offering box.' }}
        </p>
        <v-card variant="flat" color="grey-lighten-4" class="pa-3">
          <p class="text-body-2 mb-0" style="font-family: 'Georgia', serif; font-style: italic;">
            <span class="font-weight-semibold">{{ giveInPersonData.sundayServicesLabel || 'Sunday Services:' }} {{ giveInPersonData.sundayServicesTime || '9:00 AM - 11:00 AM' }}</span>
          </p>
        </v-card>
      </v-card-text>
    </v-card>

    <v-card variant="outlined" class="pa-6">
      <div class="d-flex align-start gap-3">
        <v-icon color="blue" size="24">mdi-calendar</v-icon>
        <div>
          <h3 class="text-h6 font-weight-bold mb-2" style="font-family: 'Georgia', serif; font-style: italic;">{{ giveInPersonData.scheduledGivingTitle || 'Scheduled Giving' }}</h3>
          <p class="text-body-2 text-grey-darken-1" style="font-family: 'Georgia', serif; font-style: italic;">
            {{ giveInPersonData.scheduledGivingText || "If you'd like to set up regular, scheduled giving, please contact our church office for assistance. We can help you establish a consistent giving plan that works for you." }}
          </p>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup>
// Component for in-person giving information
defineProps({
  giveInPersonData: {
    type: Object,
    default: () => ({})
  }
})
</script>

<style scoped>
.give-in-person {
  padding: 16px;
}

.give-in-person :deep(.v-card) {
  transition: all 0.3s ease;
}

.give-in-person :deep(.v-card:hover) {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.give-in-person :deep(.v-icon) {
  transition: transform 0.3s ease;
}

.give-in-person :deep(.v-card:hover .v-icon) {
  transform: scale(1.1) rotate(5deg);
}
</style>
