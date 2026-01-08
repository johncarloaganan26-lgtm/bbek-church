<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <h1 class="error-title">Page Not Found</h1>
      <p class="error-message">
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>
      <div class="error-illustration">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <!-- Broken link/confused person illustration -->
          <circle cx="100" cy="60" r="30" fill="#e2e8f0"/>
          <rect x="70" y="95" width="60" height="50" rx="10" fill="#e2e8f0"/>
          <circle cx="85" cy="55" r="5" fill="#64748b"/>
          <circle cx="115" cy="55" r="5" fill="#64748b"/>
          <path d="M85 75 Q100 85 115 75" stroke="#64748b" stroke-width="3" fill="none"/>
          <!-- Question marks -->
          <text x="40" y="50" font-size="24" fill="#94a3b8">?</text>
          <text x="160" y="50" font-size="24" fill="#94a3b8">?</text>
          <text x="170" y="100" font-size="20" fill="#94a3b8">?</text>
        </svg>
      </div>
      <div class="action-buttons">
        <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-home"
          @click="goHome"
        >
          Back to Home
        </v-btn>
        <v-btn
          variant="outlined"
          size="large"
          prepend-icon="mdi-arrow-left"
          @click="goBack"
        >
          Go Back
        </v-btn>
      </div>
      <div class="suggestions">
        <p>Here are some helpful links:</p>
        <div class="link-list">
          <a href="/" @click.prevent="goHome">Home</a>
          <a href="/about" @click.prevent="goAbout">About Us</a>
          <a href="/events" @click.prevent="goEvents">Events</a>
          <a href="/ministries" @click.prevent="goMinistries">Ministries</a>
          <a href="/give" @click.prevent="goGive">Give</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.back()
}

const goAbout = () => {
  router.push('/about')
}

const goEvents = () => {
  router.push('/events')
}

const goMinistries = () => {
  router.push('/ministries')
}

const goGive = () => {
  router.push('/give')
}
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 20px;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #0ea5e9;
  line-height: 1;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.error-message {
  font-size: 16px;
  color: #64748b;
  margin-bottom: 30px;
  line-height: 1.6;
}

.error-illustration {
  margin-bottom: 30px;
}

.error-illustration svg {
  width: 150px;
  height: 150px;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 40px;
}

.suggestions {
  border-top: 1px solid #e2e8f0;
  padding-top: 30px;
}

.suggestions p {
  color: #64748b;
  margin-bottom: 16px;
}

.link-list {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.link-list a {
  color: #0ea5e9;
  text-decoration: none;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 20px;
  background: #f1f5f9;
  transition: all 0.2s ease;
}

.link-list a:hover {
  background: #0ea5e9;
  color: white;
}

@media (max-width: 600px) {
  .error-code {
    font-size: 80px;
  }
  
  .error-title {
    font-size: 24px;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .link-list {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
