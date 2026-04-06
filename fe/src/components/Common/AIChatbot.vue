<template>
  <div class="ai-chatbot-wrapper" :class="{ 'is-open': isOpen }">
    <!-- Floating Greeting Bubble (Visible when closed) -->
    <div v-if="!isOpen" class="chat-greeting-bubble elevation-4">
      Hi 👋 How can I help?
    </div>

    <!-- Simple Message Icon (Teal) -->
    <v-btn
      v-if="!isOpen"
      icon
      size="x-large"
      class="chat-bubble-btn elevation-6"
      @click="toggleChat"
    >
      <v-icon size="30" color="white">mdi-comment-text-outline</v-icon>
    </v-btn>

    <!-- Simple Chat Window -->
    <v-card v-else class="chat-window elevation-12 border-0">
      <!-- Minimal Header -->
      <v-toolbar color="#0cbdaa" density="compact" class="px-2">
        <v-avatar size="28" class="mr-2">
          <v-img :src="botLogo" cover>
             <template v-slot:placeholder><v-icon icon="mdi-church" color="white"></v-icon></template>
          </v-img>
        </v-avatar>

        <span class="text-subtitle-2 font-weight-bold text-white ml-0">
          BBEK Chat Support
        </span>

        <v-spacer></v-spacer>

        <!-- Global Language Menu on RIGHT (Circle Flag Style) -->
        <v-menu location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn 
              icon
              size="32"
              variant="text" 
              class="mr-1"
              v-bind="props"
              title="Select Language"
            >
              <v-avatar size="24" class="border">
                <v-img :src="getFlagUrl(selectedLanguage.iso)" alt="flag" cover></v-img>
              </v-avatar>
            </v-btn>
          </template>
          <v-list density="compact" class="pa-1" style="border-radius: 12px; min-width: 150px;">
            <v-list-item 
              v-for="lang in languages" 
              :key="lang.code" 
              @click="toggleLanguage(lang)"
              :active="selectedLanguage.code === lang.code"
              color="#0cbdaa"
              class="rounded-lg mb-1"
            >
              <template v-slot:prepend>
                <v-avatar size="20" class="mr-3 border border-opacity-25">
                   <v-img :src="getFlagUrl(lang.iso)" cover></v-img>
                </v-avatar>
              </template>
              <v-list-item-title style="font-size: 13px; font-weight: 600;">{{ lang.name }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-btn icon size="x-small" variant="text" color="white" @click="toggleChat">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <!-- Messages Area -->
      <v-card-text ref="messageContainer" class="chat-messages-container pa-3 bg-grey-lighten-5">
        <!-- System Greeting -->
        <div class="bot-wrapper mb-4">
          <v-avatar size="24" class="mr-2 mt-1 bot-avatar shadow-sm" color="#0cbdaa">
              <v-img :src="botLogo" cover>
                <template v-slot:placeholder><v-icon size="14" icon="mdi-robot" color="white"></v-icon></template>
              </v-img>
          </v-avatar>
          <div class="message-bubble bot-message elevation-1">
            Hi! I am BBEK.Bot, your church assistant. How can I help you today? 👋
            <v-btn icon size="x-small" variant="text" class="speech-btn mt-1 ml-n1 d-block" color="#0cbdaa" @click="speak('Hi! I am BBEK.Bot, your church assistant. How can I help you today? 👋', -2)">
               <v-icon size="14">{{ (isSpeaking && currentlySpeakingIndex === -2) ? 'mdi-volume-off' : 'mdi-volume-high' }}</v-icon>
            </v-btn>
          </div>
        </div>

        <div 
          v-for="(msg, index) in messages" 
          :key="index" 
          :class="['message-wrapper mb-4', msg.role === 'user' ? 'user-wrapper' : 'bot-wrapper']"
        >
          <!-- User Profile (optional skip or small placeholder) -->
          <v-avatar size="24" v-if="msg.role === 'bot'" class="mr-2 mt-1 bot-avatar shadow-sm" color="#0cbdaa">
             <v-img :src="botLogo" cover>
                <template v-slot:placeholder><v-icon size="14" icon="mdi-robot" color="white"></v-icon></template>
             </v-img>
          </v-avatar>

          <div 
            v-if="msg.content" 
            :class="['message-bubble shadow-sm elevation-1', msg.role === 'user' ? 'user-message' : 'bot-message']"
          >
            <!-- Render Markdown for bot messages -->
            <div v-if="msg.role === 'bot'" class="markdown-content" v-html="renderMarkdown(msg.content)"></div>
            <div v-else>{{ msg.content }}</div>
            
            <!-- Bot Speech Button -->
            <v-btn 
              v-if="msg.role === 'bot'" 
              icon 
              size="x-small" 
              variant="text" 
              class="speech-btn mt-1 ml-n1 d-block" 
              color="#0cbdaa" 
              @click="speak(msg.content)"
            >
              <v-icon size="14">mdi-volume-high</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- Cleaner Typing Indicator -->
        <div v-if="isTyping" class="bot-wrapper mt-2">
          <v-avatar size="24" class="mr-2 mt-1 bot-avatar shadow-sm" color="#0cbdaa">
             <v-img :src="botLogo" cover>
                <template v-slot:placeholder><v-icon size="14" icon="mdi-robot-outline" color="white"></v-icon></template>
             </v-img>
          </v-avatar>
          <div class="message-bubble bot-message typing-dots px-4 py-2 elevation-1">
            <span>.</span><span>.</span><span>.</span>
          </div>
        </div>
      </v-card-text>

      <!-- Input Area -->
      <v-divider></v-divider>
      <div class="input-area pa-3">
        <v-text-field
          v-model="userInput"
          placeholder="Message..."
          variant="solo-filled"
          density="compact"
          flat
          hide-details="auto"
          bg-color="grey-lighten-4"
          @keyup.enter="sendMessage"
          :disabled="isTyping"
          counter="150"
          maxlength="150"
        >
          <template v-slot:prepend-inner>
            <v-btn
              icon
              size="small"
              variant="text"
              :color="isListening ? 'red' : 'grey-darken-1'"
              class="mr-n2"
              @click="startListening"
              :class="{ 'pulse': isListening }"
            >
              <v-icon>{{ isListening ? 'mdi-microphone' : 'mdi-microphone-outline' }}</v-icon>
            </v-btn>
          </template>
          <template v-slot:append-inner>
            <v-btn
              icon
              size="small"
              variant="text"
              color="#0cbdaa"
              :disabled="!userInput.trim() || isTyping"
              @click="sendMessage"
            >
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, computed } from 'vue';
import { marked } from 'marked';
import { useCmsStore } from '@/stores/cmsStore';

