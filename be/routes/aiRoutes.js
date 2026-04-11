const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const logFile = path.join(__dirname, '../ai-debug.log');

function log(msg) {
  const line = `${new Date().toISOString()} - ${msg}\n`;
  try { fs.appendFileSync(logFile, line); } catch(e) {}
  console.log(`[AI-CHAT] ${msg}`);
}

/**
 * AI Chat Support Route - STABLE HIGH-CAPACITY
 */
router.post('/chat', async (req, res) => {
  const MAX_ATTEMPTS = 3;
  let attempt = 0;
  
  const { message, language, history } = req.body;
  if (!message) return res.status(400).json({ error: 'Missing message' });

  // Through diagnostic testing, gemini-flash-latest is the ONLY model allowed 
  // on this specific API key's free tier. 
  const modelsToTry = ["gemini-flash-latest", "gemini-2.0-flash-lite"];
  let currentModelIndex = 0;
  let hasSentHeaders = false;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    const currentModelName = modelsToTry[currentModelIndex] || modelsToTry[modelsToTry.length - 1];
    
    try {
      log(`Attempt ${attempt}: ${message.substring(0, 30)}... using ${currentModelName}`);

      const model = genAI.getGenerativeModel({ 
        model: currentModelName,
        systemInstruction: "You are the official assistant for Bible Baptist Ekklesia of Kawit, commonly known as BBEK. Always refer to the church as BBEK. Respond in " + (language || "English")
      });

      const chat = model.startChat({ history: history || [] });
      const result = await chat.sendMessageStream(message);
      
      if (!hasSentHeaders) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');
        hasSentHeaders = true;
      }

      for await (const chunk of result.stream) {
        res.write(chunk.text());
      }
      res.end();
      log(`Success with ${currentModelName}.`);
      return; // Exit on success

    } catch (error) {
      log(`FAIL on ${currentModelName}: ${error.message} (Status: ${error.status})`);

      if (attempt >= MAX_ATTEMPTS) {
        const isRateLimit = error.status === 429 || (error.message && error.message.includes('429'));
        const finalMsg = isRateLimit 
            ? "The AI is currently receiving too many requests. Please try again in a few moments." 
            : "The AI assistant is temporarily unavailable. Please try again later.";
        
        if (!hasSentHeaders) {
            return res.status(503).json({ error: finalMsg });
        } else {
            res.write(`\n\n[System: ${finalMsg}]`);
            return res.end();
        }
      }

      // Handle 404 (Model not found)
      if (error.status === 404 || (error.message && error.message.includes('404'))) {
        if (currentModelIndex < modelsToTry.length - 1) {
            currentModelIndex++;
            log(`Model not found. Switching to fallback engine: ${modelsToTry[currentModelIndex]}`);
            // Do not wait, retry immediately with next model
            continue;
        }
      }

      // Handle 429 (Rate Limit) or other intermittent errors
      const waitTime = windowTime(attempt);
      log(`Auto-retrying in ${waitTime}ms...`);
      await sleep(waitTime);
    }
  }

  function windowTime(attemptNum) {
      return 2000 * attemptNum;
  }
});

module.exports = router;
