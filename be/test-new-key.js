const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testNewKey() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    console.log("🚀 Testing BBEK Project Key with 'gemini-2.0-flash'...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Say 'Hello BBEK!'");
    const response = await result.response;
    console.log("✅ SUCCESS! RESPONSE:", response.text());
  } catch (error) {
    console.log("❌ ERROR:", error.message);
  }
}

testNewKey();
