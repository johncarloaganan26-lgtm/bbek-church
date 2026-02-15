<template>
  <div class="live-page">
    <!-- Floating Elements -->
    <div class="floating-elements">
      <div
        v-for="(element, index) in floatingElements"
        :key="index"
        class="floating-element"
        :style="element.style"
      ></div>
    </div>

    <!-- Hero Section -->
    <section class="hero-section">
      <div
        class="hero-background"
        :style="{ backgroundImage: `url(${heroImageUrl})` }"
      ></div>
      <div class="hero-overlay-gradient"></div>

      <div class="hero-content-wrapper">
        <h1 class="hero-title fade-in-up">{{ heroTitle }}</h1>
        <p class="hero-subtitle fade-in-up-delay">
          {{ heroDescription }}
        </p>
      </div>
    </section>

    <!-- Live Stream Section -->
    <section class="live-stream-section py-20">
      <v-container>
        <!-- Live Stream Card -->
        <v-card class="live-stream-card-custom mx-auto" elevation="4">
          <!-- Stream Header -->
          <v-card-title class="bg-gradient-primary text-white">
            <v-row align="center" no-gutters>
              <v-col cols="12" md="6" class="d-flex align-left justify-left">
                <div>
                  <h3 class="text-h6 font-weight-bold text-left">
                    {{
                      selectedSermon
                        ? selectedSermon.title
                        : ongoingEvent
                        ? ongoingEvent.title
                        : "Sunday Morning Service"
                    }}
                  </h3>
                  <p class="text-caption opacity-90 text-left">
                    {{
                      selectedSermon && selectedSermon.start_date
                        ? formatDate(selectedSermon.start_date)
                        : ongoingEvent && ongoingEvent.start_date
                        ? formatDate(ongoingEvent.start_date)
                        : "Every Sunday at 9:00 AM"
                    }}
                  </p>
                </div>
              </v-col>
              <v-col
                cols="12"
                md="6"
                class="d-flex align-center justify-end gap-2"
              >
                <v-btn
                  v-if="selectedSermon && ongoingEvent && ongoingEvent.link"
                  variant="text"
                  color="white"
                  size="small"
                  prepend-icon="mdi-arrow-left"
                  @click="selectedSermon = null"
                >
                  Back to Live
                </v-btn>
                <div
                  v-if="ongoingEvent && ongoingEvent.link && !selectedSermon"
                  class="d-flex align-center gap-2"
                >
                  <div class="live-indicator"></div>
                  <span class="text-body-2 font-weight-semibold pl-2"
                    >LIVE</span
                  >
                  <!-- Show Ministry badge for ministry sermons -->
                  <v-chip v-if="ongoingEvent.isMinistry" size="small" color="teal" variant="flat">
                    <v-icon start size="small">mdi-church</v-icon>
                    Ministry
                  </v-chip>
                </div>
              </v-col>
            </v-row>
          </v-card-title>

          <!-- Stream Content -->
          <div class="stream-container">
            <!-- Selected Sermon Display -->
            <div
              v-if="selectedSermon && selectedSermon.link && embedUrl"
              class="aspect-video bg-grey-darken-4 position-relative"
            >
              <iframe
                :src="embedUrl"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
                class="w-100 h-100"
                style="width: 100%; height: 100%"
                @error="onIframeError"
              ></iframe>
              <!-- Fallback button if iframe fails -->
              <div
                v-if="iframeError"
                class="position-absolute inset-0 d-flex align-center justify-center bg-grey-darken-4"
              >
                <div class="text-center text-white pa-4">
                  <v-icon size="80" color="red-lighten-2" class="mb-6"
                    >mdi-alert-circle</v-icon
                  >
                  <h4 class="text-h5 font-weight-bold mb-3">
                    Unable to load video
                  </h4>
                  <p
                    class="text-body-1 text-grey-lighten-1 mb-8 max-width-md mx-auto"
                  >
                    Click below to watch the sermon in a new window.
                  </p>
                  <v-btn
                    color="blue"
                    size="large"
                    prepend-icon="mdi-open-in-new"
                    class="text-white"
                    :href="selectedSermon.link"
                    target="_blank"
                  >
                    Watch Sermon
                  </v-btn>
                </div>
              </div>
            </div>
            <div
              v-else-if="selectedSermon && selectedSermon.link"
              class="aspect-video bg-grey-darken-4 d-flex align-center justify-center"
            >
              <div class="text-center text-white pa-4">
                <v-icon size="80" color="blue-lighten-2" class="mb-6"
                  >mdi-play-circle</v-icon
                >
                <h4 class="text-h5 font-weight-bold mb-3">
                  {{ selectedSermon.title }}
                </h4>
                <p
                  class="text-body-1 text-grey-lighten-1 mb-8 max-width-md mx-auto"
                >
                  Click below to watch the sermon.
                </p>
                <v-btn
                  color="blue"
                  size="large"
                  prepend-icon="mdi-open-in-new"
                  class="text-white"
                  :href="selectedSermon.link"
                  target="_blank"
                >
                  Watch Sermon
                </v-btn>
              </div>
            </div>
            <!-- Ongoing Event Display -->
            <div
              v-else-if="ongoingEvent && ongoingEvent.link && embedUrl"
              class="aspect-video bg-grey-darken-4 position-relative"
            >
              <iframe
                :src="embedUrl"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
                class="w-100 h-100"
                style="width: 100%; height: 100%"
                @error="onIframeError"
              ></iframe>
              <!-- Fallback button if iframe fails -->
              <div
                v-if="iframeError"
                class="position-absolute inset-0 d-flex align-center justify-center bg-grey-darken-4"
              >
                <div class="text-center text-white pa-4">
                  <v-icon size="80" color="red-lighten-2" class="mb-6"
                    >mdi-alert-circle</v-icon
                  >
                  <h4 class="text-h5 font-weight-bold mb-3">
                    Unable to load video
                  </h4>
                  <p
                    class="text-body-1 text-grey-lighten-1 mb-8 max-width-md mx-auto"
                  >
                    Click below to watch the live stream in a new window.
                  </p>
                  <v-btn
                    color="blue"
                    size="large"
                    prepend-icon="mdi-open-in-new"
                    class="text-white"
                    :href="ongoingEvent.link"
                    target="_blank"
                  >
                    Watch Live Stream
                  </v-btn>
                </div>
              </div>
            </div>
            <div
              v-else-if="ongoingEvent && ongoingEvent.link"
              class="aspect-video bg-grey-darken-4 d-flex align-center justify-center"
            >
              <div class="text-center text-white pa-4">
                <v-icon size="80" color="blue-lighten-2" class="mb-6"
                  >mdi-play-circle</v-icon
                >
                <h4 class="text-h5 font-weight-bold mb-3">
                  {{ ongoingEvent.title }}
                </h4>
                <p
                  class="text-body-1 text-grey-lighten-1 mb-8 max-width-md mx-auto"
                >
                  Click below to watch the live stream.
                </p>
                <v-btn
                  color="blue"
                  size="large"
                  prepend-icon="mdi-open-in-new"
                  class="text-white"
                  :href="ongoingEvent.link"
                  target="_blank"
                >
                  Watch Live Stream
                </v-btn>
              </div>
            </div>
            <div
              v-else-if="!ongoingEvent || !ongoingEvent.link"
              class="aspect-video bg-grey-darken-4 d-flex align-center justify-center"
            >
              <div class="text-center text-white">
                <v-icon size="80" color="grey-lighten-1" class="mb-6"
                  >mdi-video-off</v-icon
                >
                <h4 class="text-h5 font-weight-bold mb-3">
                  No Live Stream
                </h4>
                <p
                  class="text-body-1 text-grey-lighten-1 mb-8 max-width-md mx-auto"
                >
                  There is no live stream at the moment. Please check back during our service times.
                </p>
                <v-btn
                  color="teal"
                  size="large"
                  prepend-icon="mdi-calendar"
                  class="text-white"
                  @click="$router.push('/services')"
                >
                  View Service Times
                </v-btn>
              </div>
            </div>
          </div>
        </v-card>
      </v-container>
    </section>

    <!-- Sermons Archive Section -->
    <section class="sermons-section py-20" :style="{ backgroundColor: backgroundColor }">
      <v-container>
        <div class="text-center mb-16">
          <h2
            class="text-h3 text-md-h4 font-weight-bold text-grey-darken-3 mb-4 fade-in-up"
          >
            {{ sermonArchiveTitle }}
          </h2>
          <p
            class="text-h6 text-grey-darken-1 max-width-3xl mx-auto fade-in-up-delay"
          >
            {{ sermonArchiveDescription }}
          </p>
        </div>

        <!-- Sort Buttons -->
        <div v-if="allSermons.length > 0" class="text-center mb-8">
          <v-btn-toggle v-model="sortOrder" mandatory @update:modelValue="applySermonSorting">
            <v-btn value="recent" color="teal-darken-1">
              <v-icon left>mdi-calendar-clock</v-icon>
              Recent
            </v-btn>
            <v-btn value="oldest" color="teal-darken-1" variant="outlined">
              <v-icon left>mdi-calendar-remove</v-icon>
              Oldest
            </v-btn>
          </v-btn-toggle>
        </div>

        <v-row class="sermons-grid" v-if="sermons.length > 0">
          <v-col
            v-for="(sermon, index) in sermons"
            :key="index"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card
              class="sermon-card"
              elevation="0"
              rounded="lg"
              @click="selectSermon(sermon)"
            >
              <div class="sermon-image-wrapper">
                <v-img
                  :src="
                    sermon.imageUrl || sermon.image || '/img/default-sermon.jpg'
                  "
                  height="180"
                  cover
                  class="sermon-image"
                ></v-img>
                <div class="sermon-play-overlay">
                  <v-icon size="48" color="white" class="play-icon">mdi-play-circle</v-icon>
                </div>
              </div>
              <div class="sermon-content">
                <h3 class="sermon-title">{{ sermon.title }}</h3>
                <p class="sermon-date">{{ formatDate(sermon.start_date) }}</p>
                <!-- Show Ministry badge if it's a ministry sermon -->
                <v-chip v-if="sermon.isMinistry" size="small" color="teal" variant="flat" class="mt-1">
                  <v-icon start size="small">mdi-church</v-icon>
                  Ministry
                </v-chip>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- No Sermons Available -->
        <div v-else class="no-sermons-container">
          <v-icon size="80" color="grey-lighten-1">mdi-video-off</v-icon>
          <h3 class="text-h5 text-grey-darken-1 mt-4">No Sermon Archive</h3>
          <p class="text-body-1 text-grey-darken-1 mt-2 text-center">
            There are no sermon recordings available at the moment.<br>
            Please check back later for updates.
          </p>
        </div>

        <!-- View All Archive Button -->
        <div v-if="allSermons.length > 6" class="text-center mt-8">
          <v-btn
            color="teal-darken-1"
            size="large"
            variant="outlined"
            @click="toggleShowAllSermons"
          >
            <v-icon left>{{ showAllSermons ? 'mdi-chevron-up' : 'mdi-format-list-bulleted' }}</v-icon>
            {{ showAllSermons ? 'Show Less' : 'View All Archive (' + allSermons.length + ' Sermons)' }}
          </v-btn>
        </div>
      </v-container>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import axios from "@/api/axios";

