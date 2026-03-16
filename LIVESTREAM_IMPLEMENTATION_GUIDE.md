# How to Build Livestream Functionality - Developer Guide

This guide explains how to CREATE the livestream feature from scratch.

---

## Step 1: Add Link Column to Events Table

Create a SQL migration file:

```sql
-- be/database/add_link_to_events.sql
ALTER TABLE tbl_events ADD COLUMN link VARCHAR(500) NULL COMMENT 'Streaming URL (YouTube, Facebook Live, etc.)';
```

Run this SQL in your database.

---

## Step 2: Create Backend API Functions

### 2a. Add to eventRecords.js

```javascript
// be/dbHelpers/church_records/eventRecords.js

/**
 * Get sermon events (active/ongoing) for livestream
 */
async function getSermonEvents() {
  try {
    // Auto-update event statuses based on dates
    await autoUpdateEventStatuses();

    const sql = `
      SELECT * FROM tbl_events
      WHERE type = 'sermon'
        AND status != 'pending'
        AND (link IS NOT NULL AND link != '')
        AND end_date >= NOW()
      ORDER BY 
        CASE WHEN status = 'ongoing' THEN 0 ELSE 1 END,
        start_date DESC
    `;

    const [rows] = await query(sql);

    // Process rows (convert image blob to base64, etc.)
    const processedRows = rows.map((event) => {
      const processedEvent = { ...event };

      // Convert image blob to base64 URL
      if (event.image && Buffer.isBuffer(event.image)) {
        processedEvent.imageUrl = `data:image/jpeg;base64,${event.image.toString("base64")}`;
      }

      return processedEvent;
    });

    return {
      success: true,
      message: "Sermon events retrieved successfully",
      data: processedRows,
      count: processedRows.length,
    };
  } catch (error) {
    console.error("Error fetching sermon events:", error);
    throw error;
  }
}

/**
 * Get completed sermon events (archive)
 */
async function getCompletedSermonEvents() {
  try {
    const sql = `
      SELECT * FROM tbl_events
      WHERE status = 'completed'
        AND link IS NOT NULL
        AND link != ''
        AND end_date < NOW()
      ORDER BY end_date DESC
    `;

    const [rows] = await query(sql);

    return {
      success: true,
      message: "Completed sermon events retrieved successfully",
      data: rows,
      count: rows.length,
    };
  } catch (error) {
    console.error("Error fetching completed sermon events:", error);
    throw error;
  }
}

/**
 * Auto-update event statuses based on date/time
 */
async function autoUpdateEventStatuses() {
  try {
    // Pending -> Ongoing (event has started)
    await query(`
      UPDATE tbl_events 
      SET status = 'ongoing' 
      WHERE status = 'pending' 
        AND start_date <= NOW() 
        AND end_date >= NOW()
    `);

    // Ongoing -> Completed (event has ended)
    await query(`
      UPDATE tbl_events 
      SET status = 'completed' 
      WHERE status = 'ongoing' 
        AND end_date < NOW()
    `);
  } catch (error) {
    console.error("Error auto-updating event statuses:", error);
  }
}

module.exports = {
  getSermonEvents,
  getCompletedSermonEvents,
  autoUpdateEventStatuses,
};
```

### 2b. Add Routes

```javascript
// be/routes/church_records/eventRoutes.js

const {
  getSermonEvents,
  getCompletedSermonEvents,
} = require("../dbHelpers/church_records/eventRecords");

// Get active sermon events
router.get("/getSermonEvents", async (req, res) => {
  try {
    const result = await getSermonEvents();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching sermon events:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get completed sermon events (archive)
router.get("/getCompletedSermonEvents", async (req, res) => {
  try {
    const result = await getCompletedSermonEvents();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching completed sermon events:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## Step 3: Create Frontend Live Page

Create a new Vue component:

```vue
<!-- fe/src/components/LiveStream.vue -->

