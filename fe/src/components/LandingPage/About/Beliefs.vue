<template>
  <div class="beliefs-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div
        class="hero-background"
        :style="{ backgroundImage: `url(${beliefData.heroImage || getImageUrl('/img/beliefs.jpg')})` }"
        @error="handleHeroImageError"
      ></div>
      <div class="hero-overlay-gradient"></div>
      
      <!-- Floating Elements -->
      <div class="floating-elements">
        <div
          v-for="(element, index) in floatingElements"
          :key="index"
          class="floating-element"
          :style="element.style"
        ></div>
      </div>

      <div class="hero-content-wrapper">
        <h1 class="hero-title fade-in-up">{{ beliefData.heroTitle || 'Our Beliefs' }}</h1>
        <p class="hero-subtitle fade-in-up-delay">{{ beliefData.heroSubtitle || 'Anchored in truth, united in love, living for Christ.' }}</p>
      </div>
    </section>

    <!-- Doctrinal Statement -->
    <section class="py-20 bg-white">
      <v-container>
        <h2 class="text-h3 text-md-h4 text-lg-h3 font-weight-bold text-center text-grey-darken-3 mb-16 fade-in-up">
          {{ beliefData.doctrinalTitle || 'Doctrinal Statement' }}
        </h2>
        <v-card class="pa-12 mb-16" elevation="2">
          <p class="text-h6 text-grey-darken-1 text-center mb-12">
            {{ beliefData.doctrinalText || 'We believe that doctrine matters — not because it divides, but because it anchors our faith in truth. While misunderstandings can create division, essential biblical teachings are non-negotiable for us. At the same time, we honor freedom in areas where Scripture allows for diversity. Above all, we strive to grow in love.' }}
          </p>
          <v-row>
            <v-col cols="12" md="4">
              <v-card class="text-center pa-8 belief-card belief-card-1" elevation="2" hover>
                <h3 class="text-h5 font-weight-bold text-grey-darken-3 mb-4">{{ beliefData.essentialsTitle || 'In essentials, unity.' }}</h3>
                <p class="text-body-1 text-grey-darken-1">
                  {{ beliefData.essentialsText || 'We hold tightly to core Christian truths.' }}
                </p>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card class="text-center pa-8 belief-card belief-card-2" elevation="2" hover>
                <h3 class="text-h5 font-weight-bold text-grey-darken-3 mb-4">{{ beliefData.libertyTitle || 'In non-essentials, liberty.' }}</h3>
                <p class="text-body-1 text-grey-darken-1">
                  {{ beliefData.libertyText || 'We give grace for secondary theological convictions.' }}
                </p>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card class="text-center pa-8 belief-card belief-card-3" elevation="2" hover>
                <h3 class="text-h5 font-weight-bold text-grey-darken-3 mb-4">{{ beliefData.loveTitle || 'In all things, love.' }}</h3>
                <p class="text-body-1 text-grey-darken-1">
                  {{ beliefData.loveText || 'Everything we believe and do is rooted in the love of Christ.' }}
                </p>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-container>
    </section>

    <!-- Core Beliefs -->
    <section class="py-20 bg-white">
      <v-container>
        <h2 class="text-h3 text-md-h4 text-lg-h3 font-weight-bold text-center text-grey-darken-3 mb-16 fade-in-up">
          {{ beliefData.coreBeliefsTitle || 'Our Core Beliefs' }}
        </h2>
        <v-card class="pa-12 mb-16" elevation="2">
          <p class="text-h6 text-grey-darken-1 text-center mb-12">
            {{ beliefData.coreBeliefsSubtitle || 'Our core beliefs are the foundation of our faith and practice. Here are the key doctrines we hold to, guiding our understanding of God, Scripture, and the Christian life.' }}
          </p>
          <v-row>
            <v-col
              v-for="(belief, index) in coreBeliefsData"
              :key="index"
              cols="12"
              md="6"
              lg="4"
            >
              <v-card :class="`pa-8 h-100 core-belief-card core-belief-card-${index + 1}`" elevation="2" hover>
                <h3 class="text-h6 font-weight-bold text-grey-darken-3 mb-4">{{ belief.title }}</h3>
                <p class="text-body-2 text-grey-darken-1">{{ belief.description }}</p>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-container>
    </section>

    <!-- Why These Beliefs Matter -->
    <section class="py-20 bg-white">
      <v-container>
        <h2 class="text-h3 text-md-h4 text-lg-h3 font-weight-bold text-center text-grey-darken-3 mb-16 fade-in-up">
          {{ beliefData.matterTitle || 'Why These Beliefs Matter' }}
        </h2>
        <v-card class="pa-12 mb-16" elevation="2">
          <p class="text-h6 text-grey-darken-1 text-center mb-12">
            {{ beliefData.matterSubtitle || 'These core beliefs are not just doctrines—they shape our community, guide our decisions, and inspire our mission to love and serve others.' }}
          </p>
          <v-row>
            <v-col cols="12" md="4">
              <v-card class="text-center pa-8 matter-card matter-card-1" elevation="2" hover>
                <h3 class="text-h5 font-weight-bold text-teal mb-4">{{ beliefData.clarityTitle || 'Clarity' }}</h3>
                <p class="text-body-1 text-grey-darken-1">
                  {{ beliefData.clarityText || 'These beliefs articulate who we are and what guides our decisions — from teaching to mission.' }}
                </p>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card class="text-center pa-8 matter-card matter-card-2" elevation="2" hover>
                <h3 class="text-h5 font-weight-bold text-teal mb-4">{{ beliefData.unityTitle || 'Unity' }}</h3>
                <p class="text-body-1 text-grey-darken-1">
                  {{ beliefData.unityText || 'They help us remain grounded together, even as we differ on less central issues.' }}
                </p>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card class="text-center pa-8 matter-card matter-card-3" elevation="2" hover>
                <h3 class="text-h5 font-weight-bold text-teal mb-4">{{ beliefData.matterLoveTitle || 'Love' }}</h3>
                <p class="text-body-1 text-grey-darken-1">
                  {{ beliefData.matterLoveText || 'Theology without love is incomplete. These beliefs shape not just what we think, but how we live and love.' }}
                </p>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-container>
    </section>

    <!-- Back Button -->
    <section class="py-12 text-center bg-white">
      <v-btn
        :color="beliefData.backButtonColor || '#14b8a6'"
        class="text-white"
        size="large"
        rounded
        @click="$router.push('/about')"
      >
        {{ beliefData.backButtonText || 'Back to About' }}
      </v-btn>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/api/axios'

