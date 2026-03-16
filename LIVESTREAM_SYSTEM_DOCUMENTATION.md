# Livestream System Documentation

This document provides a comprehensive overview of how the livestream functionality works in the BBEK (Baptist Church Management) system.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Data Architecture](#data-architecture)
3. [API Endpoints](#api-endpoints)
4. [Frontend Components](#frontend-components)
5. [URL Conversion System](#url-conversion-system)
6. [Event Status Management](#event-status-management)
7. [CMS Integration](#cms-integration)
8. [User Flow](#user-flow)
9. [Database Schema](#database-schema)
10. [Supported Streaming Platforms](#supported-streaming-platforms)

---

## System Overview

The livestream system in this application is designed to:

1. **Stream live worship services** during scheduled events
2. **Archive past sermons** for on-demand viewing
3. **Support multiple streaming sources** (YouTube, Facebook Live, Vimeo, etc.)
4. **Provide CMS-controlled page customization** for sermon pages

The system leverages two primary data sources for livestream content:
- **Events** - For scheduled worship services and sermon events
- **Ministries** - For ministry-specific live streams (e.g., worship team, youth ministry)

---

## Data Architecture

### Event-Based Livestream

Livestreams can be created through the Events system with the following characteristics:

| Field | Description |
|-------|-------------|
| `title` | Name of the service/event |
| `description` | Event details |
| `start_date` | When the event begins |
| `end_date` | When the event ends |
| `link` | **Streaming URL** (YouTube Live, Facebook Live, etc.) |
| `type` | Set to `'sermon'` for sermon events |
| `status` | `'ongoing'` (live) or `'completed'` (archive) |
| `image` | Thumbnail image for the sermon card |

### Ministry-Based Livestream

Ministries can also have live streaming links for their own services:

| Field | Description |
|-------|-------------|
| `ministry_name` | Name of the ministry |
| `description` | Ministry description |
| `schedule` | Schedule information |
| `link` | **Live streaming URL** |
| `tags` | Tags for filtering (e.g., "Ministry", "Worship") |
| `status` | Must be `'active'` for streaming |
| `image` | Ministry thumbnail image |

---

## API Endpoints

### Event-Related Endpoints

#### 1. Get Active Sermon Events
```
GET /api/church-records/events/getSermonEvents
```

Returns sermon events that are:
- Not pending approval
- Within their scheduled date/time (auto-updated)
- Sorted by ongoing status first, then by latest date

**Response:**
```json
{
  "success": true,
  "message": "Sermon events retrieved successfully",
  "data": [
    {
      "event_id": 1,
      "title": "Sunday Worship Service",
      "description": "Weekly Sunday worship",
      "start_date": "2026-03-08T09:00:00Z",
      "end_date": "2026-03-08T11:00:00Z",
      "link": "https://www.youtube.com/watch?v=abc123",
      "type": "sermon",
      "status": "ongoing",
      "imageUrl": "data:image/jpeg;base64,..."
    }
  ],
  "count": 1
}
```

#### 2. Get Completed Sermon Events (Archive)
```
GET /api/church-records/events/getCompletedSermonEvents
```

Returns past sermon events that:
- Have `status = 'completed'`
- Have a non-empty `link` field
- Have ended (end_date < NOW())

Sorted by end_date in descending order (newest first).

### Ministry-Related Endpoints

#### 3. Get Active Ministry Sermon Events
```
GET /api/church-records/ministries/getMinistrySermonEvents
```

Returns active ministries that have:
- `status = 'active'`
- A non-empty `link` field

**Response:**
```json
{
  "success": true,
  "message": "Ministry sermon events retrieved successfully",
  "data": [
    {
      "ministry_id": 1,
      "ministry_name": "Worship Ministry",
      "schedule": "Sunday 9:00 AM",
      "description": "Worship team service",
      "link": "https://www.youtube.com/watch?v=xyz789",
      "tags": "Ministry,Worship",
      "imageUrl": "data:image/jpeg;base64,...",
      "isMinistry": true
    }
  ],
  "count": 1
}
```

#### 4. Get Completed Ministry Sermon Events
```
GET /api/church-records/ministries/getCompletedMinistrySermonEvents
```

Returns all ministries with links regardless of schedule (for archive display).

### CMS Endpoints

#### 5. Get Sermons CMS Content
```
GET /api/cms/sermons/full
```

Returns customizable content for the sermons page including:
- Page title
- Hero section (title, description, background color)
- Hero image
- Archive section (title, description)

---

## Frontend Components

### Main Components

#### 1. Live.vue (Landing Page)
**Location:** `fe/src/components/LandingPage/Live.vue`

This is the main livestream page visible to visitors. It includes:

- **Hero Section** - Customizable banner with title and description
- **Live Stream Card** - Main video player area showing:
  - Current live stream or selected sermon
  - Live indicator (pulsing red dot) for ongoing streams
  - Ministry badge for ministry-specific streams
- **Sermon Archive Grid** - Cards showing past sermons

**Key Features:**
- Automatic detection of ongoing events
- URL embedding for various streaming platforms
- Fallback to external browser window if embed fails
- Sorting (newest/oldest) for archive
- Expandable archive view

#### 2. MinistryDialog.vue (Admin)
**Location:** `fe/src/components/Dialogs/MinistryDialog.vue`

Admin interface for adding/editing ministry streaming links:

```vue
<v-text-field
  v-model="formData.link"
  placeholder="Enter live streaming URL (YouTube Live, Facebook Live, etc.)"
  size="large"
/>
```

#### 3. EventRecordsDialog.vue (Admin)
**Location:** `fe/src/components/Dialogs/EventRecordsDialog.vue`

Admin interface for creating sermon events:

```vue
<v-text-field
  v-model="formData.link"
  placeholder="Enter live stream link (optional)"
  size="large"
/>
```

#### 4. Sermons.vue (Admin CMS)
**Location:** `fe/src/components/Admin/Maintenance/ListItems/Sermons.vue`

Admin interface for customizing the sermons page content including:
- Hero image upload
- Page title
- Hero title and description
- Background color
- Archive section title and description

---

## URL Conversion System

The system automatically converts various streaming URLs to embeddable formats for iframe playback.

### Supported Conversions

#### YouTube
| Original | Embedded |
|----------|----------|
| `https://www.youtube.com/watch?v=abc123` | `https://www.youtube.com/embed/abc123` |
| `https://youtu.be/abc123` | `https://www.youtube.com/embed/abc123` |
| `https://www.youtube.com/live/abc123` | `https://www.youtube.com/embed/abc123` |

#### Facebook Live
| Original | Embedded |
|----------|----------|
| `https://www.facebook.com/page/videos/vl.123/` | `https://www.facebook.com/plugins/video.php?href=...` |

#### Vimeo
| Original | Embedded |
|----------|----------|
| `https://vimeo.com/123456789` | `https://player.vimeo.com/video/123456789` |

### Implementation

```javascript
// From fe/src/components/LandingPage/Live.vue
const convertToEmbedUrl = (url) => {
  if (!url) return null;
  
  try {
    // YouTube patterns
    const youtubePatterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of youtubePatterns) {
      const match = url.match(pattern);
      if (match) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }
    
    // Facebook Live
    if (url.includes('facebook.com/')) {
      const encodedUrl = encodeURIComponent(url);
      return `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=0`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    // Return original if no match (will open in new window)
    return url;
  } catch (error) {
    console.error("Error converting URL to embed:", error);
    return null;
  }
};
```

### Fallback Behavior

If the iframe fails to load, the system provides a fallback:

```vue
<div v-if="iframeError" class="fallback-container">
  <v-btn :href="selectedSermon.link" target="_blank">
    Watch Sermon
  </v-btn>
</div>
```

---

## Event Status Management

The system automatically manages event statuses based on date/time:

### Auto-Update Logic

Events are automatically updated based on their scheduled times:

| Current Status | Condition | New Status |
|----------------|-----------|------------|
| `pending` | start_date <= NOW() <= end_date | `ongoing` |
| `ongoing` | end_date < NOW() | `completed` |
| `pending` | end_date < NOW() | `completed` |

### Status Flow

```
[Created] → [Pending Approval] → [Approved/Ongoing] → [Completed]
                              ↓
                         [Rejected]
```

### Manual Status Override

Admins can manually change event status through the EventRecordsDialog component.

---

## CMS Integration

The sermons page is highly customizable through the CMS system.

### CMS Table Structure

```sql
CREATE TABLE tbl_cms_sermons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_name VARCHAR(50) DEFAULT 'sermons' UNIQUE,
  content_json JSON
);
```

### Customizable Fields

| Field | Default Value | Description |
|-------|---------------|-------------|
| `pageTitle` | - | Page title (used in browser tab) |
| `heroTitle` | "LIVE WORSHIP & SERMONS" | Main heading |
| `heroDescription` | "Join us for live worship services..." | Subtitle |
| `backgroundColor` | "#ffffff" | Archive section background |
| `heroImage` | "/img/bible.jpg" | Hero banner image |
| `sermonArchiveTitle` | "Sermon Archive" | Archive section title |
| `sermonArchiveDescription` | "Browse through our collection..." | Archive description |

### CMS API Usage

```javascript
// Fetch CMS data
const response = await axios.get("/cms/sermons/full");

// Save CMS data
const response = await axios.post("/cms/sermons/save", {
  page: 'sermons',
  content: sermonsData
});
```

---

## User Flow

### Visitor Experience

1. **Landing on Live Page**
   - User visits `/live` route
   - Page loads with hero section and live stream card
   - System fetches sermon events and ministry events

2. **Watching Live Stream**
   - If there's an ongoing event with a link:
     - Display "LIVE" indicator
     - Show embedded video player
     - Display event title and time
   - If no ongoing stream:
     - Show "No live stream at the moment" message
     - Display service times

3. **Browsing Archive**
   - Scroll down to sermon archive section
   - View grid of past sermons
   - Click sermon card to play
   - Sort by newest/oldest

4. **Playing Sermon**
   - Click sermon card
   - Video loads in main player area
   - Can switch back to live stream if available

### Admin Experience

1. **Creating Sermon Event**
   - Navigate to Church Records → Events
   - Create new event with:
     - Type: "Sermon"
     - Link: Streaming URL
     - Dates: Scheduled service time
   - Save event

2. **Adding Ministry Stream**
   - Navigate to Church Records → Ministries
   - Edit or create ministry
   - Add streaming link in link field
   - Save ministry

3. **Customizing Page**
   - Navigate to Maintenance → Content Management
   - Select Sermons section
   - Edit titles, descriptions, colors
   - Upload hero image
   - Save changes

---

## Database Schema

### Events Table

```sql
CREATE TABLE tbl_events (
  event_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  location VARCHAR(255),
  link VARCHAR(500),           -- Streaming URL
  type VARCHAR(50),            -- 'sermon', 'worship', 'youth', etc.
  status VARCHAR(50),         -- 'pending', 'ongoing', 'completed'
  joined_members JSON,
  image BLOB,
  date_created DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Ministries Table

```sql
CREATE TABLE tbl_ministry (
  ministry_id INT AUTO_INCREMENT PRIMARY KEY,
  ministry_name VARCHAR(255) NOT NULL,
  description VARCHAR(1000),
  schedule VARCHAR(255),
  link VARCHAR(500),          -- Live streaming URL
  tags VARCHAR(500),           -- 'Ministry', 'Worship', etc.
  status VARCHAR(50),          -- 'active', 'inactive'
  image BLOB,
  date_created DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### CMS Sermons Table

```sql
CREATE TABLE tbl_cms_sermons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_name VARCHAR(50) DEFAULT 'sermons' UNIQUE,
  content_json JSON
);
```

---

## Supported Streaming Platforms

The system supports embedding from:

### Fully Supported (Embeddable)
- **YouTube** - All video types including Live
- **YouTube Live** - Direct live stream links
- **Facebook Live** - Via Facebook embed
- **Vimeo** - Videos and live streams

### Partially Supported (External Link)
- **Twitch** - Opens in new window
- **Instagram Live** - Opens in new window
- **Twitter/X Spaces** - Opens in new window
- **Custom RTMP streams** - Opens in new window
- **Any HTTPS URL** - Opens in new window as fallback

### Adding New Platforms

To add support for a new streaming platform, modify the `convertToEmbedUrl` function in `fe/src/components/LandingPage/Live.vue`:

```javascript
// Example: Adding Twitch support
const twitchMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
if (twitchMatch) {
  return `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${window.location.hostname}`;
}
```

---

## Security Considerations

### URL Validation
- All URLs are validated before embedding
- Only HTTPS URLs are accepted for production
- Invalid URLs fall back to external browser window

### Iframe Security
- Uses `allow` attributes for proper browser permissions
- Includes `allowfullscreen` for full-screen viewing
- Falls back gracefully if embedding fails

### Admin Permissions
- Only authenticated admins can:
  - Create/edit events with streaming links
  - Modify ministry streaming URLs
  - Change CMS content

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Video not loading | Check if link is valid YouTube/FB/Vimeo URL |
| Embed shows blank | Try opening link in new window instead |
| Live indicator not showing | Check event status is 'ongoing' |
| Archive empty | Add completed events with links |
| CMS images not showing | Ensure image is uploaded as base64 |

### Testing Checklist

- [ ] Create test event with YouTube link
- [ ] Verify event shows in live page
- [ ] Test embed playback
- [ ] Check fallback button works
- [ ] Verify archive displays completed events
- [ ] Test ministry streaming link
- [ ] Confirm CMS customization saves correctly

---

## Related Documentation

- [Events Management](./church_records/eventRoutes.js)
- [Ministry Records](./church_records/ministryRoutes.js)
- [CMS System](./cmsRecords.js)
- [Database Schema](./database/create_events_table.sql)
