require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ Missing GEMINI_API_KEY');
      process.exit(1);
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const result = await genAI.listModels();
    console.log('--- AVAILABLE MODELS ---');
    result.models.forEach(m => {
      console.log(` - ${m.name} (Methods: ${m.supportedMethods.join(', ')})`);
    });
    console.log('------------------------');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error listing models:', err.message);
    process.exit(1);
  }
}

listModels();
