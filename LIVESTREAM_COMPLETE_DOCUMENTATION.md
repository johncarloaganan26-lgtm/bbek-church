# Complete Livestream System Documentation

This document provides everything needed to build the livestream system from scratch, including PostgreSQL schema, API endpoints, and complete code.

---

## Table of Contents

1. [PostgreSQL Database Schema](#postgresql-database-schema)
2. [API Endpoints](#api-endpoints)
3. [Backend Code](#backend-code)
4. [Frontend Code](#frontend-code)
5. [Complete Flow](#complete-flow)

---

## PostgreSQL Database Schema

### 1. Create Events Table

```sql
-- PostgreSQL: Create events table with livestream support
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    location VARCHAR(255),
    link VARCHAR(500),              -- Livestream URL (YouTube, Facebook, Vimeo)
    type VARCHAR(50) DEFAULT 'sermon',  -- 'sermon', 'worship', 'youth', 'special', 'other'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'ongoing', 'completed'
    image BYTEA,                    -- Thumbnail image
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
```

### 2. Create CMS Table for Page Content

```sql
-- PostgreSQL: Create CMS table for sermon page customization
CREATE TABLE cms_sermons (
    id SERIAL PRIMARY KEY,
    page_name VARCHAR(50) UNIQUE DEFAULT 'sermons',
    content JSONB,                  -- Stores all customizable content
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default content
INSERT INTO cms_sermons (page_name, content) VALUES
('sermons', '{
    "heroTitle": "LIVE WORSHIP & SERMONS",
    "heroDescription": "Join us for live worship services, powerful sermons, and spiritual encouragement",
    "backgroundColor": "#ffffff",
    "sermonArchiveTitle": "Sermon Archive",
    "sermonArchiveDescription": "Browse through our collection of past sermons and teachings",
    "heroImage": null
}');
```

### 3. Create Ministries Table (Optional - for ministry streams)

```sql
-- PostgreSQL: Create ministries table with livestream support
CREATE TABLE ministries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    schedule VARCHAR(255),
    link VARCHAR(500),              -- Livestream URL
    tags VARCHAR(500),              -- 'Ministry', 'Worship', etc.
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive'
    image BYTEA,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ministries_status ON ministries(status);
CREATE INDEX idx_ministries_link ON ministries(link);
```

---

## API Endpoints

### Base URL

```
http://localhost:3000/api
```

### Events API

| Method | Endpoint                           | Description                         |
| ------ | ---------------------------------- | ----------------------------------- |
| GET    | `/events/getSermonEvents`          | Get active sermon events (live now) |
| GET    | `/events/getCompletedSermonEvents` | Get past sermon events (archive)    |
| POST   | `/events/save`                     | Create/update event                 |
| GET    | `/events`                          | Get all events                      |
| GET    | `/events/:id`                      | Get single event                    |
| DELETE | `/events/:id`                      | Delete event                        |

### CMS API

| Method | Endpoint            | Description              |
| ------ | ------------------- | ------------------------ |
| GET    | `/cms/sermons`      | Get sermon page content  |
| POST   | `/cms/sermons/save` | Save sermon page content |

### Ministries API (Optional)

| Method | Endpoint                              | Description                     |
| ------ | ------------------------------------- | ------------------------------- |
| GET    | `/ministries/getMinistrySermonEvents` | Get ministries with livestreams |

---

## Backend Code

### 1. Database Connection (PostgreSQL)

```javascript
// db.js - PostgreSQL connection using pg library
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "bbek_app",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
});

const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query", {
    text: text.substring(0, 50),
    duration,
    rows: res.rowCount,
  });
  return res;
};

module.exports = { pool, query };
```

### 2. Event Records Helper

```javascript
// eventRecords.js - Complete backend logic

const { query } = require("../db");

// Convert blob to base64
function convertBlobToBase64(blob) {
  if (!blob) return null;
  if (Buffer.isBuffer(blob)) {
    return blob.toString("base64");
  }
  return null;
}

/**
 * Auto-update event statuses based on date/time
 * pending -> ongoing (when start_date <= now <= end_date)
 * ongoing -> completed (when end_date < now)
 */
async function autoUpdateEventStatuses() {
  // Pending -> Ongoing
  await query(`
    UPDATE events 
    SET status = 'ongoing', updated_at = NOW()
    WHERE status = 'pending' 
      AND start_date <= NOW() 
      AND end_date >= NOW()
  `);

  // Ongoing -> Completed
  await query(`
    UPDATE events 
    SET status = 'completed', updated_at = NOW()
    WHERE status = 'ongoing' 
      AND end_date < NOW()
  `);
}

/**
 * Get active sermon events (for livestream page)
 * Returns events where:
 * - type = 'sermon'
 * - status != 'pending'
 * - link is not empty
 * - end_date >= now (not expired)
 * Sorted by ongoing first, then by latest date
 */
async function getSermonEvents() {
  await autoUpdateEventStatuses();

  const sql = `
    SELECT id, title, description, start_date, end_date, location, link, type, status, image
    FROM events
    WHERE type = 'sermon'
      AND status != 'pending'
      AND link IS NOT NULL 
      AND link != ''
      AND end_date >= NOW()
    ORDER BY 
      CASE WHEN status = 'ongoing' THEN 0 ELSE 1 END,
      start_date DESC
  `;

  const result = await query(sql);

  // Process rows - convert image blob to base64 URL
  const processedEvents = result.rows.map((event) => {
    const processed = { ...event };

    // Convert image to base64 URL
    if (event.image) {
      const base64 = convertBlobToBase64(event.image);
      if (base64) {
        processed.imageUrl = `data:image/jpeg;base64,${base64}`;
        processed.image = base64;
      }
    }

    return processed;
  });

  return {
    success: true,
    message: "Sermon events retrieved successfully",
    data: processedEvents,
    count: processedEvents.length,
  };
}

/**
 * Get completed sermon events (archive)
 * Returns events where:
 * - status = 'completed'
 * - link is not empty
 * - end_date < now (has ended)
 * Sorted by end_date descending (newest first)
 */
async function getCompletedSermonEvents() {
  const sql = `
    SELECT id, title, description, start_date, end_date, location, link, type, status, image
    FROM events
    WHERE status = 'completed'
      AND link IS NOT NULL 
      AND link != ''
      AND end_date < NOW()
    ORDER BY end_date DESC
  `;

  const result = await query(sql);

  const processedEvents = result.rows.map((event) => {
    const processed = { ...event };

    if (event.image) {
      const base64 = convertBlobToBase64(event.image);
      if (base64) {
        processed.imageUrl = `data:image/jpeg;base64,${base64}`;
        processed.image = base64;
      }
    }

    return processed;
  });

  return {
    success: true,
    message: "Completed sermon events retrieved successfully",
    data: processedEvents,
    count: processedEvents.length,
  };
}

/**
 * Save event (create or update)
 */
async function saveEvent(eventData) {
  const {
    id,
    title,
    description,
    start_date,
    end_date,
    location,
    link,
    type,
    status,
    image,
  } = eventData;

  if (id) {
    // Update existing
    const sql = `
      UPDATE events 
      SET title = $1, description = $2, start_date = $3, end_date = $4, 
          location = $5, link = $6, type = $7, status = $8, image = $9, updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `;
    const result = await query(sql, [
      title,
      description,
      start_date,
      end_date,
      location,
      link,
      type,
      status,
      image,
      id,
    ]);
    return { success: true, data: result.rows[0] };
  } else {
    // Create new
    const sql = `
      INSERT INTO events (title, description, start_date, end_date, location, link, type, status, image)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await query(sql, [
      title,
      description,
      start_date,
      end_date,
      location,
      link,
      type || "sermon",
      status || "pending",
      image,
    ]);
    return { success: true, data: result.rows[0] };
  }
}

/**
 * Delete event
 */
async function deleteEvent(id) {
  const sql = `DELETE FROM events WHERE id = $1 RETURNING *`;
  const result = await query(sql, [id]);
  return { success: true, data: result.rows[0] };
}

/**
 * Get all events
 */
async function getAllEvents() {
  const sql = `
    SELECT * FROM events 
    ORDER BY start_date DESC
  `;
  const result = await query(sql);
  return { success: true, data: result.rows };
}

/**
 * Get single event
 */
async function getEventById(id) {
  const sql = `SELECT * FROM events WHERE id = $1`;
  const result = await query(sql, [id]);
  return { success: true, data: result.rows[0] };
}

module.exports = {
  getSermonEvents,
  getCompletedSermonEvents,
  saveEvent,
  deleteEvent,
  getAllEvents,
  getEventById,
  autoUpdateEventStatuses,
};
```

### 3. Express Routes

```javascript
// events.js - Express router for events

const express = require("express");
const router = express.Router();
const {
  getSermonEvents,
  getCompletedSermonEvents,
  saveEvent,
  deleteEvent,
  getAllEvents,
  getEventById,
} = require("../dbHelpers/eventRecords");

/**
 * GET /api/events/getSermonEvents
 * Get active sermon events (live now)
 */
router.get("/getSermonEvents", async (req, res) => {
  try {
    const result = await getSermonEvents();
    res.json(result);
  } catch (error) {
    console.error("Error fetching sermon events:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/events/getCompletedSermonEvents
 * Get past sermon events (archive)
 */
router.get("/getCompletedSermonEvents", async (req, res) => {
  try {
    const result = await getCompletedSermonEvents();
    res.json(result);
  } catch (error) {
    console.error("Error fetching completed sermon events:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/events/save
 * Create or update event
 */
router.post("/save", async (req, res) => {
  try {
    const eventData = req.body;
    const result = await saveEvent(eventData);
    res.json(result);
  } catch (error) {
    console.error("Error saving event:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/events
 * Get all events
 */
router.get("/", async (req, res) => {
  try {
    const result = await getAllEvents();
    res.json(result);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/events/:id
 * Get single event
 */
router.get("/:id", async (req, res) => {
  try {
    const result = await getEventById(req.params.id);
    res.json(result);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/events/:id
 * Delete event
 */
router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteEvent(req.params.id);
    res.json(result);
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

### 4. Main Server File

```javascript
// index.js - Main Express server

const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
const eventsRouter = require("./routes/events");
const cmsRouter = require("./routes/cms");

app.use("/api/events", eventsRouter);
app.use("/api/cms", cmsRouter);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Frontend Code

### 1. Live Stream Page (Vue Component)

```vue
<!-- LiveStream.vue - Complete livestream page -->

<template>
  <div class="live-page">
    <!-- Hero Section -->
    <section
      class="hero-section"
      :style="{ backgroundImage: `url(${heroImage})` }"
    >
      <div class="hero-overlay">
        <h1>{{ heroTitle }}</h1>
        <p>{{ heroDescription }}</p>
      </div>
    </section>

    <!-- Live Stream Section -->
    <section class="live-stream-section">
      <v-container>
        <v-card class="live-stream-card" elevation="4">
          <!-- Card Header -->
          <v-card-title class="bg-blue-darken-4 text-white">
            <v-row align="center">
              <v-col cols="12" md="8">
                <h3>{{ currentTitle }}</h3>
                <p class="text-caption">{{ currentSubtitle }}</p>
              </v-col>
              <v-col cols="12" md="4" class="text-right">
                <v-chip v-if="ongoingEvent" color="red" variant="flat">
                  <v-icon start>mdi-circle</v-icon>
                  LIVE
                </v-chip>
              </v-col>
            </v-row>
          </v-card-title>

          <!-- Video Player -->
          <v-card-text>
            <div v-if="ongoingEvent && embedUrl" class="video-wrapper">
              <iframe
                :src="embedUrl"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              ></iframe>
            </div>

            <!-- No Live Stream -->
            <div v-else class="no-stream text-center py-10">
              <v-icon size="80" color="grey">mdi-video-off</v-icon>
              <h3 class="mt-4">No live stream at the moment</h3>
              <p>Please check back during our service times.</p>
            </div>
          </v-card-text>
        </v-card>
      </v-container>
    </section>

    <!-- Sermon Archive Section -->
    <section
      class="archive-section py-10"
      :style="{ backgroundColor: backgroundColor }"
    >
      <v-container>
        <h2 class="text-center mb-2">{{ sermonArchiveTitle }}</h2>
        <p class="text-center mb-8">{{ sermonArchiveDescription }}</p>

        <!-- Sermon Grid -->
        <v-row v-if="sermons.length > 0">
          <v-col
            v-for="sermon in sermons"
            :key="sermon.id"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card class="sermon-card" @click="playSermon(sermon)">
              <div class="sermon-thumbnail">
                <v-img
                  :src="sermon.imageUrl || '/img/default-sermon.jpg'"
                  aspect-ratio="16/9"
                  cover
                ></v-img>
                <div class="play-overlay">
                  <v-icon size="48" color="white">mdi-play-circle</v-icon>
                </div>
              </div>
              <v-card-text>
                <h4>{{ sermon.title }}</h4>
                <p class="text-grey">{{ formatDate(sermon.start_date) }}</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- No Sermons -->
        <div v-else class="text-center py-10">
          <v-icon size="60" color="grey-lighten-1">mdi-video-off</v-icon>
          <p class="mt-4">No sermon recordings available yet.</p>
        </div>
      </v-container>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

// CMS Content
const heroTitle = ref("LIVE WORSHIP & SERMONS");
const heroDescription = ref("Join us for live worship services");
const heroImage = ref("/img/bible.jpg");
const backgroundColor = ref("#f5f5f5");
const sermonArchiveTitle = ref("Sermon Archive");
const sermonArchiveDescription = ref("Browse our past sermons");

// Events
const ongoingEvent = ref(null);
const sermons = ref([]);
const selectedSermon = ref(null);
const embedUrl = ref("");
const loading = ref(false);

// Current display
const currentTitle = computed(() => {
  if (selectedSermon.value) return selectedSermon.value.title;
  if (ongoingEvent.value) return ongoingEvent.value.title;
  return "Sunday Morning Service";
});

const currentSubtitle = computed(() => {
  if (selectedSermon.value) return formatDate(selectedSermon.value.start_date);
  if (ongoingEvent.value) return formatDate(ongoingEvent.value.start_date);
  return "Every Sunday at 9:00 AM";
});

// Convert streaming URL to embed URL
const convertToEmbedUrl = (url) => {
  if (!url) return "";

  try {
    // YouTube - watch?v=ID
    const ytMatch1 = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (ytMatch1) return `https://www.youtube.com/embed/${ytMatch1[1]}`;

    // YouTube - youtu.be/ID
    const ytMatch2 = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (ytMatch2) return `https://www.youtube.com/embed/${ytMatch2[1]}`;

    // YouTube Live
    const ytLive = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
    if (ytLive) return `https://www.youtube.com/embed/${ytLive[1]}`;

    // Facebook
    if (url.includes("facebook.com/")) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    // Return original - will open in new window
    return url;
  } catch (e) {
    console.error("Error converting URL:", e);
    return url;
  }
};

// Fetch sermon events (live)
const fetchSermonEvents = async () => {
  loading.value = true;
  try {
    const response = await axios.get("/api/events/getSermonEvents");
    if (response.data.success && response.data.data.length > 0) {
      ongoingEvent.value = response.data.data[0];
      embedUrl.value = convertToEmbedUrl(ongoingEvent.value.link);
    }
  } catch (error) {
    console.error("Error fetching sermon events:", error);
  } finally {
    loading.value = false;
  }
};

// Fetch completed sermons (archive)
const fetchCompletedSermons = async () => {
  try {
    const response = await axios.get("/api/events/getCompletedSermonEvents");
    if (response.data.success) {
      sermons.value = response.data.data;
    }
  } catch (error) {
    console.error("Error fetching completed sermons:", error);
  }
};

// Fetch CMS content
const fetchCmsContent = async () => {
  try {
    const response = await axios.get("/api/cms/sermons");
    if (response.data.success && response.data.data) {
      const content = response.data.data.content;
      if (content.heroTitle) heroTitle.value = content.heroTitle;
      if (content.heroDescription)
        heroDescription.value = content.heroDescription;
      if (content.backgroundColor)
        backgroundColor.value = content.backgroundColor;
      if (content.sermonArchiveTitle)
        sermonArchiveTitle.value = content.sermonArchiveTitle;
      if (content.sermonArchiveDescription)
        sermonArchiveDescription.value = content.sermonArchiveDescription;
      if (content.heroImage) heroImage.value = content.heroImage;
    }
  } catch (error) {
    console.error("Error fetching CMS:", error);
  }
};

// Play a sermon
const playSermon = (sermon) => {
  selectedSermon.value = sermon;
  embedUrl.value = convertToEmbedUrl(sermon.link);
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Initialize
onMounted(() => {
  fetchSermonEvents();
  fetchCompletedSermons();
  fetchCmsContent();
});
</script>

<style scoped>
.hero-section {
  height: 400px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  text-align: center;
}

.hero-overlay h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.live-stream-card {
  max-width: 900px;
  margin: -50px auto 0;
  position: relative;
  z-index: 1;
}

.video-wrapper {
  aspect-ratio: 16/9;
}

.video-wrapper iframe {
  width: 100%;
  height: 100%;
}

.sermon-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.sermon-card:hover {
  transform: translateY(-4px);
}

.sermon-thumbnail {
  position: relative;
  overflow: hidden;
}

.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.sermon-card:hover .play-overlay {
  opacity: 1;
}
</style>
```

### 2. Event Form Component

```vue
<!-- EventForm.vue - For creating/editing events with livestream -->

<template>
  <v-dialog v-model="dialog" max-width="600" persistent>
    <v-card>
      <v-card-title>
        {{ isEdit ? "Edit Event" : "Add Event" }}
      </v-card-title>

      <v-card-text>
        <v-form ref="form">
          <!-- Title -->
          <v-text-field
            v-model="formData.title"
            label="Event Title"
            :rules="[(v) => !!v || 'Title is required']"
          ></v-text-field>

          <!-- Description -->
          <v-textarea
            v-model="formData.description"
            label="Description"
            rows="3"
          ></v-textarea>

          <!-- Start Date -->
          <v-text-field
            v-model="formData.start_date"
            label="Start Date & Time"
            type="datetime-local"
            :rules="[(v) => !!v || 'Start date is required']"
          ></v-text-field>

          <!-- End Date -->
          <v-text-field
            v-model="formData.end_date"
            label="End Date & Time"
            type="datetime-local"
            :rules="[(v) => !!v || 'End date is required']"
          ></v-text-field>

          <!-- Location -->
          <v-text-field
            v-model="formData.location"
            label="Location"
          ></v-text-field>

          <!-- Event Type -->
          <v-select
            v-model="formData.type"
            :items="eventTypes"
            label="Event Type"
          ></v-select>

          <!-- Status -->
          <v-select
            v-model="formData.status"
            :items="statuses"
            label="Status"
          ></v-select>

          <!-- Livestream Link -->
          <v-text-field
            v-model="formData.link"
            label="Livestream Link"
            placeholder="https://www.youtube.com/watch?v=..."
            prepend-inner-icon="mdi-link"
            hint="Enter YouTube, Facebook Live, or Vimeo URL"
            persistent-hint
          ></v-text-field>

          <!-- Image Upload -->
          <v-file-input
            v-model="imageFile"
            label="Event Image"
            accept="image/*"
            prepend-icon="mdi-camera"
            @change="handleImageUpload"
          ></v-file-input>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="close">Cancel</v-btn>
        <v-btn color="primary" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import axios from "axios";

const props = defineProps({
  modelValue: Boolean,
  event: Object,
});

const emit = defineEmits(["update:modelValue", "saved"]);

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.event?.id);
const form = ref(null);
const imageFile = ref(null);

const formData = ref({
  title: "",
  description: "",
  start_date: "",
  end_date: "",
  location: "",
  type: "sermon",
  status: "pending",
  link: "",
  image: null,
});

const eventTypes = [
  { title: "Sermon", value: "sermon" },
  { title: "Worship", value: "worship" },
  { title: "Youth", value: "youth" },
  { title: "Special", value: "special" },
  { title: "Other", value: "other" },
];

const statuses = [
  { title: "Pending", value: "pending" },
  { title: "Ongoing", value: "ongoing" },
  { title: "Completed", value: "completed" },
];

// Watch for event prop changes
watch(
  () => props.event,
  (newEvent) => {
    if (newEvent) {
      formData.value = { ...newEvent };
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

const handleImageUpload = (file) => {
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Convert to base64
      const base64 = e.target.result.split(",")[1];
      formData.value.image = base64;
    };
    reader.readAsDataURL(file);
  }
};

const save = async () => {
  try {
    const response = await axios.post("/api/events/save", formData.value);
    if (response.data.success) {
      emit("saved");
      close();
    }
  } catch (error) {
    console.error("Error saving event:", error);
  }
};

const close = () => {
  resetForm();
  dialog.value = false;
};

const resetForm = () => {
  formData.value = {
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    location: "",
    type: "sermon",
    status: "pending",
    link: "",
    image: null,
  };
  imageFile.value = null;
};
</script>
```

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            COMPLETE FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

1. ADMIN CREATES EVENT
   ┌──────────────────┐
   │  Admin Panel     │
   │  Events Page    │
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────────────┐
   │  Fill Form:             │
   │  - Title                │
   │  - Type: sermon         │
   │  - Start/End Date       │
   │  - Link: YouTube URL    │
   └────────┬─────────────────┘
            │
            ▼ POST /api/events/save
   ┌──────────────────────────┐
   │  Express Server         │
   │  (Node.js)              │
   └────────┬─────────────────┘
            │
            ▼
   ┌──────────────────────────┐
   │  PostgreSQL Database    │
   │  events table          │
   │  (link: 'youtube...')  │
   └──────────────────────────┘

2. VISITOR LOADS LIVE PAGE
   ┌──────────────────┐
   │  Visitor         │
   │  visits /live   │
   └────────┬─────────┘
            │
            ▼ GET /api/events/getSermonEvents
   ┌──────────────────────────┐
   │  Express Server         │
   └────────┬─────────────────┘
            │
            ▼
   ┌──────────────────────────┐
   │  autoUpdateEventStatus │
   │  (pending -> ongoing)   │
   └────────┬─────────────────┘
            │
            ▼
   ┌──────────────────────────┐
   │  Query:                │
   │  type='sermon'         │
   │  status='ongoing'      │
   │  link IS NOT NULL      │
   └────────┬─────────────────┘
            │
            ▼
   ┌──────────────────────────┐
   │  Return event data      │
   │  with streaming link    │
   └────────┬─────────────────┘
            │
            ▼
   ┌──────────────────────────┐
   │  Frontend Vue           │
   │  convertToEmbedUrl()    │
   └────────┬─────────────────┘
            │
            ▼
   ┌──────────────────────────┐
   │  Display iframe with    │
   │  YouTube embed URL     │
   └──────────────────────────┘

3. EVENT ENDS - MOVES TO ARCHIVE
   ┌──────────────────────────┐
   │  Background Job          │
   │  autoUpdateEventStatus │
   │  (ongoing -> completed) │
   └────────┬─────────────────┘
            │
            ▼ GET /api/events/getCompletedSermonEvents
   ┌──────────────────────────┐
   │  Returns completed      │
   │  events for archive    │
   └──────────────────────────┘
            │
            ▼
   ┌──────────────────────────┐
   │  Display in sermon     │
   │  archive grid          │
   └──────────────────────────┘
```

---

## Summary

### Files to Create

| File                  | Purpose                      |
| --------------------- | ---------------------------- |
| `database/schema.sql` | PostgreSQL table definitions |
| `db/eventRecords.js`  | Database operations          |
| `routes/events.js`    | API endpoints                |
| `index.js`            | Express server               |
| `LiveStream.vue`      | Frontend livestream page     |
| `EventForm.vue`       | Event creation form          |

### Key Endpoints

| Endpoint                               | Method | Description     |
| -------------------------------------- | ------ | --------------- |
| `/api/events/getSermonEvents`          | GET    | Get live events |
| `/api/events/getCompletedSermonEvents` | GET    | Get archive     |
| `/api/events/save`                     | POST   | Create/update   |
| `/api/events/:id`                      | DELETE | Delete          |

### Database Tables

- `events` - Main events table with link field
- `cms_sermons` - Page customization
- `ministries` - Optional ministry streams
