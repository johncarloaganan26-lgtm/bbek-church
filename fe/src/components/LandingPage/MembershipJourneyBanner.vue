<template>
  <transition name="slide-up">
    <div v-if="isVisible" class="membership-journey-banner" role="complementary" aria-label="Membership Journey Guide">
      <div class="banner-glass-container" role="dialog" aria-labelledby="journey-title">
        <!-- Close Button -->
        <button class="close-btn" @click="dismissPermanently" aria-label="Close guide and don't show again">
          <v-icon icon="mdi-close" size="small"></v-icon>
        </button>

        <div class="banner-content">
          <div class="header-section text-center mb-4">
            <h3 id="journey-title" class="header-title">Belong to the Family</h3>
            <p class="header-subtitle">New here? We'd love to have you join our journey of faith.</p>
          </div>

          <!-- Step Visualization -->
          <div class="journey-steps">
            <div class="step current">
              <div class="step-icon">
                <v-icon icon="mdi-account-outline" color="white"></v-icon>
              </div>
              <span class="step-label">Guest</span>
            </div>
            
            <div class="step-connector">
              <div class="connector-line animated"></div>
            </div>

            <div class="step next">
              <div class="step-icon">
                <v-icon icon="mdi-seed-outline" color="white"></v-icon>
              </div>
              <span class="step-label">Grow</span>
              <div class="step-hint">Start Discipleship</div>
            </div>

            <div class="step-connector">
              <div class="connector-line"></div>
            </div>

            <div class="step future">
              <div class="step-icon">
                <v-icon icon="mdi-account-group" color="white"></v-icon>
              </div>
              <span class="step-label">Member</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="actions-section mt-6">
            <v-btn
              color="#0cbdaa"
              class="cta-btn text-none px-8 py-2"
              rounded="pill"
              elevation="4"
              @click="startJourney"
            >
              Start Your Journey
              <v-icon end icon="mdi-arrow-right"></v-icon>
            </v-btn>
            <button class="maybe-later-link mt-3" @click="dismissTemporarily">
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isVisible = ref(false)
const STORAGE_KEY = 'bbek_journey_banner_dismissed'

const checkAuth = () => {
  const userInfo = localStorage.getItem('userInfo')
  const accessToken = localStorage.getItem('accessToken')
  return !!(userInfo || accessToken)
}

const showBanner = () => {
  // Check if user is already a member/logged in
  if (checkAuth()) return

  // Check if banner was dismissed permanently
  const dismissed = localStorage.getItem(STORAGE_KEY)
  if (dismissed === 'permanent') return

  // Check if dismissed temporarily (within last 7 days)
  if (dismissed && !isNaN(dismissed)) {
    const dismissDate = parseInt(dismissed)
    const now = Date.now()
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000
    if (now - dismissDate < sevenDaysInMs) return
  }

  // Show after 5 seconds delay
  setTimeout(() => {
    isVisible.value = true
  }, 5000)
}

const dismissTemporarily = () => {
  isVisible.value = false
  localStorage.setItem(STORAGE_KEY, Date.now().toString())
}

const dismissPermanently = () => {
  isVisible.value = false
  localStorage.setItem(STORAGE_KEY, 'permanent')
}

const startJourney = () => {
  isVisible.value = false
  router.push('/beoneofus/discipleship')
}

onMounted(() => {
  showBanner()
})
</script>

<style scoped>
.membership-journey-banner {
  position: fixed;
  bottom: 24px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 1000;
  padding: 0 16px;
  pointer-events: none;
}

.banner-glass-container {
  background: white; /* Solid fallback for old browsers */
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 24px;
  padding: 24px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  pointer-events: auto;
  overflow: hidden;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: scale(1.1);
}

.header-title {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 4px;
}

.header-subtitle {
  font-size: 0.9rem;
  color: #5c6c7b;
}

/* Journey Steps Visualization */
.journey-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px 0;
  position: relative;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
  position: relative;
}

.step-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  background: #cbd5e0;
}

.step.current .step-icon {
  background: #2c3e50;
  box-shadow: 0 0 0 4px rgba(44, 62, 80, 0.1);
}

.step.next .step-icon {
  background: #0cbdaa;
  box-shadow: 0 0 0 6px rgba(12, 189, 170, 0.15);
  animation: pulse-teal 2s infinite;
}

.step-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #4a5568;
}

.step.next .step-label {
  color: #0cbdaa;
}

.step-hint {
  position: absolute;
  top: -25px;
  background: #0cbdaa;
  color: white;
  font-size: 0.65rem;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
  font-weight: bold;
}

.step-hint::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -4px;
  border-width: 4px;
  border-style: solid;
  border-color: #0cbdaa transparent transparent transparent;
}

/* Connectors */
.step-connector {
  flex-grow: 1;
  height: 2px;
  background: #e2e8f0;
  position: relative;
  margin: 0 8px;
  margin-top: -24px;
}

.connector-line {
  height: 100%;
  width: 0;
  background: #2c3e50;
}

.connector-line.animated {
  width: 100%;
  background: linear-gradient(90deg, #2c3e50, #0cbdaa);
  animation: fill-line 1s forwards;
}

/* Actions */
.actions-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cta-btn {
  font-weight: 700 !important;
  letter-spacing: 0.5px;
  transition: transform 0.2s ease, box-shadow 0.2s ease !important;
}

.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(12, 189, 170, 0.3) !important;
}

.maybe-later-link {
  background: none;
  border: none;
  color: #718096;
  font-size: 0.85rem;
  text-decoration: underline;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.2s ease;
}

.maybe-later-link:hover {
  color: #2d3748;
}

/* Animations */
@keyframes pulse-teal {
  0% { box-shadow: 0 0 0 0 rgba(12, 189, 170, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(12, 189, 170, 0); }
  100% { box-shadow: 0 0 0 0 rgba(12, 189, 170, 0); }
}

@keyframes fill-line {
  from { width: 0; }
  to { width: 100%; }
}

/* Transition Animations */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100px);
  opacity: 0;
}

@media (max-width: 480px) {
  .membership-journey-banner {
    bottom: 0;
    padding: 0;
  }

  .banner-glass-container {
    border-radius: 24px 24px 0 0;
    padding: 24px 16px 32px;
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.1);
  }

  .header-title {
    font-size: 1.25rem;
  }

  .header-subtitle {
    font-size: 0.8rem;
    padding: 0 10px;
  }

  .step-icon {
    width: 40px;
    height: 40px;
  }

  .step-label {
    font-size: 0.7rem;
  }

  .step-hint {
    font-size: 0.6rem;
    top: -22px;
  }

  .close-btn {
    top: 10px;
    right: 10px;
    width: 44px; /* Better touch target for mobile */
    height: 44px;
    background: rgba(0, 0, 0, 0.08); /* Slightly clearer on mobile */
  }

  .cta-btn {
    width: 100%;
    height: 48px !important; /* Proper mobile button height */
    padding: 0 !important;
  }

  .journey-steps {
    margin: 15px 0 20px;
  }
}

@media (max-height: 600px) and (max-width: 480px) {
  .banner-glass-container {
    padding: 16px 16px 20px;
  }
  .journey-steps {
    margin: 5px 0 10px;
  }
  .header-section {
    margin-bottom: 8px !important;
  }
}
</style>
