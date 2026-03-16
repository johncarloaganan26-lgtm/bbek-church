# How Livestream Works - Simple Link System

This document explains how the livestream system works using a simple **link-based approach** with "live" or "published" status.

---

## The Concept

The livestream system is simple:

1. **Add a link** to any event (YouTube, Facebook, Vimeo)
2. **Set status** to "live" or "published"
3. **System displays it** on the /live page

That's it!

---

## Database Schema (Simple)

```sql
-- Events table with link
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    link VARCHAR(500),    -- THE LIVESTREAM URL
    status VARCHAR(50) DEFAULT 'draft',  -- 'draft', 'live', 'published'
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## How It Works - Step by Step

### Step 1: Admin Adds Link to Event

Admin creates/edits an event and adds a streaming link:

```
Title: Sunday Worship Service
Link: https://www.youtube.com/watch?v=abc123
Status: live
```

### Step 2: System Fetches Events with Links

Backend query:

```sql
SELECT * FROM events
WHERE status IN ('live', 'published')
AND link IS NOT NULL
AND link != '';
```

### Step 3: Frontend Displays the Link

The /live page shows the video player using the link.

---

## Complete Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Admin     │     │  Backend    │     │  Frontend   │
│             │     │             │     │             │
│ 1. Creates  │     │ 2. Fetches  │     │ 3. Shows    │
│    event    │────▶│   events    │────▶│   video     │
│ 2. Adds     │     │    where    │     │    player    │
│    link     │     │ status=live │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## Backend Code (Simple)

### Database Query

```javascript
// Get all events that have a link and are marked as live/published
async function getLiveEvents() {
  const sql = `
        SELECT id, title, description, start_date, end_date, link, status
        FROM events
        WHERE status IN ('live', 'published')
        AND link IS NOT NULL 
        AND link != ''
        ORDER BY start_date DESC
    `;

  const result = await pool.query(sql);
  return result.rows;
}
```

### API Endpoint

```javascript
// GET /api/events/live
router.get("/live", async (req, res) => {
  try {
    const events = await getLiveEvents();
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Frontend Code (Simple)

### Fetch and Display

```javascript
// Vue component script
import axios from "axios";

const events = ref([]);
const currentVideo = ref(null);

// Fetch live events
const fetchLiveEvents = async () => {
  const response = await axios.get("/api/events/live");
  events.value = response.data.data;

  // First event is the current one
  if (events.value.length > 0) {
    currentVideo.value = events.value[0];
  }
};

// Convert link to embed URL
const getEmbedUrl = (link) => {
  // YouTube
  if (link.includes("youtube.com") || link.includes("youtu.be")) {
    const videoId = link.match(/(?:v=|youtu\.be\/)([^&]+)/)[1];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  // Vimeo
  if (link.includes("vimeo.com")) {
    const videoId = link.match(/vimeo\.com\/(\d+)/)[1];
    return `https://player.vimeo.com/video/${videoId}`;
  }
  // Facebook
  if (link.includes("facebook.com")) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(link)}`;
  }
  // Default - open in new window
  return null;
};
```

### Template

```vue
<template>
  <div>
    <!-- Video Player -->
    <div v-if="currentVideo">
      <h2>{{ currentVideo.title }}</h2>

      <!-- Embed Player -->
      <div v-if="getEmbedUrl(currentVideo.link)" class="video-wrapper">
        <iframe
          :src="getEmbedUrl(currentVideo.link)"
          frameborder="0"
          allowfullscreen
        >
        </iframe>
      </div>

      <!-- Fallback: Open in new tab -->
      <a v-else :href="currentVideo.link" target="_blank">
        Watch Live Stream
      </a>
    </div>

    <!-- No Live Streams -->
    <div v-else>
      <p>No live streams available</p>
    </div>

    <!-- Archive List -->
    <div v-if="events.length > 1" class="archive">
      <h3>Past Streams</h3>
      <div
        v-for="event in events.slice(1)"
        :key="event.id"
        @click="currentVideo = event"
      >
        {{ event.title }}
      </div>
    </div>
  </div>
</template>
```

---

## Simple Workflow Summary

| Step | Action                        | Result                  |
| ---- | ----------------------------- | ----------------------- |
| 1    | Admin adds `link` to event    | URL saved in database   |
| 2    | Admin sets `status` to "live" | Event is "active"       |
| 3    | Frontend fetches events       | Gets all live events    |
| 4    | Frontend displays video       | Embeds YouTube/FB/Vimeo |
| 5    | User watches stream           | Video plays in page     |

---

## Key Points

1. **Link is everything** - Without a link, nothing shows
2. **Status controls display** - Only "live" or "published" events show
3. **No date logic** - Events stay live until status changes
4. **Simple conversion** - URL is converted to embed format automatically

---

## Alternative: Even Simpler Version

If you don't even need status:

```sql
-- Just check if link exists
SELECT * FROM events WHERE link IS NOT NULL AND link != '';
```

```javascript
// Just get all events with links
const getAllStreams = async () => {
  const sql = `SELECT * FROM events WHERE link IS NOT NULL AND link != ''`;
  // Returns everything with a link
};
```

That's all there is to it!
