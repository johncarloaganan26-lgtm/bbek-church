<template>
  <section class="past-events-section" style="position: relative">
    <!-- Loading overlay -->
    <v-overlay
      :model-value="isLoadingHome"
      contained
      class="align-center justify-center"
      style="z-index: 10"
    >
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      ></v-progress-circular>
    </v-overlay>

    <!-- Floating Elements -->
    <div class="floating-elements">
      <div
        v-for="(element, index) in floatingElements"
        :key="index"
        class="floating-element"
        :style="element.style"
      ></div>
    </div>

    <v-container>
      <div class="text-center mb-8">
        <h2
          class="text-h3 text-md-h4 font-weight-bold text-black mb-4 fade-in-up"
          style="
            font-family: 'Georgia', serif;
            font-style: italic;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          "
        >
          {{ eventsTitle }}
        </h2>
        <p
          class="text-h6 text-black fade-in-up-delay"
          style="
            font-family: 'Georgia', serif;
            font-style: italic;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          "
        >
          {{ eventsSubtitle }}
        </p>
      </div>

      <div v-if="events.length > 0">
        <!-- Horizontal Scroll for 4+ events -->
        <div
          v-if="events.length >= 4"
          ref="eventsScrollContainer"
          class="events-scroll"
          @mouseenter="pauseAutoScroll"
          @mouseleave="resumeAutoScroll"
        >
          <v-card
            v-for="(event, index) in duplicatedEvents"
            :key="`${event.id}-${index}`"
            :class="`event-card event-card-${(index % events.length) + 1}`"
            height="384"
            @mouseenter="pauseAutoScroll"
            @mouseleave="resumeAutoScroll"
          >
            <div
              class="event-image"
              :style="{ backgroundImage: event.imageUrl ? `url('${event.imageUrl}')` : 'url(/img/events.jpg)' }"
            ></div>
            <div class="event-overlay"></div>
            <div class="event-content">
              <h3 class="event-title">{{ event.eventName }}</h3>
              <p class="event-date">{{ event.start_date }} - {{ event.end_date }}</p>
              <p class="event-location">{{ event.location }}</p>
              <v-btn
                color="white"
                variant="outlined"
                class="mt-4"
                @click="goToLearnMore(event)"
              >
                Learn More
              </v-btn>
            </div>
          </v-card>
        </div>

        <!-- Grid Layout for < 4 events -->
        <div v-else class="events-grid" :class="{
          'grid-1': events.length === 1,
          'grid-2': events.length === 2,
          'grid-3': events.length === 3
        }">
          <v-card
            v-for="(event, index) in events"
            :key="index"
            :class="`event-card event-card-${index + 1}`"
            height="384"
            elevation="4"
            hover
          >
            <div
              class="event-background"
              :style="{
                backgroundImage: event.imageUrl
                  ? `url(${event.imageUrl})`
                  : `url(/img/events.jpg)`,
              }"
            ></div>
            <div class="event-overlay"></div>
            <div class="event-content">
              <h3
                class="text-h5 font-weight-bold text-white mb-4"
                style="font-family: 'Georgia', serif; font-style: italic"
              >
                {{ event.eventName }}
              </h3>
              <p class="text-white mb-6 text-body-2">
                {{
                  event.description.length > 150
                    ? event.description.substring(0, 150) + "..."
                    : event.description
                }}
              </p>
              <v-btn
                color="rgba(255, 255, 255, 0.2)"
                variant="outlined"
                class="text-white"
                size="small"
                rounded
                @click="goToLearnMore(event)"
              >
                Learn More
              </v-btn>
            </div>
          </v-card>
        </div>

        <div class="text-center mt-8">
          <v-btn
            :color="allEventsButtonColor"
            class="text-white all-events-btn"
            rounded
            size="large"
            @click="$router.push('/events')"
          >
            {{ allEventsButtonText }}
          </v-btn>
        </div>
      </div>

      <div v-else class="text-center py-12">
        <p class="text-h6 text-grey">No past events at this time.</p>
      </div>
    </v-container>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRouter } from "vue-router";
import { useCmsStore } from "@/stores/cmsStore";
import { useEventsRecordsStore } from "@/stores/ChurchRecords/eventsRecordsStore";