const cmsStore = useCmsStore();
const headerLogo = ref('/img/logo.png');

onMounted(async () => {
  try {
    const cmsData = await cmsStore.fetchPageData('header');
    if (cmsData && cmsData.images && cmsData.images.logo) {
      headerLogo.value = cmsData.images.logo;
    }
  } catch (err) {
    console.error('Error fetching chatbot logo from CMS:', err);
  }
});

const botLogo = computed(() => headerLogo.value);


const isOpen = ref(false);
const userInput = ref('');
const isTyping = ref(false);
const messages = ref([]);
const messageContainer = ref(null);
const chatHistory = ref([]);

// Voice Features
const isListening = ref(false);
const isSpeaking = ref(false);
const currentlySpeakingIndex = ref(-1); // -1 means none, -2 means the greeting
const selectedLanguage = ref({ name: 'English', code: 'en-US', iso: 'us' });
const languages = [
  { name: 'English', code: 'en-US', iso: 'us' },
  { name: 'Tagalog', code: 'tl-PH', iso: 'ph' },
  { name: 'Spanish', code: 'es-ES', iso: 'es' },
  { name: 'Japanese', code: 'ja-JP', iso: 'jp' },
  { name: 'Chinese', code: 'zh-CN', iso: 'cn' },
  { name: 'Korean', code: 'ko-KR', iso: 'kr' },
  { name: 'French', code: 'fr-FR', iso: 'fr' }
];

const getFlagUrl = (iso) => `https://flagcdn.com/w40/${iso}.png`;

const toggleLanguage = (lang) => {
  selectedLanguage.value = lang;
  if (isSpeaking.value) stopSpeaking();
};

