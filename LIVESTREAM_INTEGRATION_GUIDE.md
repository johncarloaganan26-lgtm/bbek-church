# Livestream Integration Guide for Event Organization Platform

This guide explains how to add livestream functionality to events in your system.

---

## Quick Start: Adding a Livestream to an Event

### Step 1: Create an Event with a Streaming Link

Navigate to **Church Records → Events** and create a new event:

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| **Title**      | Sunday Worship Service                          |
| **Type**       | `sermon`                                        |
| **Start Date** | 2026-03-08 09:00:00                             |
| **End Date**   | 2026-03-08 11:00:00                             |
| **Link**       | `https://www.youtube.com/watch?v=YOUR_VIDEO_ID` |
| **Status**     | pending (will auto-update to ongoing)           |

### Step 2: Event Will Appear on Live Page

Once the event time arrives:

- If `start_date <= NOW() <= end_date`, status becomes `ongoing`
- The livestream appears on the `/live` page
- A "LIVE" indicator displays

### Step 3: After Event Ends

- Status automatically changes to `completed`
- The event moves to the sermon archive
- Visitors can still watch the recording

---

## API Integration Methods

### Method 1: Direct Database Insert

```sql
-- Add a sermon event with livestream
INSERT INTO tbl_events (
  title,
  description,
  start_date,
  end_date,
  location,
  link,
  type,
  status,
  date_created
) VALUES (
  'Sunday Worship Service',
  'Weekly Sunday worship and sermon',
  '2026-03-08 09:00:00',
  '2026-03-08 11:00:00',
  'Main Sanctuary',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'sermon',
  'pending',
  NOW()
);
```

### Method 2: Using the Admin Interface

1. Go to **Admin Panel → Church Records → Events**
2. Click **Add Event**
3. Fill in the event details
4. Add the streaming URL in the **Link** field
5. Set Type to **Sermon**
6. Save the event

### Method 3: Programmatic API Call

```javascript
// Create event with livestream via API
const response = await axios.post("/api/church-records/events/save", {
  title: "Youth Service",
  description: "Weekly youth worship service",
  start_date: "2026-03-08 14:00:00",
  end_date: "2026-03-08 16:00:00",
  location: "Youth Hall",
  link: "https://www.youtube.com/watch?v=EXAMPLE",
  type: "sermon", // Important: use 'sermon' type for livestream
  status: "pending",
});
```

---

## Event Types for Livestream

The system recognizes different event types. For livestream purposes:

| Type      | Description            | Shows on Live Page? |
| --------- | ---------------------- | ------------------- |
| `sermon`  | Regular sermon/service | ✅ Yes              |
| `worship` | Worship service        | ✅ Yes              |
| `youth`   | Youth service          | ✅ Yes              |
| `special` | Special events         | ✅ Yes              |
| `other`   | Other events           | ❌ No               |

To show any event type on the live page, set `type = 'sermon'`.

---

## Making Events Live Automatically

### Automatic Status Updates

The system automatically updates event status based on time:

```javascript
// From be/dbHelpers/church_records/eventRecords.js
async function autoUpdateEventStatuses() {
  // Ongoing: current time is within event range
  await query(`
    UPDATE tbl_events 
    SET status = 'ongoing' 
    WHERE status = 'pending' 
    AND start_date <= NOW() 
    AND end_date >= NOW()
  `);

  // Completed: event has ended
  await query(`
    UPDATE tbl_events 
    SET status = 'completed' 
    WHERE status = 'ongoing' 
    AND end_date < NOW()
  `);
}
```

### Manual Status Control

You can also manually control the status:

| Status      | When to Use                      |
| ----------- | -------------------------------- |
| `pending`   | Event scheduled, not yet started |
| `ongoing`   | Event is currently live          |
| `completed` | Event finished, now an archive   |

---

## Embedding the Live Page in External Sites

### Option 1: Iframe Embed

```html
<iframe
  src="https://yourdomain.com/live"
  width="100%"
  height="600"
  frameborder="0"
>
</iframe>
```

### Option 2: Embed Specific Stream Only

To embed just the video player (without the full page):

```html
<iframe
  src="https://yourdomain.com/api/embed/live"
  width="100%"
  height="400"
  frameborder="0"
  allowfullscreen
>
</iframe>
```

_(Note: A custom embed endpoint may need to be created)_

### Option 3: Link to Live Page

Simply link to the live page:

```html
<a href="https://yourdomain.com/live"> Watch Live Stream </a>
```

---

## Displaying Livestream on Homepage

### Option 1: Add to Homepage Carousel

Edit the homepage CMS and add the live page link:

```javascript
// In homepage CMS configuration
{
  "heroButtons": [
    { "label": "Watch Live", "link": "/live" },
    { "label": "Plan a Visit", "link": "/plan-visit" }
  ]
}
```

### Option 2: Show Live Indicator on Header

The navigation already includes a link to sermons:

```javascript
// From fe/src/components/LandingPage/Navigation.vue
{ label: 'Sermons', value: 'sermons', to: '/live' }
```

### Option 3: Custom Homepage Component

Create a custom component that fetches and displays current livestream:

```javascript
// Example: Fetch ongoing sermon event
const fetchLiveStream = async () => {
  const response = await axios.get("/church-records/events/getSermonEvents");

  if (response.data.success && response.data.data.length > 0) {
    const liveEvent = response.data.data[0];
    // Display live event
  }
};
```

---

## Adding Thumbnails to Livestream Events

### Upload Image via Admin

1. Go to **Church Records → Events**
2. Edit the event
3. Upload an image in the **Image** field
4. Save the event

### Image Requirements

| Specification | Recommendation               |
| ------------- | ---------------------------- |
| Format        | JPEG, PNG                    |
| Size          | 1280x720 (16:9 aspect ratio) |
| Max Size      | 2MB                          |
| Storage       | Stored as BLOB in database   |

---

## Testing Your Livestream Setup

### Test Checklist

1. **Create test event:**

   ```sql
   INSERT INTO tbl_events (title, type, start_date, end_date, link, status)
   VALUES ('Test Livestream', 'sermon', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'ongoing');
   ```

2. **Visit /live page** - The event should appear with LIVE indicator

3. **Test video playback** - Click play, video should load

4. **Test archive** - After end_date passes, event should appear in archive

### Troubleshooting

| Issue             | Solution                                               |
| ----------------- | ------------------------------------------------------ |
| Event not showing | Check type='sermon' and status='ongoing'               |
| Video not playing | Verify link is valid YouTube/FB/Vimeo URL              |
| No LIVE indicator | Ensure current time is between start_date and end_date |
| Not in archive    | Ensure end_date has passed and link is not empty       |

---

## Advanced: Custom Embed Page

If you need a custom embeddable player for external sites:

### Create Custom Endpoint

```javascript
// In be/routes/church_records/eventRoutes.js
router.get("/embed/live", async (req, res) => {
  const result = await getSermonEvents();

  if (result.success && result.data.length > 0) {
    const liveEvent = result.data[0];
    // Redirect to embed URL
    const embedUrl = convertToEmbedUrl(liveEvent.link);
    res.redirect(embedUrl);
  } else {
    res.redirect("/live");
  }
});
```

---

## Related Files

- [Live.vue](fe/src/components/LandingPage/Live.vue) - Main livestream page
- [EventRecordsDialog.vue](fe/src/components/Dialogs/EventRecordsDialog.vue) - Event creation form
- [eventRoutes.js](be/routes/church_records/eventRoutes.js) - Event API endpoints
- [eventRecords.js](be/dbHelpers/church_records/eventRecords.js) - Event database operations