const pageTitle = ref("LIVE WORSHIP & SERMONS");
const heroTitle = ref("LIVE WORSHIP & SERMONS");
const heroDescription = ref("Join us for live worship services, powerful sermons, and spiritual encouragement from our community");
const backgroundColor = ref("#ffffff");
const sermonArchiveTitle = ref("Sermon Archive");
const sermonArchiveDescription = ref("Browse through our collection of past sermons and teachings");
const heroImageUrl = ref("/img/bible.jpg");

const floatingElements = ref([
  {
    style: {
      top: "80px",
      left: "80px",
      width: "48px",
      height: "48px",
      animationDelay: "0s",
    },
  },
  {
    style: {
      top: "33%",
      right: "64px",
      width: "32px",
      height: "32px",
      animationDelay: "1.5s",
    },
  },
  {
    style: {
      bottom: "33%",
      left: "64px",
      width: "40px",
      height: "40px",
      animationDelay: "2s",
    },
  },
  {
    style: {
      bottom: "80px",
      right: "80px",
      width: "24px",
      height: "24px",
      animationDelay: "0.8s",
    },
  },
  {
    style: {
      top: "50%",
      left: "25%",
      width: "28px",
      height: "28px",
      animationDelay: "1.2s",
    },
  },
  {
    style: {
      bottom: "25%",
      right: "33%",
      width: "36px",
      height: "36px",
      animationDelay: "2.5s",
    },
  },
  {
    style: {
      top: "25%",
      left: "33%",
      width: "16px",
      height: "16px",
      animationDelay: "1.8s",
    },
  },
  {
    style: {
      top: "75%",
      right: "25%",
      width: "44px",
      height: "44px",
      animationDelay: "0.3s",
    },
  },
  {
    style: {
      bottom: "50%",
      left: "16%",
      width: "20px",
      height: "20px",
      animationDelay: "2.1s",
    },
  },
]);

