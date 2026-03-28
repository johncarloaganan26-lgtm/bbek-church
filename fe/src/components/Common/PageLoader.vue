<template>
  <transition name="fade">
    <div
      v-if="modelValue"
      class="page-loader"
      :class="{ 'is-viewport': viewport, 'is-overlay': overlay }"
      :style="overlayStyle"
    >
      <div class="loader-content">
        <!-- Logo Display -->
        <div v-if="showLogo" class="logo-wrapper">
          <img
            :src="logoSrc"
            alt="BBEK Logo"
            class="loader-logo"
            :style="logoStyle"
          />
        </div>

        <!-- Spinner/Progress Display -->
        <div class="spinner-wrapper">
          <!-- Circular Progress (for sequential loading) -->
          <v-progress-circular
            v-if="progress !== null"
            :model-value="progress"
            :size="spinnerSize"
            :width="spinnerWidth"
            color="primary"
          >
            <slot name="progress-content">
              <span class="progress-info">{{ Math.round(progress) }}%</span>
            </slot>
          </v-progress-circular>

          <!-- Standard Loading Spinner -->
          <div
            v-else
            class="standard-spinner"
            :style="spinnerStyle"
          ></div>
        </div>

        <!-- Message Display -->
        <div v-if="message || $slots.message" class="message-container">
          <slot name="message">
            <h3 v-if="message" class="text-h6 font-weight-bold">{{ message }}</h3>
            <p v-if="subtitle" class="text-subtitle-2 text-grey-darken-1 mt-1">{{ subtitle }}</p>
          </slot>
          <slot name="extra-content"></slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  // If true, takes up fixed screen space (z-index 99999)
  // If false, takes up absolute parent space (z-index 100)
  viewport: {
    type: Boolean,
    default: false
  },
  // Adds background
  overlay: {
    type: Boolean,
    default: true
  },
  showLogo: {
    type: Boolean,
    default: true
  },
  logoSrc: {
    type: String,
    default: '/logo-watermark.png'
  },
  logoSize: {
    type: [Number, String],
    default: 180
  },
  message: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  // Progress value (0-100)
  progress: {
    type: Number,
    default: null
  },
  background: {
    type: String,
    default: ''
  },
  zIndex: {
    type: Number,
    default: null
  }
})

const overlayStyle = computed(() => {
  const styles = {
    backgroundColor: props.background || (props.viewport ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.85)'),
    zIndex: props.zIndex || (props.viewport ? 99999 : 1000)
  }
  return styles
})

const logoStyle = computed(() => {
  const size = typeof props.logoSize === 'number' ? `${props.logoSize}px` : props.logoSize
  return {
    width: size,
    height: size
  }
})

const spinnerStyle = computed(() => ({
  borderTopColor: '#0cbdaa' // Use project's teal color
}))

const spinnerSize = computed(() => 72)
const spinnerWidth = computed(() => 6)
</script>

<style scoped>
.page-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  transition: all 0.5s ease;
}

.is-viewport {
  position: fixed;
  width: 100vw;
  height: 100vh;
}

.is-overlay:not(.is-viewport) {
  position: absolute;
  width: 100%;
  height: 100%;
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  max-width: 80%;
}

.loader-logo {
  object-fit: contain;
  animation: logo-pulse 2.5s ease-in-out infinite;
}

.standard-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e0e0e0;
  border-radius: 50%;
  animation: spinner-spin 1s linear infinite;
}

.message-container {
  text-align: center;
  color: #2c3e50;
}

.progress-info {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
}

/* Animations */
@keyframes logo-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
    filter: drop-shadow(0 0 0 rgba(12, 189, 170, 0));
  }
  50% {
    transform: scale(1.04);
    opacity: 0.85;
    filter: drop-shadow(0 0 15px rgba(12, 189, 170, 0.2));
  }
}

@keyframes spinner-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
