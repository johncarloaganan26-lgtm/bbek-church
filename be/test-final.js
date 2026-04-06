const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function testDefaultKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    console.log("🚀 Testing Default Project Key with 'gemini-1.5-flash'...");
    const response = await axios.post(apiUrl, {
      contents: [{ parts: [{ text: "Say 'Success!'" }] }]
    });
    console.log("✅ YES! Response:", response.data.candidates[0].content.parts[0].text);
  } catch (error) {
    if (error.response) {
      console.log("❌ Failed:", error.response.status, error.response.data.error.message);
    } else {
      console.log("❌ Error:", error.message);
    }
  }
}

testDefaultKey();