const getImageUrl = (imagePath) => {
  const parts = imagePath.split('/')
  const filename = parts.pop()
  const encodedFilename = encodeURIComponent(filename)
  return parts.join('/') + '/' + encodedFilename
}

const handleHeroImageError = (event) => {
  const target = event.target || event.currentTarget
  if (target) {
    target.style.backgroundImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
}

const floatingElements = ref([
  { style: { top: '40px', left: '40px', width: '64px', height: '64px', animationDelay: '0s' } },
  { style: { top: '80px', right: '80px', width: '48px', height: '48px', animationDelay: '1s' } },
  { style: { bottom: '80px', left: '80px', width: '56px', height: '56px', animationDelay: '2s' } },
  { style: { bottom: '40px', right: '40px', width: '40px', height: '40px', animationDelay: '0.5s' } },
  { style: { top: '50%', left: '33%', width: '32px', height: '32px', animationDelay: '1.5s' } },
  { style: { top: '25%', left: '25%', width: '24px', height: '24px', animationDelay: '0.8s' } },
  { style: { bottom: '33%', left: '50%', width: '36px', height: '36px', animationDelay: '2.2s' } },
  { style: { top: '75%', left: '40px', width: '20px', height: '20px', animationDelay: '1.8s' } },
  { style: { bottom: '25%', right: '25%', width: '28px', height: '28px', animationDelay: '0.3s' } },
  { style: { top: '33%', right: '40px', width: '44px', height: '44px', animationDelay: '2.8s' } },
  { style: { top: '50%', right: '33%', width: '16px', height: '16px', animationDelay: '1.1s' } },
  { style: { bottom: '50%', left: '25%', width: '52px', height: '52px', animationDelay: '0.9s' } }
])

const defaultCoreBeliefs = [
  {
    title: "The Bible",
    description: "We affirm the Bible as God's inspired, authoritative Word. It is without error in its original manuscripts and serves as the ultimate guide for faith and life."
  },
  {
    title: "God",
    description: "There is one eternal God, Creator of all. He exists eternally in three persons — Father, Son, and Holy Spirit — each equally divine."
  },
  {
    title: "Jesus Christ",
    description: "Jesus is fully God and fully man. He was virgin-born, lived a sinless life, did miracles, died on the cross, rose bodily from the dead, and ascended to reign. He is coming again to establish His Kingdom."
  },
  {
    title: "The Holy Spirit",
    description: "The Holy Spirit is co-equal and co-eternal with the Father and Son. He convicts the world of sin, regenerates believers, dwells within us, and empowers us to live for Christ."
  },
  {
    title: "Humanity",
    description: "Every person is made in the image of God and has inherent dignity. But because of sin, we are separated from God. Human rebellion has real, eternal consequences."
  },
  {
    title: "Salvation",
    description: "Salvation is a free gift of God's grace. It is received through personal faith in Jesus Christ, and not by any works. Through Jesus' sacrifice, we are forgiven, adopted into God's family, and given new life."
  },
  {
    title: "Sanctification",
    description: "When we trust Christ, we are set apart for God. The Holy Spirit continues His work in us, renewing our minds and transforming our lives. Our holiness is not based on our performance, but on our identity in Christ."
  },
  {
    title: "The Church",
    description: "There is one true Church — the global body of believers. The local church is a community of believers who gather for worship, fellowship, discipleship, and mission. We believe in the priesthood of all believers and that the Church is both a spiritual reality and a visible community."
  },
  {
    title: "Kingdom of God",
    description: "Jesus has been given all authority in heaven and on earth (Matthew 28:18). Our citizenship is in His Kingdom, not in earthly systems. We live as ambassadors of His Kingdom, loving others, making disciples, and upholding His rule."
  },
  {
    title: "Creeds",
    description: "We affirm historic Christian creeds as faithful summaries of biblical truth. In particular, we embrace the Apostles' Creed as a unifying declaration of our faith."
  }
]

const beliefData = ref({
  heroTitle: 'Our Beliefs',
  heroSubtitle: 'Anchored in truth, united in love, living for Christ.',
  heroImage: null,
  doctrinalTitle: 'Doctrinal Statement',
  doctrinalText: 'We believe that doctrine matters — not because it divides, but because it anchors our faith in truth. While misunderstandings can create division, essential biblical teachings are non-negotiable for us. At the same time, we honor freedom in areas where Scripture allows for diversity. Above all, we strive to grow in love.',
  essentialsTitle: 'In essentials, unity.',
  essentialsText: 'We hold tightly to core Christian truths.',
  libertyTitle: 'In non-essentials, liberty.',
  libertyText: 'We give grace for secondary theological convictions.',
  loveTitle: 'In all things, love.',
  loveText: 'Everything we believe and do is rooted in the love of Christ.',
  coreBeliefsTitle: 'Our Core Beliefs',
  coreBeliefsSubtitle: 'Our core beliefs are the foundation of our faith and practice. Here are the key doctrines we hold to, guiding our understanding of God, Scripture, and the Christian life.',
  matterTitle: 'Why These Beliefs Matter',
  matterSubtitle: 'These core beliefs are not just doctrines—they shape our community, guide our decisions, and inspire our mission to love and serve others.',
  clarityTitle: 'Clarity',
  clarityText: 'These beliefs articulate who we are and what guides our decisions — from teaching to mission.',
  unityTitle: 'Unity',
  unityText: 'They help us remain grounded together, even as we differ on less central issues.',
  matterLoveTitle: 'Love',
  matterLoveText: 'Theology without love is incomplete. These beliefs shape not just what we think, but how we live and love.',
  backButtonText: 'Back to About',
  backButtonColor: '#14b8a6'
})

const coreBeliefsData = ref(defaultCoreBeliefs)

// Fetch belief data from CMS
const fetchBeliefData = async () => {
  try {
    const response = await axios.get('/cms/belief/full')
    if (response.data.success && response.data.data) {
      const { page, images: cmsImages } = response.data.data
      const content = page?.content || {}
      
      console.log('CMS Response - Belief:', { content, cmsImages })
      
      // Update belief data from content
      if (content.heroTitle) beliefData.value.heroTitle = content.heroTitle
      if (content.heroSubtitle) beliefData.value.heroSubtitle = content.heroSubtitle
      if (content.doctrinalTitle) beliefData.value.doctrinalTitle = content.doctrinalTitle
      if (content.doctrinalText) beliefData.value.doctrinalText = content.doctrinalText
      if (content.essentialsTitle) beliefData.value.essentialsTitle = content.essentialsTitle
      if (content.essentialsText) beliefData.value.essentialsText = content.essentialsText
      if (content.libertyTitle) beliefData.value.libertyTitle = content.libertyTitle
      if (content.libertyText) beliefData.value.libertyText = content.libertyText
      if (content.loveTitle) beliefData.value.loveTitle = content.loveTitle
      if (content.loveText) beliefData.value.loveText = content.loveText
      if (content.coreBeliefsTitle) beliefData.value.coreBeliefsTitle = content.coreBeliefsTitle
      if (content.coreBeliefsSubtitle) beliefData.value.coreBeliefsSubtitle = content.coreBeliefsSubtitle
      if (content.matterTitle) beliefData.value.matterTitle = content.matterTitle
      if (content.matterSubtitle) beliefData.value.matterSubtitle = content.matterSubtitle
      if (content.clarityTitle) beliefData.value.clarityTitle = content.clarityTitle
      if (content.clarityText) beliefData.value.clarityText = content.clarityText
      if (content.unityTitle) beliefData.value.unityTitle = content.unityTitle
      if (content.unityText) beliefData.value.unityText = content.unityText
      if (content.matterLoveTitle) beliefData.value.matterLoveTitle = content.matterLoveTitle
      if (content.matterLoveText) beliefData.value.matterLoveText = content.matterLoveText
      if (content.backButtonText) beliefData.value.backButtonText = content.backButtonText
      if (content.backButtonColor) {
        beliefData.value.backButtonColor = content.backButtonColor
        console.log('Back button color from CMS:', content.backButtonColor)
      }
      
      // Handle hero image - images are stored as BLOB, returned as base64 in images object
      // The image is stored with field_name = 'heroImage' in tbl_cms_images
      if (cmsImages && typeof cmsImages === 'object' && cmsImages.heroImage) {
        const heroImageBase64 = cmsImages.heroImage
        if (heroImageBase64 && typeof heroImageBase64 === 'string' && heroImageBase64.startsWith('data:image/')) {
          beliefData.value.heroImage = heroImageBase64
          console.log('✅ Hero image loaded from CMS (BLOB converted to base64)')
        } else {
          console.log('⚠️ Hero image in CMS is not a valid base64 image')
        }
      } else {
        console.log('ℹ️ No hero image found in CMS, using default')
      }
      
      // Handle core beliefs array
      if (content.coreBeliefs && Array.isArray(content.coreBeliefs) && content.coreBeliefs.length > 0) {
        coreBeliefsData.value = content.coreBeliefs.map(belief => ({
          title: belief.title || '',
          description: belief.description || ''
        }))
        console.log('✅ Core beliefs loaded from CMS:', coreBeliefsData.value.length, 'items')
      } else {
        console.log('ℹ️ No core beliefs found in CMS, using defaults')
      }
      
      console.log('✅ Belief CMS data loaded successfully')
    } else {
      console.log('⚠️ No CMS data found for Belief, using defaults')
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error fetching belief data from CMS:', error)
    } else {
      console.log('CMS page not found (404), using default values')
    }
  }
}

onMounted(async () => {
  await fetchBeliefData()
})
</script>

<style scoped>
.beliefs-page {
  min-height: 100vh;
  background: white;
  margin-top: 64px;
  font-family: 'Georgia', serif;
  font-style: italic;
}

/* Apply Georgia serif italic to all text content */
.beliefs-page :deep(.v-card-text),
.beliefs-page :deep(.text-h3),
.beliefs-page :deep(.text-h4),
.beliefs-page :deep(.text-h5),
.beliefs-page :deep(.text-h6),
.beliefs-page :deep(.text-body-1),
.beliefs-page :deep(.text-body-2),
.beliefs-page :deep(p),
.beliefs-page :deep(h1),
.beliefs-page :deep(h2),
.beliefs-page :deep(h3),
.beliefs-page :deep(h4),
.beliefs-page :deep(h5),
.beliefs-page :deep(h6) {
  font-family: 'Georgia', serif !important;
  font-style: italic !important;
  text-shadow: none !important;
}

.hero-section {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.hero-overlay-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4));
}

