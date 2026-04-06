const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // We'll try to list models to see what's available
    // But since the SDK doesn't have a direct 'listModels' in some versions,
    // we'll try a simple generateContent with the most basic 'gemini-pro' just in case.
    console.log("Checking API connection...");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("test");
    const response = await result.response;
    console.log("✅ Success! 'gemini-pro' is working.");
  } catch (error) {
    console.log("❌ Failed 'gemini-pro':", error.message);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("test");
        console.log("✅ Success! 'gemini-1.5-flash' is working.");
    } catch (e) {
        console.log("❌ Failed 'gemini-1.5-flash':", e.message);
    }
  }
}

listModels();