const ongoingEvent = ref(null);
const sermons = ref([]);
const allSermons = ref([]); // Store all sermons for archive view
const allMinistrySermons = ref([]); // Store all ministry sermons for archive view
const showAllSermons = ref(false); // Toggle to show all sermons on same page
const sortOrder = ref('recent'); // 'recent' for newest first, 'oldest' for oldest first
const loading = ref(false);
const iframeError = ref(false);
const embedUrl = ref(null);
const selectedSermon = ref(null);

// Format date for display
const formatDate = (dateString) => {
  if (!dateString || dateString === '0000-00-00 00:00:00') return "TBA";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "TBA";
  // Check if time is midnight (00:00) - likely means no time was set
  const hours = date.getHours();
  const minutes = date.getMinutes();
  if (hours === 0 && minutes === 0) return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Convert video URL to embed URL
const convertToEmbedUrl = (url) => {
  if (!url) return null;

  try {
    // If already an embed URL, return as is
    if (url.includes("/embed/") || url.includes("embed")) {
      return url;
    }

    // YouTube URL conversion
    if (url.includes("youtube.com/watch") || url.includes("youtu.be/")) {
      let videoId = null;

      // Extract video ID from youtube.com/watch?v=VIDEO_ID
      const watchMatch = url.match(/[?&]v=([^&]+)/);
      if (watchMatch) {
        videoId = watchMatch[1];
      }

      // Extract video ID from youtu.be/VIDEO_ID
      const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
      if (shortMatch) {
        videoId = shortMatch[1];
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      }
    }

    // Facebook URL conversion
    if (url.includes("facebook.com") || url.includes("fb.com")) {
      // Facebook videos need to be converted to embed format
      // Format: https://www.facebook.com/plugins/video.php?href=ENCODED_URL
      // For Facebook Live, we might need the video ID or use the page URL
      if (url.includes("/videos/") || url.includes("/watch")) {
        const encodedUrl = encodeURIComponent(url);
        return `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&width=560&height=315`;
      } else if (url.includes("/live")) {
        // Facebook Live stream
        const encodedUrl = encodeURIComponent(url);
        return `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&width=560&height=315`;
      } else {
        // General Facebook video embed
        const encodedUrl = encodeURIComponent(url);
        return `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&width=560&height=315`;
      }
    }

    // Vimeo URL conversion
    if (url.includes("vimeo.com/")) {
      const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
      }
    }

    // If it's already an iframe-compatible URL or embed URL, return as is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      // Check if it looks like an embed URL
      if (
        url.includes("/embed") ||
        url.includes("player") ||
        url.includes("iframe")
      ) {
        return url;
      }
    }

    // If we can't convert it, return null (will show fallback button)
    return null;
  } catch (error) {
    console.error("Error converting URL to embed:", error);
    return null;
  }
};

