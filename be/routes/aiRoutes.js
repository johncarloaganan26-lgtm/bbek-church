const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { query } = require('../database/db');
const { getCmsPage } = require('../dbHelpers/cmsRecords');
const moment = require('moment');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Helper to fetch public context for the AI
 */
async function fetchChurchContext() {
  const context = {
    slots: [],
    news: [],
    cms: {},
    now: moment().format('LLLL')
  };

  try {
    // 1. Live Slots
    const [rows] = await query(`
      SELECT service_type, available_date, available_time, max_slots,
      (
        CASE
          WHEN service_type = 'water_baptism' THEN (SELECT COUNT(*) FROM tbl_waterbaptism WHERE DATE(baptism_date) = DATE(s.available_date) AND status IN ('pending', 'approved'))
          WHEN service_type = 'salvation' THEN (SELECT COUNT(*) FROM tbl_discipleship_requests WHERE DATE(scheduled_date) = DATE(s.available_date) AND TIME(scheduled_time) = TIME(s.available_time) AND request_type = 'Salvation' AND status NOT IN ('cancelled', 'rejected'))
          WHEN service_type = 'bible_study' THEN (SELECT COUNT(*) FROM tbl_discipleship_requests WHERE DATE(scheduled_date) = DATE(s.available_date) AND TIME(scheduled_time) = TIME(s.available_time) AND request_type = 'Bible Study' AND status NOT IN ('cancelled', 'rejected'))
          WHEN service_type = 'dedication' THEN (SELECT COUNT(*) FROM tbl_childdedications WHERE DATE(preferred_dedication_date) = DATE(s.available_date) AND status NOT IN ('cancelled', 'rejected'))
          WHEN service_type = 'burial' THEN (SELECT COUNT(*) FROM tbl_burialservice WHERE DATE(service_date) = DATE(s.available_date) AND status NOT IN ('cancelled', 'rejected'))
          ELSE 0
        END
      ) as booked
      FROM tbl_service_slots s
      WHERE status = 'Available' AND available_date > CURDATE()
      AND service_type IN ('water_baptism', 'burial', 'dedication', 'salvation', 'bible_study')
      HAVING booked < max_slots
      ORDER BY available_date ASC
      LIMIT 10
    `);
    context.slots = rows;

    // 2. Announcements
    try {
        const [newsRows] = await query("SELECT title FROM tbl_announcements WHERE is_active = 1 LIMIT 3");
        context.news = newsRows;
    } catch (e) {}

    // 3. CMS Pages
    const pageKeys = ['header', 'about', 'ourstory', 'home', 'water_baptism', 'burial_service', 'child_dedication'];
    for (const pageName of pageKeys) {
      try {
        const result = await getCmsPage(pageName);
        if (result.success && result.data) context.cms[pageName] = result.data;
      } catch (pageErr) {}
    }
  } catch (e) {
    console.error('AI Context Warning:', e.message);
  }
  return context;
}

/**
 * AI Chat Support Route
 */
router.post('/chat', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'AI Service Config Error' });

    const { message, history, language, member_id } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing message' });

    const ctx = await fetchChurchContext();
    let memberCtx = null;

    if (member_id) {
       try {
         const [memberRows] = await query("SELECT firstname, lastname, position FROM tbl_members WHERE member_id = ?", [member_id]);
         if (memberRows.length > 0) {
            const m = memberRows[0];
            const [baptismRows] = await query("SELECT status FROM tbl_waterbaptism WHERE member_id = ? AND status = 'completed'", [member_id]);
            memberCtx = {
               name: `${m.firstname} ${m.lastname}`,
               role: m.position,
               is_member: m.position === 'Member',
               baptized: baptismRows.length > 0
            };
         }
       } catch (e) {}
    }

    const currentLanguage = language || 'English';
    const systemPrompt = `
      You are BBEK.Bot, digital assistant of Bible Baptist Ekklesia of Kawit. 
      Respond in ${currentLanguage}.
      SITEMAP: Home (/), About (/about), Baptism (/services/water-baptism), Dedication (/services/child-dedication), Burial (/services/burial), Discipleship (/services/discipleship), Give (/give).
      ${memberCtx ? `USER: ${memberCtx.name} (${memberCtx.role}). Baptized: ${memberCtx.baptized}.` : 'USER: Guest.'}
      TODAY: ${ctx.now}. 
      AVAILABILITY: ${ctx.slots?.map(s => `${moment(s.available_date).format('MMM DD')} ${s.available_time} (${s.service_type})`).join(', ') || 'Contact values'}
    `;

    // Using gemini-2.0-flash as verified by test-new-key.js
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', systemInstruction: systemPrompt });

    const chat = model.startChat({ history: history || [] });
    const result = await chat.sendMessageStream(message);
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of result.stream) {
      res.write(chunk.text());
    }
    res.end();
  } catch (error) {
    console.error('CRITICAL AI ERROR:', error.message);
    
    if (error.status === 404) {
       // Deep fallback to a model that is universally available if 2.0 fails
       return res.status(500).json({ error: "Configuration conflict: Model not found. Please contact admin." });
    }

    if (error.status === 429 || error.status === 503) {
      return res.status(500).json({ error: "I'm receiving too many requests. Give me 10 seconds!" });
    }
    
    res.status(500).json({ error: 'AI Assistant Busy' });
  }
});

module.exports = router;
