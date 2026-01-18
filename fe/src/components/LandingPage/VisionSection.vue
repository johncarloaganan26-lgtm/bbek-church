<template>
  <section class="vision-section" style="position: relative;">
    <!-- Loading overlay -->
    <v-overlay :model-value="isLoadingHome" contained class="align-center justify-center" style="z-index: 10;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </v-overlay>
    
    <v-container>
      <v-row align="center" class="gap-12">
        <!-- Left Side - Text Content -->
        <v-col cols="12" md="6">
          <h2
            class="vision-title text-h3 text-md-h4 font-weight-bold text-grey-darken-3 mb-6"
            style="font-family: 'Georgia', serif; font-style: italic;"
          >
            {{ visionTitle }}
          </h2>
          <p
            class="vision-subtitle text-h6 text-grey-darken-1 mb-8"
            style="font-family: 'Georgia', serif; font-style: italic; line-height: 1.6;"
          >
            {{ visionSubtitle }}
          </p>

          <div class="vision-items">
            <v-card
              v-for="(item, index) in visionItems"
              :key="index"
              :class="`mb-6 vision-card vision-card-${index + 1}`"
              variant="flat"
              color="teal-lighten-5"
              elevation="1"
            >
              <v-card-text class="pa-6">
                <h3
                  class="vision-item-title text-h6 font-weight-bold text-teal-darken-3 mb-3"
                  style="font-family: 'Georgia', serif; font-style: italic;"
                >
                  {{ item.title }}
                </h3>
                <p
                  class="vision-item-description text-body-1 text-teal-darken-2"
                  style="font-family: 'Georgia', serif; font-style: italic; line-height: 1.7;"
                >
                  {{ item.description }}
                </p>
              </v-card-text>
            </v-card>
          </div>
        </v-col>

        <!-- Right Side - Image -->
        <v-col cols="12" md="6">
          <v-img
            :src="visionImage"
            height="80vh"
            cover
            class="rounded-lg"
            alt="Our Vision"
          ></v-img>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCmsStore } from '@/stores/cmsStore'

const cmsStore = useCmsStore()

// Loading state for CMS data
const isLoadingHome = computed(() => cmsStore.isPageLoading('home'))

const visionTitle = ref('We look forward to meeting you')
const visionSubtitle = ref('We look forward to welcoming you into our family of faith. Our vision is to be a Christ-centered community that...')
const visionImage = ref('/img/hm.jpg')
const visionBgColor = ref('#ffffff')

const visionItems = ref([
  {
    title: 'Live By Faith',
    description: 'Live by Faith - Boldly proclaim and position the Gospel in daily life. Trust God\'s promises with unwavering confidence.'
  },
  {
    title: 'Known By Love',
    description: 'Known by Love - Extend grace without judgment - love God, love people. Serve others sacrificially, going beyond what is expected.'
  },
  {
    title: 'A Vision of Hope',
    description: 'A Vision of Hope - Declare Jesus as our \'Blessed Redeemer\' (Colossians 3:12). Keep our eyes fixed on eternity, living with Kingdom perspective.'
  }
])

// Fetch home data from CMS using shared store
const fetchHomeData = async () => {
  try {
    const cmsData = await cmsStore.fetchPageData('home')
    if (cmsData) {
      const { page, images } = cmsData
      const content = page?.content || {}
      
      // Update vision data
      visionTitle.value = content.visionTitle || visionTitle.value
      visionSubtitle.value = content.visionSubtitle || visionSubtitle.value
      visionBgColor.value = content.visionBgColor || visionBgColor.value
      
      // Update vision items
      if (content.liveByFaith) {
        visionItems.value[0].description = content.liveByFaith
      }
      if (content.knownByLove) {
        visionItems.value[1].description = content.knownByLove
      }
      if (content.visionOfHope) {
        visionItems.value[2].description = content.visionOfHope
      }
      
      // Handle vision image
      if (images?.visionImage) {
        visionImage.value = images.visionImage
      }
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching home data from CMS:', error)
    }
  }
}

onMounted(async () => {
  await fetchHomeData()
})
</script>

<style scoped>
.vision-section {
  padding: 80px 0;
  margin-bottom: 80px;
  background-color: v-bind(visionBgColor);
}

.vision-card {
  border-left: 4px solid #14b8a6;
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease-out both;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.vision-card-1 {
  animation-delay: 200ms;
}

.vision-card-2 {
  animation-delay: 300ms;
}

.vision-card-3 {
  animation-delay: 400ms;
}

.vision-card:hover {
  transform: translateX(8px) translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  border-left-width: 6px;
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.05), rgba(20, 184, 166, 0.02));
}

.vision-section :deep(.v-img) {
  transition: transform 0.5s ease;
}

.vision-section :deep(.v-img:hover) {
  transform: scale(1.05);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 960px) {
  .vision-section {
    padding: 48px 0;
    margin-bottom: 48px;
  }

  .vision-section :deep(.v-img) {
    height: 400px !important;
    margin-top: 24px;
  }
}

@media (max-width: 640px) {
  .vision-section {
    padding: 32px 0;
    margin-bottom: 32px;
  }

  .vision-section :deep(.text-h3) {
    font-size: 1.5rem !important;
  }

  .vision-section :deep(.text-h6) {
    font-size: 1rem !important;
  }

  .vision-section :deep(.v-img) {
    height: 300px !important;
  }

  .vision-card {
    margin-bottom: 16px !important;
  }
}
</style>