// Handle iframe error (though this may not fire reliably due to browser security)
const onIframeError = () => {
  iframeError.value = true;
};

// Select a sermon to display in the main stream area
const selectSermon = (sermon) => {
  if (!sermon || !sermon.link) return;

  selectedSermon.value = sermon;
  iframeError.value = false;
  embedUrl.value = convertToEmbedUrl(sermon.link);

  // Scroll to the top of the stream card
  const streamCard = document.querySelector(".max-width-6xl");
  if (streamCard) {
    streamCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

// Fetch sermons CMS data
const fetchSermonsData = async () => {
  try {
    const response = await axios.get("/cms/sermons/full");
    if (response.data.success && response.data.data) {
      const { page, images: cmsImages } = response.data.data;
      const content = page?.content || {};

      console.log("CMS Response - Sermons:", { content, cmsImages });

      // Update page title from CMS
      if (content.pageTitle) {
        pageTitle.value = content.pageTitle;
        console.log("Page title from CMS:", content.pageTitle);
      }

      // Update hero title from CMS
      if (content.heroTitle) {
        heroTitle.value = content.heroTitle;
        console.log("Hero title from CMS:", content.heroTitle);
      }

      // Update hero description from CMS
      if (content.heroDescription) {
        heroDescription.value = content.heroDescription;
        console.log("Hero description from CMS:", content.heroDescription);
      }

      // Update background color from CMS
      if (content.backgroundColor) {
        backgroundColor.value = content.backgroundColor;
        console.log("Background color from CMS:", content.backgroundColor);
      }

      // Update sermon archive title from CMS
      if (content.sermonArchiveTitle) {
        sermonArchiveTitle.value = content.sermonArchiveTitle;
        console.log("Sermon archive title from CMS:", content.sermonArchiveTitle);
      }

      // Update sermon archive description from CMS
      if (content.sermonArchiveDescription) {
        sermonArchiveDescription.value = content.sermonArchiveDescription;
        console.log("Sermon archive description from CMS:", content.sermonArchiveDescription);
      }

      // Handle hero image if it exists (stored as BLOB, returned as base64)
      // The image is stored with field_name = 'heroImage' in tbl_cms_images
      if (cmsImages && typeof cmsImages === "object" && cmsImages.heroImage) {
        const heroImageBase64 = cmsImages.heroImage;
        if (
          heroImageBase64 &&
          typeof heroImageBase64 === "string" &&
          heroImageBase64.startsWith("data:image/")
        ) {
          heroImageUrl.value = heroImageBase64;
          console.log(
            "✅ Hero image loaded from CMS (BLOB converted to base64)"
          );
        } else {
          console.log("⚠️ Hero image in CMS is not a valid base64 image");
        }
      } else {
        console.log("ℹ️ No hero image found in CMS");
      }

      console.log("✅ Sermons CMS data loaded successfully");
    } else {
      console.log("⚠️ No CMS data found for Sermons, using defaults");
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error("Error fetching sermons data from CMS:", error);
    } else {
      console.log("CMS page not found (404), using default values");
    }
  }
};

// Fetch sermon events
const fetchSermonEvents = async () => {
  loading.value = true;
  iframeError.value = false;
  embedUrl.value = null;

  try {
    const response = await axios.get("/church-records/events/getSermonEvents");

    if (response.data.success && response.data.data) {
      const events = response.data.data;

      // First ongoing event (with link and within date range) becomes the ongoing event
      if (events.length > 0) {
        ongoingEvent.value = events[0];
        // Convert link to embed URL
        embedUrl.value = convertToEmbedUrl(events[0].link);
      }
    }
  } catch (error) {
    console.error("Error fetching sermon events:", error);
  } finally {
    loading.value = false;
  }
};

// Fetch ministry sermon events (ministries with live links)
const fetchMinistrySermonEvents = async () => {
  try {
    const response = await axios.get("/church-records/ministries/getMinistrySermonEvents");

    if (response.data.success && response.data.data) {
      const ministries = response.data.data;

      // Process ministry data to match sermon format
      const processedMinistries = ministries.map(ministry => ({
        ministry_id: ministry.ministry_id,
        title: ministry.ministry_name,
        description: ministry.description,
        link: ministry.link,
        tags: ministry.tags,
        start_date: ministry.date_created,
        end_date: null,
        imageUrl: ministry.imageUrl,
        image: ministry.image,
        isMinistry: true // Flag to identify ministry sermons
      }));

      // Store all ministry sermons
      allMinistrySermons.value = processedMinistries;

      // If no ongoing event from regular events, try to use first ministry
      if (!ongoingEvent.value && processedMinistries.length > 0) {
        ongoingEvent.value = processedMinistries[0];
        embedUrl.value = convertToEmbedUrl(processedMinistries[0].link);
      }
    }
  } catch (error) {
    console.error("Error fetching ministry sermon events:", error);
  }
};

// Apply sorting to sermons based on sortOrder
const applySermonSorting = () => {
  // Combine regular sermons and ministry sermons
  const combinedSermons = [
    ...allSermons.value,
    ...allMinistrySermons.value
  ];
  
  const sortedEvents = combinedSermons.sort((a, b) => {
    const dateA = new Date(a.end_date || a.start_date || a.date_created);
    const dateB = new Date(b.end_date || b.start_date || b.date_created);
    if (sortOrder.value === 'recent') {
      return dateB - dateA; // Descending (newest first)
    } else {
      return dateA - dateB; // Ascending (oldest first)
    }
  });
  sermons.value = showAllSermons.value ? sortedEvents : sortedEvents.slice(0, 6);
};

// Toggle sort order
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'recent' ? 'oldest' : 'recent';
  applySermonSorting();
};

// Fetch completed sermon events for archive
const fetchCompletedSermonEvents = async () => {
  try {
    const response = await axios.get("/church-records/events/getCompletedSermonEvents");

    if (response.data.success && response.data.data) {
      // Store all sermons
      allSermons.value = response.data.data;
      // Apply sorting and display
      applySermonSorting();
    }
  } catch (error) {
    console.error("Error fetching completed sermon events:", error);
  }
};

// Toggle to show all sermons on the same page
const toggleShowAllSermons = () => {
  showAllSermons.value = !showAllSermons.value;
  applySermonSorting();
};

// Watch for embed URL changes to reset error state
watch(embedUrl, (newUrl) => {
  if (newUrl) {
    iframeError.value = false;
  }
});

// Watch for selected sermon changes
watch(selectedSermon, (newSermon) => {
  if (newSermon && newSermon.link) {
    embedUrl.value = convertToEmbedUrl(newSermon.link);
    iframeError.value = false;
  } else {
    // If no selected sermon, check ongoing event
    if (ongoingEvent.value && ongoingEvent.value.link) {
      embedUrl.value = convertToEmbedUrl(ongoingEvent.value.link);
    } else {
      embedUrl.value = null;
    }
  }
});

// Watch for ongoing event changes
watch(ongoingEvent, (newEvent) => {
  // Only update if no sermon is selected
  if (!selectedSermon.value) {
    if (newEvent && newEvent.link) {
      embedUrl.value = convertToEmbedUrl(newEvent.link);
      iframeError.value = false;
    } else {
      embedUrl.value = null;
    }
  }
});

onMounted(async () => {
  await fetchSermonsData();
  await fetchSermonEvents();
  await fetchMinistrySermonEvents(); // Fetch ministry sermon events
  await fetchCompletedSermonEvents();
});
</script>

<style scoped>
.live-page {
  min-height: 100vh;
  background: white;
  margin-top: 64px;
  position: relative;
  overflow: hidden;
}

.floating-elements {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
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

.hero-section {
  position: relative;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-top: 64px;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 1;
}

.hero-overlay-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(20, 184, 166, 0.9) 0%,
    rgba(6, 182, 212, 0.9) 100%
  );
  z-index: 2;
}