.floating-elements {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.floating-element {
  position: absolute;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  animation: float 3.5s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.hero-content-wrapper {
  position: relative;
  z-index: 10;
  text-align: center;
  color: white;
  padding: 40px;
  max-width: 80rem;
}

.hero-title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  font-family: 'Georgia', serif;
  font-style: italic;
}

.hero-subtitle {
  font-size: 1.25rem;
  font-family: 'Georgia', serif;
  font-style: italic;
}

@media (max-width: 960px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
}

.fade-in-up {
  animation: fadeInUp 0.8s ease-out;
}

.fade-in-up-delay {
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.belief-card,
.core-belief-card,
.matter-card {
  animation: fadeInUp 0.6s ease-out both;
  transition: all 0.3s ease;
}

.belief-card:hover,
.core-belief-card:hover,
.matter-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.belief-card-1 { animation-delay: 200ms; }
.belief-card-2 { animation-delay: 300ms; }
.belief-card-3 { animation-delay: 400ms; }

.core-belief-card-1 { animation-delay: 200ms; }
.core-belief-card-2 { animation-delay: 250ms; }
.core-belief-card-3 { animation-delay: 300ms; }
.core-belief-card-4 { animation-delay: 350ms; }
.core-belief-card-5 { animation-delay: 400ms; }
.core-belief-card-6 { animation-delay: 450ms; }
.core-belief-card-7 { animation-delay: 500ms; }
.core-belief-card-8 { animation-delay: 550ms; }
.core-belief-card-9 { animation-delay: 600ms; }
.core-belief-card-10 { animation-delay: 650ms; }

.matter-card-1 { animation-delay: 200ms; }
.matter-card-2 { animation-delay: 300ms; }
.matter-card-3 { animation-delay: 400ms; }

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
</style>

