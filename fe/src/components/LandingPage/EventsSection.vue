 <template>
  <section class="events-section" style="position: relative">
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
          "
        >
          {{ eventsTitle }}
        </h2>
        <p
          class="text-h6 text-black fade-in-up-delay"
          style="
            font-family: 'Georgia', serif;
            font-style: italic;
          "
        >
          {{ eventsSubtitle }}
        </p>
      </div>

      <div v-if="events.length > 0">
        <!-- Infinite Auto-Scroll Container -->
        <div
          ref="eventsScrollContainer"
          class="events-grid-container"
          :class="[
            events.length > 3 ? 'auto-scroll' : '',
            `events-count-${Math.min(events.length, 4)}`
          ]"
          @mouseenter="pauseAutoScroll"
          @mouseleave="resumeAutoScroll"
        >
          <v-card
            v-for="(event, index) in displayedEvents"
            :key="`${event.id}-${index}`"
            :class="`event-card event-card-${(index % events.length) + 1}`"
            height="384"
            elevation="4"
            hover
            @mouseenter="pauseAutoScroll"
            @mouseleave="resumeAutoScroll"
          >
            <div
              class="event-background"
              :style="{
                backgroundImage: event.imageUrl
                  ? `url(${event.imageUrl})`
                  : `url(http://localhost:8081/bbek/event_image?eventName=${encodeURIComponent(
                      event.eventName
                    )})`,
              }"
            ></div>
            <div class="event-overlay"></div>
            <div class="event-content">
              <h3
                class="text-h5 font-weight-bold text-white mb-3"
                style="font-family: 'Georgia', serif; font-style: italic"
              >
                {{ event.eventName }}
              </h3>
              <div class="event-details mb-4">
                <p class="event-date text-white mb-1">
                  <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
                  {{ formatDate(event.start_date) }}
                </p>
                <p class="event-time text-white mb-1">
                  <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
                  {{ formatTime(event.start_date) }}
                </p>
              </div>
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
        <p class="text-h6 text-grey">No upcoming events at this time.</p>
      </div>
    </v-container>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from "vue";
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