.hero-content-wrapper {
  position: relative;
  z-index: 3;
  text-align: center;
  padding: 60px 20px;
  color: white;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin-bottom: 16px;
  letter-spacing: -0.025em;
  font-family: "Georgia", serif;
  font-style: italic;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.hero-subtitle {
  font-size: 1.25rem;
  color: white;
  opacity: 0.95;
  max-width: 600px;
  margin: 0 auto;
}

.live-stream-section {
  position: relative;
  z-index: 2;
  background: v-bind('backgroundColor');
}

.live-stream-card-custom {
  max-width: 900px;
  width: 100%;
  margin-top: 40px;
}

.bg-gradient-primary {
  background: linear-gradient(to right, #14b8a6, #06b6d4);
}

.live-indicator {
  width: 12px;
  height: 12px;
  background-color: #ef4444;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.stream-container {
  position: relative;
}

.aspect-video {
  aspect-ratio: 16 / 9;
  width: 100%;
}

.sermons-section {
  position: relative;
  z-index: 2;
}

.sermons-grid {
  margin-top: 32px;
}

.sermon-card {
  cursor: pointer;
  border-radius: 12px !important;
  overflow: hidden;
  background: #ffffff !important;
  border: 1px solid #f0f0f0 !important;
  transition: all 0.3s ease;
}

.sermon-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08) !important;
  border-color: #e0e0e0 !important;
}

.sermon-image-wrapper {
  position: relative;
  overflow: hidden;
}

.sermon-image {
  transition: transform 0.4s ease;
}

.sermon-card:hover .sermon-image {
  transform: scale(1.05);
}

.sermon-play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.sermon-card:hover .sermon-play-overlay {
  opacity: 1;
}

.play-icon {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.sermon-content {
  padding: 16px 20px 20px;
  text-align: left;
}

.sermon-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sermon-date {
  font-size: 0.85rem;
  color: #888888;
  font-weight: 400;
  margin: 0;
}

.no-sermons-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
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

.stream-container :deep(.v-btn) {
  transition: all 0.3s ease;
}

.stream-container :deep(.v-btn:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

@media (min-width: 768px) {
  .hero-title {
    font-size: 5rem;
  }
  .hero-subtitle {
    font-size: 1.25rem;
  }
}

@media (max-width: 960px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .events-section {
    padding: 48px 0;
    margin-top: 48px;
    margin-bottom: 48px;
  }

  .events-section :deep(.text-h3) {
    font-size: 1.75rem !important;
  }

  .event-card {
    width: 280px;
  }

  .floating-element {
    display: none;
  }
}
</style>
