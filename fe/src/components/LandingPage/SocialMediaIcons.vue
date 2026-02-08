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
}
</style>