const startListening = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Speech recognition is not supported in this browser.');
    return;
  }
  
  const recognition = new SpeechRecognition();
  recognition.lang = selectedLanguage.value.code;
  recognition.continuous = false;
  
  recognition.onstart = () => {
    isListening.value = true;
  };
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    userInput.value = transcript;
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    isListening.value = false;
  };
  
  recognition.onend = () => {
    isListening.value = false;
  };
  
  recognition.start();
};

const speak = (text, index) => {
  if (!window.speechSynthesis) return;
  
  // If we are already speaking THIS specific message, stop it.
  if (isSpeaking.value && currentlySpeakingIndex.value === index) {
    stopSpeaking();
    return;
  }
  
  currentlySpeakingIndex.value = index;
  
  // Clean text from markdown for better speech
  const cleanText = text
    .replace(/[*#_`]/g, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  
  // Refined voice selection logic
  const voices = window.speechSynthesis.getVoices();
  const langCode = selectedLanguage.value.code.split('-')[0];
  
  // Priority: 1. Exact match for lang, 2. Natural match, 3. First match
  const preferredVoice = 
    voices.find(v => v.lang.startsWith(langCode) && v.name.includes('Natural')) ||
    voices.find(v => v.lang.startsWith(langCode) && v.name.includes('Google')) ||
    voices.find(v => v.lang.startsWith(langCode)) ||
    voices[0];

  if (preferredVoice) {
    utterance.voice = preferredVoice;
    utterance.lang = preferredVoice.lang;
  }
  
  // Natural pacing
  utterance.rate = 1.0;  // Normal speed (not too fast)
  utterance.pitch = 1.0; // Normal pitch
  utterance.volume = 1.0;
  
  utterance.onstart = () => { isSpeaking.value = true; };
  utterance.onend = () => { isSpeaking.value = false; currentlySpeakingIndex.value = -1; };
  utterance.onerror = () => { isSpeaking.value = false; currentlySpeakingIndex.value = -1; };
  
  window.speechSynthesis.speak(utterance);
};

// Ensure voices are loaded (sometimes needed for Chrome)
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

const stopSpeaking = () => {
  window.speechSynthesis.cancel();
  isSpeaking.value = false;
};

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true
});

const renderMarkdown = (text) => {
  return marked.parse(text);
};

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    scrollToBottom();
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (messageContainer.value) {
    const el = messageContainer.value.$el || messageContainer.value;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth'
    });
  }
};

const sendMessage = async () => {
  if (!userInput.value.trim() || isTyping.value) return;

  const currentMessage = userInput.value;
  messages.value.push({ role: 'user', content: currentMessage });
  userInput.value = '';
  isTyping.value = true;
  await scrollToBottom();

  let botMessageIndex = -1;

  try {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const apiUrl = `${cleanBaseUrl}/api/public/ai/chat`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: currentMessage,
        history: chatHistory.value,
        language: selectedLanguage.value.name // Send as string name
      })
    });

    if (!response.ok) {
      // Safely check if response is JSON to avoid "Unexpected end of JSON input"
      const contentType = response.headers.get("content-type");
      let errorMessage = 'Failed to connect';
      
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } else {
        const textError = await response.text();
        console.error('Non-JSON Error Response:', textError.substring(0, 100));
        errorMessage = `Server Error (${response.status})`;
      }
      throw new Error(errorMessage);
    }

    // Hide typing dots and show the bot message avatar
    isTyping.value = false;
    botMessageIndex = messages.value.length;
    messages.value.push({ role: 'bot', content: '' });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let botText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      botText += chunk;
      messages.value[botMessageIndex].content = botText;
      scrollToBottom();
    }

    // Keep history lean to avoid 'Input Tokens' quota errors
    chatHistory.value.push({ role: 'user', parts: [{ text: currentMessage }] });
    chatHistory.value.push({ role: 'model', parts: [{ text: botText }] });
    if (chatHistory.value.length > 10) {
      chatHistory.value = chatHistory.value.slice(-6);
    }

  } catch (error) {
    isTyping.value = false;
    if (!error.message.includes('429') && !error.message.includes('Quota')) {
      console.error('Chat Connection Error:', error);
    }
    
    const friendlyError = error.message.includes('429') || error.message.includes('Quota')
        ? "Too many questions! 🙏 Google limits free messages per minute. Please wait 60 seconds and I’ll be back!"
        : "Sorry, I can't reach the church server. Please check your connection!";

    if (botMessageIndex !== -1 && messages.value[botMessageIndex]) {
      messages.value[botMessageIndex].content = friendlyError;
    } else {
      messages.value.push({ role: 'bot', content: friendlyError });
    }
  } finally {
    isTyping.value = false;
    if (botMessageIndex !== -1 && messages.value[botMessageIndex] && !messages.value[botMessageIndex].content) {
      messages.value.splice(botMessageIndex, 1);
    }
    scrollToBottom();
  }
};