const router = useRouter();
const eventsStore = useEventsRecordsStore();
const cmsStore = useCmsStore();
const events = ref([]);
const loading = ref(false);
const eventsScrollContainer = ref(null);
const autoScrollInterval = ref(null);
const isAutoScrolling = ref(true);

// Loading state for CMS data
const isLoadingHome = computed(() => cmsStore.isPageLoading("home"));

// Duplicated events for infinite scroll
const duplicatedEvents = computed(() => {
  if (events.value.length >= 4) {
    return [...events.value, ...events.value];
  }
  return events.value;
});

const floatingElements = ref([
  {
    style: {
      top: "80px",
      left: "40px",
      width: "64px",
      height: "64px",
      animationDelay: "0s",
    },
  },
  {
    style: {
      top: "160px",
      right: "80px",
      width: "48px",
      height: "48px",
      animationDelay: "1s",
    },
  },
  {
    style: {
      bottom: "80px",
      left: "80px",
      width: "56px",
      height: "56px",
      animationDelay: "2s",
    },
  },
  {
    style: {
      bottom: "40px",
      right: "40px",
      width: "40px",
      height: "40px",
      animationDelay: "0.5s",
    },
  },
  {
    style: {
      top: "50%",
      left: "33%",
      width: "32px",
      height: "32px",
      animationDelay: "1.5s",
    },
  },
]);

const eventsTitle = ref("Past Events");
const eventsSubtitle = ref(
  "Reflecting on our completed events that brought our community together in faith and fellowship."
);
const allEventsButtonText = ref("All Events");
const allEventsButtonColor = ref("#14b8a6");

// Fetch past events data from CMS using shared store
const fetchPastEventsData = async () => {
  try {
    const cmsData = await cmsStore.fetchPageData("pastEvents");
    if (cmsData) {
      const { page } = cmsData;
      const content = page?.content || {};

      // Update past events section data
      eventsTitle.value = content.pastEventsTitle || eventsTitle.value;
      eventsSubtitle.value = content.pastEventsSubtitle || eventsSubtitle.value;
      allEventsButtonText.value =
        content.allEventsButtonText || allEventsButtonText.value;
      allEventsButtonColor.value =
        content.allEventsButtonColor || allEventsButtonColor.value;
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error("Error fetching past events data from CMS:", error);
    }
  }
};

// Fetch events from API
const fetchEvents = async () => {
  loading.value = true;
  try {
    const result = await eventsStore.fetchPublicEvents({
      page: 1,
      pageSize: 4, // Get first 4 events for the section
      search: "",
      selectedStatus: "completed", // Show completed events
    });

    if (result.success && result.data) {
      // Map the events data to match the expected format
      events.value = result.data.map((event) => ({
        id: event.event_id,
        eventName: event.title || event.eventName,
        description: event.description || "",
        start_date: event.start_date,
        end_date: event.end_date,
        location: event.location,
        link: event.link,
        type: event.type,
        status: event.status,
        image: event.image,
        imageUrl:
          event.imageUrl ||
          (event.image
            ? event.image.startsWith("data:")
              ? event.image
              : `data:image/jpeg;base64,${event.image}`
            : null),
      }));
    } else {
      events.value = [];
    }
  } catch (error) {
    console.error("Error fetching events:", error);
    events.value = [];
  } finally {
    loading.value = false;
  }
};


const startAutoScroll = () => {
  if (autoScrollInterval.value) return;

  autoScrollInterval.value = setInterval(() => {
    if (isAutoScrolling.value && eventsScrollContainer.value) {
      const container = eventsScrollContainer.value;
      const scrollAmount = 2; // pixels per frame
      const maxScroll = container.scrollWidth / 2; // Halfway point for seamless loop

      if (container.scrollLeft <= 0) {
        container.scrollLeft = maxScroll; // Reset to end for seamless right-to-left loop
      } else {
        container.scrollLeft -= scrollAmount; // Scroll right to left
      }
    }
  }, 50); // 50ms interval for smooth scrolling
};

const pauseAutoScroll = () => {
  isAutoScrolling.value = false;
};

const resumeAutoScroll = () => {
  isAutoScrolling.value = true;
};