<template>
  <div class="live-page">
    <!-- Hero Section -->
    <section class="hero">
      <h1>Live Worship & Sermons</h1>
      <p>Join us for live worship services</p>
    </section>

    <!-- Live Stream Card -->
    <section class="live-stream" v-if="ongoingEvent">
      <div class="live-indicator">LIVE</div>
      <h2>{{ ongoingEvent.title }}</h2>

      <!-- Video Player -->
      <div class="video-container">
        <iframe :src="embedUrl" frameborder="0" allowfullscreen> </iframe>
      </div>
    </section>

    <!-- No Live Stream -->
    <div v-else class="no-stream">
      <p>No live stream at the moment.</p>
    </div>

    <!-- Sermon Archive -->
    <section class="archive">
      <h2>Sermon Archive</h2>
      <div class="sermon-grid">
        <div
          v-for="sermon in sermons"
          :key="sermon.event_id"
          class="sermon-card"
          @click="playSermon(sermon)"
        >
          <img :src="sermon.imageUrl || '/default.jpg'" />
          <h3>{{ sermon.title }}</h3>
          <p>{{ formatDate(sermon.start_date) }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const ongoingEvent = ref(null);
const sermons = ref([]);
const embedUrl = ref("");

// Convert URL to embed format
const convertToEmbedUrl = (url) => {
  if (!url) return "";

  // YouTube
  const ytMatch = url.match(/(?:watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // Facebook
  if (url.includes("facebook.com/")) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // Return as-is (will open in new window)
  return url;
};

// Fetch sermon events
const fetchSermonEvents = async () => {
  try {
    const response = await axios.get(
      "/api/church-records/events/getSermonEvents",
    );
    if (response.data.success && response.data.data.length > 0) {
      ongoingEvent.value = response.data.data[0];
      embedUrl.value = convertToEmbedUrl(ongoingEvent.value.link);
    }
  } catch (error) {
    console.error("Error fetching sermon events:", error);
  }
};

// Fetch archive
const fetchArchive = async () => {
  try {
    const response = await axios.get(
      "/api/church-records/events/getCompletedSermonEvents",
    );
    if (response.data.success) {
      sermons.value = response.data.data;
    }
  } catch (error) {
    console.error("Error fetching archive:", error);
  }
};

// Play sermon
const playSermon = (sermon) => {
  ongoingEvent.value = sermon;
  embedUrl.value = convertToEmbedUrl(sermon.link);
};

// Format date
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString();
};

onMounted(() => {
  fetchSermonEvents();
  fetchArchive();
});
</script>

<style scoped>
.live-indicator {
  background: red;
  color: white;
  padding: 5px 10px;
  display: inline-block;
  animation: pulse 1s infinite;
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

.video-container {
  aspect-ratio: 16/9;
}

.video-container iframe {
  width: 100%;
  height: 100%;
}

.sermon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.sermon-card {
  cursor: pointer;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.sermon-card:hover {
  transform: translateY(-4px);
}
</style>
```

---

## Step 4: Add URL to Router

```javascript
// fe/src/router/index.js (or wherever routes are defined)

{
  path: '/live',
  name: 'Live',
  component: () => import('../components/LiveStream.vue')
}
```

---

## Step 5: Add Link Field to Event Form

In your event creation dialog (EventRecordsDialog.vue):

```vue
<template>
  <v-dialog>
    <v-form>
      <!-- Other fields... -->

      <!-- Livestream Link -->
      <v-text-field
        v-model="formData.link"
        label="Livestream Link"
        placeholder="Enter YouTube, Facebook Live, or Vimeo URL"
        prepend-icon="mdi-link"
      ></v-text-field>

      <!-- Event Type -->
      <v-select
        v-model="formData.type"
        :items="['sermon', 'worship', 'youth', 'special', 'other']"
        label="Event Type"
      ></v-select>
    </v-form>
  </v-dialog>
</template>
```

---

## Step 6: Add Navigation Link

```vue
<!-- In your Navigation component -->

<template>
  <nav>
    <router-link to="/live">Sermons</router-link>
  </nav>
</template>
```

---

## Summary: Files to Create/Modify

| File                              | Action                                 |
| --------------------------------- | -------------------------------------- |
| `database/add_link_to_events.sql` | Create - add link column               |
| `dbHelpers/eventRecords.js`       | Modify - add getSermonEvents functions |
| `routes/eventRoutes.js`           | Modify - add API endpoints             |
| `components/LiveStream.vue`       | Create - new page component            |
| `router/index.js`                 | Modify - add /live route               |
| `EventRecordsDialog.vue`          | Modify - add link input field          |
| `Navigation.vue`                  | Modify - add menu link                 |

---

## That's It!

After implementing these steps:

1. Admins can add streaming links to events
2. The /live page shows current livestream
3. After events end, they appear in archive
4. Visitors can watch live or past sermons