watch(messages, () => scrollToBottom(), { deep: true });
</script>

<style scoped>
.ai-chatbot-wrapper {
  position: fixed;
  right: 25px;
  bottom: 25px;
  z-index: 2000;
}

.chat-greeting-bubble {
  position: absolute;
  right: -5px;
  bottom: 80px;
  background-color: white;
  color: #333;
  padding: 10px 18px;
  border-radius: 20px;
  white-space: nowrap;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  animation: float-bounce 3s infinite ease-in-out;
  cursor: pointer;
  z-index: 10;
}

/* Little triangle "tail" for the chat bubble */
.chat-greeting-bubble::after {
  content: '';
  position: absolute;
  bottom: -8px;
  right: 25px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 10px solid white;
}

@keyframes float-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.chat-bubble-btn {
  width: 60px !important;
  height: 60px !important;
  border-radius: 50% !important;
  background-color: #0cbdaa !important;
  transition: transform 0.2s ease;
}

.chat-bubble-btn:hover {
  transform: scale(1.05);
}

.chat-window {
  width: 420px;
  height: 600px; /* Bigger layout as requested */
  display: flex !important;
  flex-direction: column !important;
  border-radius: 12px !important;
  overflow: hidden !important; 
  position: relative;
  background-color: white;
  animation: fade-in 0.3s ease;
}

.chat-messages-container {
  flex-grow: 1 !important;
  flex-shrink: 1 !important;
  overflow-y: auto !important;
  background-color: #ffffff;
  padding: 12px;
  max-height: calc(100% - 110px); /* Ensures it leaves space for header and footer */
  /* Scrollbar Styling for a premium feel */
  scrollbar-width: thin;
  scrollbar-color: #0cbdaa #f1f1f1;
}

.input-area {
  flex-shrink: 0 !important;
  background-color: #f9f9f9;
  z-index: 10;
}

/* Chrome/Safari Scrollbar */
.chat-messages-container::-webkit-scrollbar {
  width: 6px;
}
.chat-messages-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.chat-messages-container::-webkit-scrollbar-thumb {
  background: #0cbdaa;
  border-radius: 10px;
}

.message-wrapper {
  display: flex;
  margin-bottom: 12px; /* Better spacing between bubbles */
}

.user-wrapper { justify-content: flex-end; }
.bot-wrapper { justify-content: flex-start; }

.message-bubble {
  max-width: 85%;
  padding: 8px 14px;
  border-radius: 15px;
  font-size: 0.85rem;
  line-height: 1.4;
}

.user-message {
  background-color: #0cbdaa;
  color: white;
  border-bottom-right-radius: 2px;
}

.bot-message {
  background-color: #F1F1F1;
  color: #222;
  border-bottom-left-radius: 2px;
}

/* Markdown Styles for bot messages */
.markdown-content :deep(p) {
  margin-bottom: 8px;
}
.markdown-content :deep(p):last-child {
  margin-bottom: 0;
}
.markdown-content :deep(ul) {
  margin-left: 16px;
  margin-bottom: 8px;
}
.markdown-content :deep(strong) {
  font-weight: 700;
}
.markdown-content :deep(li) {
  margin-bottom: 4px;
}

.typing-dots span {
  animation: blink 1.4s infinite both;
}
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

.speech-btn {
  opacity: 0.6;
  height: 24px !important;
  width: 24px !important;
  transition: opacity 0.2s;
}

.speech-btn:hover {
  opacity: 1;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

.pulse {
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes blink {
  0% { opacity: 0.2; }
  20% { opacity: 1; }
  100% { opacity: 0.2; }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 600px) {
  .chat-window {
    width: 85vw;
    right: 7.5vw;
    bottom: 20px;
  }
}
</style>