const stopAutoScroll = () => {
  if (autoScrollInterval.value) {
    clearInterval(autoScrollInterval.value);
    autoScrollInterval.value = null;
  }
};

const goToLearnMore = (event) => {
  // Use the same navigation pattern as AllEvents.vue
  router.push({
    name: "LearnMoreEvent",
    query: { eventModel: encodeURIComponent(JSON.stringify(event)) },
  });
};

onMounted(async () => {
  await fetchPastEventsData();
  await fetchEvents();

  // Start auto-scroll if there are 4+ events
  if (events.value.length >= 4) {
    startAutoScroll();
  }
});

onBeforeUnmount(() => {
  stopAutoScroll();
});
</script>

<style scoped>
.past-events-section {
  position: relative;
  padding: 48px 0;
  margin-top: 80px;
  margin-bottom: 80px;
  background: white;
  overflow: hidden;
}

.floating-elements {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.floating-element {
  position: absolute;
  background: rgba(20, 184, 166, 0.3);
  border-radius: 50%;
  animation: float 3.5s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.events-scroll {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  padding-bottom: 16px;
  scrollbar-width: none; /* Hide scrollbar for Firefox */
  -ms-overflow-style: none; /* Hide scrollbar for IE/Edge */
  scroll-behavior: smooth;
}

.events-scroll::-webkit-scrollbar {
  display: none; /* Hide scrollbar for Chrome/Safari */
}

.events-grid {
  display: grid;
  gap: 1.5rem;
  justify-content: center;
  align-items: start;
}

.events-grid.grid-1 {
  grid-template-columns: 1fr;
  max-width: 400px;
  margin: 0 auto;
}

.events-grid.grid-2 {
  grid-template-columns: repeat(2, 1fr);
  max-width: 800px;
  margin: 0 auto;
}

.events-grid.grid-3 {
  grid-template-columns: repeat(3, 1fr);
  max-width: 1200px;
  margin: 0 auto;
}

.event-card {
  position: relative;
  height: 384px;
  overflow: hidden;
  border-radius: 1rem;
  animation: fadeInUp 0.6s ease-out both;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.event-card-1 {
  animation-delay: 200ms;
}

.event-card-2 {
  animation-delay: 300ms;
}

.event-card-3 {
  animation-delay: 400ms;
}

.event-card-4 {
  animation-delay: 500ms;
}

.event-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}

.event-card:hover .event-image {
  transform: scale(1.1);
}

.event-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition: transform 0.5s ease;
}

.event-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(55, 65, 81, 0.7), rgba(75, 85, 99, 0.2), transparent);
  z-index: 1;
}

.event-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  padding: 1.5rem;
  color: white;
}

.event-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.75rem;
  font-family: 'Poppins', 'Inter', sans-serif;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.event-date {
  color: white;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  font-family: 'Poppins', 'Inter', sans-serif;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.event-location {
  color: white;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  font-family: 'Poppins', 'Inter', sans-serif;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.event-content :deep(.v-btn) {
  transition: all 0.3s ease;
}

.event-content :deep(.v-btn:hover) {
  transform: scale(1.05);
  background-color: rgba(255, 255, 255, 0.3) !important;
}

.all-events-btn {
  transition: all 0.3s ease;
}

.all-events-btn:hover {
  background-color: #000000 !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.fade-in-up {
  animation: fadeInUp 0.8s ease-out;
}

.fade-in-up-delay {
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1024px) {
  .events-grid.grid-2,
  .events-grid.grid-3 {
    grid-template-columns: 1fr;
    max-width: 400px;
  }

  .events-grid.grid-3 {
    grid-template-columns: repeat(2, 1fr);
    max-width: 800px;
  }
}

@media (max-width: 640px) {
  .event-card {
    height: 320px;
  }

  .events-grid {
    gap: 1rem;
  }

  .events-grid.grid-1,
  .events-grid.grid-2,
  .events-grid.grid-3 {
    grid-template-columns: 1fr;
    max-width: 100%;
  }
}

@media (max-width: 960px) {
  .past-events-section {
    padding: 48px 0;
    margin-top: 48px;
    margin-bottom: 48px;
  }

  .past-events-section :deep(.text-h3) {
    font-size: 1.75rem !important;
  }

  .floating-element {
    display: none;
  }
}
</style>