// Displayed events (duplicated for auto-scroll when 4+ events)
const displayedEvents = computed(() => {
  if (events.value.length > 3) {
    // For auto-scroll, duplicate events for seamless looping
    return [...events.value, ...events.value, ...events.value];
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

const eventsTitle = ref("Upcoming Events");
const eventsSubtitle = ref(
  "Join us in our upcoming events and be part of our community in faith and fellowship."
);
const allEventsButtonText = ref("All Events");
const allEventsButtonColor = ref("#14b8a6");

// Fetch home data from CMS using shared store
const fetchHomeData = async () => {
  try {
    const cmsData = await cmsStore.fetchPageData("home");
    if (cmsData) {
      const { page } = cmsData;
      const content = page?.content || {};

      // Update events section data
      eventsTitle.value = content.eventsTitle || eventsTitle.value;
      eventsSubtitle.value = content.eventsSubtitle || eventsSubtitle.value;
      allEventsButtonText.value =
        content.allEventsButtonText || allEventsButtonText.value;
      allEventsButtonColor.value =
        content.allEventsButtonColor || allEventsButtonColor.value;
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error("Error fetching home data from CMS:", error);
    }
  }
};

// Preload images to prevent disappearing when fetching
const preloadImages = async (eventList) => {
  // Cache images in browser memory
  const imageCache = {};
  
  const imagePromises = eventList.map((event) => {
    return new Promise((resolve) => {
      if (event.imageUrl) {
        const img = new Image();
        
        img.onload = () => {
          imageCache[event.id] = event.imageUrl; // Cache successful loads
          resolve();
        };
        
        img.onerror = () => {
          console.warn(`Failed to load image for event: ${event.eventName}`);
          // Try fallback endpoint if primary fails
          if (!event.imageUrl.includes('event_image')) {
            const fallbackUrl = `http://localhost:8081/bbek/event_image?eventName=${encodeURIComponent(event.eventName)}`;
            const fallbackImg = new Image();
            fallbackImg.onload = () => {
              event.imageUrl = fallbackUrl;
              imageCache[event.id] = fallbackUrl;
              resolve();
            };
            fallbackImg.onerror = resolve; // Still resolve even if fallback fails
            fallbackImg.src = fallbackUrl;
          } else {
            resolve();
          }
        };
        
        img.src = event.imageUrl;
      } else {
        resolve();
      }
    });
  });
  
  await Promise.all(imagePromises);
  
  // Store cache in sessionStorage for persistence
  try {
    sessionStorage.setItem('eventImageCache', JSON.stringify(imageCache));
  } catch (e) {
    console.warn('Could not cache images in sessionStorage', e);
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
      selectedStatus: "ongoing", // Show ongoing events
    });

    if (result.success && result.data) {
      // Map the events data to match the expected format
      const mappedEvents = result.data.map((event) => ({
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
      
      // Preload images before updating state
      await preloadImages(mappedEvents);
      events.value = mappedEvents;
    } else {
      events.value = [];
    }
    console.log('Upcoming events fetched:', events.value.length, events.value);
  } catch (error) {
    console.error("Error fetching events:", error);
    events.value = [];
  } finally {
    loading.value = false;
  }
};

// Cinema focus functionality removed - using simple infinite scroll

const startAutoScroll = () => {
  if (autoScrollInterval.value) return;

  autoScrollInterval.value = setInterval(() => {
    if (isAutoScrolling.value && eventsScrollContainer.value && events.value.length > 3) {
      const container = eventsScrollContainer.value;
      const scrollAmount = 2; // pixels per frame

      // For seamless looping with 3 copies of events
      const oneSetWidth = container.scrollWidth / 3;

      // Smoothly scroll right to left and reset when reaching the end
      if (container.scrollLeft <= 0) {
        container.scrollLeft = oneSetWidth * 2; // Reset to end of middle set
      } else {
        container.scrollLeft -= scrollAmount; // Continuous right-to-left scroll
      }
    }
  }, 30); // 30ms interval for smoother scrolling
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

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format time for display
const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

onMounted(async () => {
  await fetchHomeData();
  await fetchEvents();

  // Start auto-scroll if there are 4+ events
  if (events.value.length > 3) {
    await nextTick();
    // Position container for right-to-left scrolling
    if (eventsScrollContainer.value) {
      eventsScrollContainer.value.scrollLeft = (eventsScrollContainer.value.scrollWidth / 3) * 2;
    }
    startAutoScroll();
  }
});

onBeforeUnmount(() => {
  stopAutoScroll();
});
</script>

<style scoped>
.events-section {
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

/* Grid Container with responsive columns */
.events-grid-container {
  display: grid;
  gap: 1.5rem;
  width: 100%;
  place-items: center;
}

/* 1 Event - Centered */
.events-grid-container.events-count-1 {
  display: flex;
  justify-content: center;
  align-items: center;
}

.events-grid-container.events-count-1 .event-card {
  width: 100%;
  max-width: 440px;
  height: 384px;
}

/* 2 Events - 2 columns */
.events-grid-container.events-count-2 {
  grid-template-columns: repeat(2, 1fr);
  justify-items: center;
  max-width: 1000px;
  margin: 0 auto;
}

.events-grid-container.events-count-2 .event-card {
  width: 100%;
  max-width: 440px;
  height: 384px;
}

/* 3 Events - Centered in grid */
.events-grid-container.events-count-3 {
  grid-template-columns: repeat(3, 1fr);
  justify-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.events-grid-container.events-count-3 .event-card {
  width: 100%;
  max-width: 440px;
  height: 384px;
}

/* 4 Events - 2x2 grid */
.events-grid-container.events-count-4 {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  max-width: 1600px;
  margin: 0 auto;
}

.events-grid-container.events-count-4 .event-card {
  width: 100%;
  max-width: 440px;
  height: 384px;
}

/* Auto-scroll carousel for 4+ events - shows 3 cards at a time */
.events-grid-container.auto-scroll {
  display: flex;
  flex-wrap: nowrap;
  gap: 24px;
  overflow: hidden; /* Hide overflow to show only 3 cards */
  padding-bottom: 16px;
  position: relative;
  width: 100%;
  max-width: 1368px; /* 3 cards (440px each) + 2 gaps (24px each) = 1320px + 48px = 1368px */
  margin: 0 auto;
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
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: auto auto;
  max-width: 800px;
  margin: 0 auto;
}

.events-grid.grid-3 .event-card:nth-child(3) {
  grid-column: 1 / -1;
  max-width: 400px;
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
  min-width: 300px;
  flex-shrink: 0;
}

.events-grid-container:not(.auto-scroll) .event-card {
  max-width: 100%;
}

.events-grid-container.auto-scroll .event-card {
  min-width: 440px;
  width: 440px;
  height: 384px;
  flex-shrink: 0;
}

/* Cinema focus effects removed - using simple infinite scroll */

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
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
}

.event-card:hover .event-image {
  transform: scale(1.1);
}

.event-card:hover .event-background {
  transform: scale(1.05);
}

.event-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-color: #e0e0e0; /* Fallback color if image fails */
  transition: transform 0.5s ease;
  z-index: 0;
  will-change: transform;
}

.event-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #e0e0e0; /* Fallback color */
  transition: transform 0.5s ease;
}

.event-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.3));
  z-index: 1;
}

.event-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2;
  padding: 1.5rem;
  color: white;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%);
}

.event-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.75rem;
  font-family: 'Poppins', 'Inter', sans-serif;
}

.event-date {
  color: white;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  font-family: 'Poppins', 'Inter', sans-serif;
}

.event-location {
  color: white;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  font-family: 'Poppins', 'Inter', sans-serif;
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

/* Responsive breakpoints for different screen sizes */
@media (max-width: 1200px) {
  .events-grid-container.events-count-4:not(.auto-scroll) {
    grid-template-columns: repeat(3, 1fr);
    max-width: 1400px;
  }

  .events-grid-container.events-count-4:not(.auto-scroll) .event-card {
    max-width: 440px;
    height: 384px;
  }
}

@media (max-width: 900px) {
  .events-grid-container.events-count-3:not(.auto-scroll),
  .events-grid-container.events-count-4:not(.auto-scroll) {
    grid-template-columns: repeat(2, 1fr);
    max-width: 1000px;
  }

  .events-grid-container.events-count-3:not(.auto-scroll) .event-card,
  .events-grid-container.events-count-4:not(.auto-scroll) .event-card {
    max-width: 440px;
    height: 384px;
  }
}

@media (max-width: 600px) {
  .events-grid-container.events-count-2:not(.auto-scroll),
  .events-grid-container.events-count-3:not(.auto-scroll),
  .events-grid-container.events-count-4:not(.auto-scroll) {
    grid-template-columns: 1fr;
    max-width: 500px;
  }

  .events-grid-container:not(.auto-scroll) .event-card {
    max-width: 500px;
    height: 384px;
  }

  /* Auto-scroll cards on mobile */
  .events-grid-container.auto-scroll .event-card {
    min-width: 440px;
    width: 440px;
    height: 384px;
  }
}

@media (max-width: 960px) {
  .events-section {
    padding: 48px 0;
    margin-top: 48px;
    margin-bottom: 48px;
  }

  .events-section :deep(.text-h3) {
    font-size: 1.75rem !important;
  }

  .floating-element {
    display: none;
  }
}
</style>
