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
    // 1. Live Slots - Direct query that checks for specific booking counts per service
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
      LIMIT 8
    `);
    context.slots = rows;

    // 2. Announcements
    try {
        const [newsRows] = await query("SELECT title FROM tbl_announcements WHERE is_active = 1 LIMIT 2");
        context.news = newsRows;
    } catch (e) {}

    // 3. CMS Pages - INDIVIDUAL FETCH with try/catch to avoid table-not-found crashes
    const pageKeys = {
        'header': 'header',
        'about': 'about',
        'ourstory': 'ourstory',
        'home': 'home',
        'water_baptism': 'water_baptism',
        'burial_service': 'burial_service',
        'child_dedication': 'child_dedication'
    };

    for (const [key, pageName] of Object.entries(pageKeys)) {
      try {
        const result = await getCmsPage(pageName);
        if (result.success && result.data) {
            context.cms[key] = result.data;
        }
      } catch (pageErr) {
        // Silently skip if table doesn't exist
      }
    }

    // --- FINAL FAILSAFE ---
    // Ensure important keys exist even if empty
    if (!context.cms.about) context.cms.about = { content: {} };
    if (!context.cms.ourstory) context.cms.ourstory = { content: {} };
    if (!context.cms.home) context.cms.home = { content: {} };
  } catch (e) {
    console.error('AI Context Warning (non-fatal):', e.message);
  }
  return context;
}

/**
 * AI Chat Support Route
 */
router.post('/chat', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error('CRITICAL: GEMINI_API_KEY is missing from environment variables!');
      return res.status(500).json({ error: 'AI Service Config Error' });
    }

    const { message, history, language } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing message' });

    let ctx;
    try {
      ctx = await fetchChurchContext();
    } catch (ctxError) {
      console.error('Error building AI context:', ctxError);
      // Fallback context so the user still gets an answer
      ctx = { slots: [], cms: {}, now: moment().format('LLLL') };
    }

    const currentLanguage = language || 'English';

    const systemPrompt = `
      You are BBEK.Bot. Be friendly, real-time, and helpful to guests.
      TODAY: ${ctx.now}
      LANGUAGE: ${currentLanguage}. Respond EXCLUSIVELY in ${currentLanguage}.
      Speak in a warm, polite and conversational manner appropriate for a church secretary.

      FOCUS: Membership, Water Baptism, Child Dedication, Burial Services, Salvation Talk, Bible Study. (NO MARRIAGE).
      AVAILABILITY: ${ctx.slots?.map(s => `${moment(s.available_date).format('MMM DD')} ${s.available_time} (${s.service_type})`).join(', ') || 'Contact Office'}.
      
      CORE: ${ctx.cms?.ourstory?.content?.mission?.substring(0, 50) || 'BBEK Church'}. 
      SCRIPT: Salvation Talk -> Bible Study -> Water Baptism -> Official Member. (Only Members can do Dedication/Ministries).
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest', systemInstruction: systemPrompt });

    const chat = model.startChat({ history: history || [] });
    const result = await chat.sendMessageStream(message);
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of result.stream) {
      res.write(chunk.text());
    }
    res.end();
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'AI Assistant Busy' });
  }
});

module.exports = router;
