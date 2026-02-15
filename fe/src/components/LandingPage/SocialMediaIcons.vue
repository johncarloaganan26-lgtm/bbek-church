<template>
  <div class="social-media-icons">
    <v-btn
      icon
      size="large"
      class="social-icon facebook-icon"
      href="https://www.facebook.com/biblebaptist.ekklesiaofkawit"
      target="_blank"
      rel="noopener noreferrer"
    >
      <v-icon color="white" size="24">mdi-facebook</v-icon>
    </v-btn>

    <v-btn
      icon
      size="large"
      class="social-icon instagram-icon"
      href="#"
      target="_blank"
      rel="noopener noreferrer"
    >
      <v-icon color="white" size="24">mdi-instagram</v-icon>
    </v-btn>

    <v-btn
      icon
      size="large"
      class="social-icon youtube-icon"
      href="https://www.youtube.com/@bbek4112"
      target="_blank"
      rel="noopener noreferrer"
    >
      <v-icon color="white" size="24">mdi-youtube</v-icon>
    </v-btn>

    <v-btn
      icon
      size="large"
      class="social-icon email-icon"
      href="mailto:biblebaptistekklesiaofkawit@gmail.com"
    >
      <v-icon color="white" size="24">mdi-email</v-icon>
    </v-btn>

    <!-- Membership Path Icon (Catchy Focus) -->
    <div class="membership-wrapper">
      <div class="membership-label">Join the Family</div>
      <v-btn
        icon
        size="large"
        class="social-icon membership-icon pulse-teal"
        @click="$router.push('/beoneofus/discipleship')"
      >
        <v-icon color="white" size="24">mdi-map-marker-path</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
// Component for fixed social media icons
</script>

<style scoped>
.social-media-icons {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.social-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.social-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.facebook-icon {
  background-color: #1877f2;
}

.facebook-icon:hover {
  background-color: #166fe5;
}

.instagram-icon {
  background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
}

.instagram-icon:hover {
  opacity: 0.9;
}

.youtube-icon {
  background-color: #ff0000;
}

.youtube-icon:hover {
  background-color: #e60000;
}

.email-icon {
  background-color: #000000;
}

.email-icon:hover {
  background-color: #333333;
}

.membership-icon {
  background-color: #0cbdaa;
  z-index: 2;
}

.membership-icon:hover {
  background-color: #0aa696;
}

.membership-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.membership-label {
  position: absolute;
  right: 55px;
  background: #0cbdaa;
  color: white;
  padding: 8px 16px;
  border-radius: 30px;
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(12, 189, 170, 0.3);
  pointer-events: none;
  animation: peek-a-boo 6s infinite ease-in-out;
}

@keyframes peek-a-boo {
  0%, 10% { opacity: 0; transform: translateX(20px); }
  20%, 50% { opacity: 1; transform: translateX(0); }
  60%, 100% { opacity: 0; transform: translateX(20px); }
}

.pulse-teal {
  animation: social-pulse 2s infinite;
}

@keyframes social-pulse {
  0% { box-shadow: 0 0 0 0 rgba(12, 189, 170, 0.7); }
  70% { box-shadow: 0 0 0 15px rgba(12, 189, 170, 0); }
  100% { box-shadow: 0 0 0 0 rgba(12, 189, 170, 0); }
}

@media (max-width: 960px) {
  .social-media-icons {
    right: 10px;
  }
  
  .social-icon {
    width: 40px;
    height: 40px;
  }
  
  .social-icon :deep(.v-icon) {
    font-size: 20px !important;
  }

  .membership-label {
    display: none; /* Hide label on mobile to save space */
  }
}
</style>

