<template>
  <section class="department-slideshow-section py-16">
    <v-container>
      <!-- Section Header -->
      <div class="mb-16">
        <h1
          class="text-h3 text-md-h4 font-weight-bold text-black mb-4 fade-in-up"
          style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);"
        >
          {{ cmsData.sectionTitle || 'Our Departments' }}
        </h1>
        <p
          class="text-h6 text-grey-darken-1 fade-in-up-delay"
          style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3); line-height: 1.6;"
        >
          {{ cmsData.sectionSubtitle || 'Discover our various ministries designed to help you grow in faith and serve our community.' }}
        </p>
      </div>

      <!-- Slideshow Container -->
      <div class="slideshow-container">
        <!-- Slides -->
        <div
          v-for="(slide, index) in departmentSlides"
          :key="slide.id"
          class="slide"
          :class="{ 'active': currentSlide === index }"
        >
          <div class="slide-content">
            <!-- Left Side - Image -->
            <div class="slide-image">
              <v-img
                :src="slide.image"
                :alt="slide.title"
                class="department-image"
                cover
              />
            </div>

            <!-- Right Side - Text Content -->
            <div class="slide-text">
              <h2
                class="slide-title"
                style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);"
              >
                {{ slide.title }}
              </h2>
              <p
                class="slide-description"
                style="font-family: 'Georgia', serif; font-style: italic; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3); line-height: 1.7;"
              >
                {{ slide.description }}
              </p>
              <v-btn
                color="#14b8a6"
                variant="flat"
                class="learn-more-btn"
                @click="navigateToCategory(slide.category)"
              >
                {{ slide.buttonText }}
              </v-btn>
            </div>
          </div>
        </div>

        <!-- Navigation Dots -->
        <div class="slide-navigation">
          <button
            v-for="(slide, index) in departmentSlides"
            :key="slide.id"
            class="nav-dot"
            :class="{ 'active': currentSlide === index }"
            @click="goToSlide(index)"
          ></button>
        </div>

        <!-- Navigation Arrows -->
        <button class="nav-arrow nav-arrow-prev" @click="prevSlide">
          <v-icon>mdi-chevron-left</v-icon>
        </button>
        <button class="nav-arrow nav-arrow-next" @click="nextSlide">
          <v-icon>mdi-chevron-right</v-icon>
        </button>
      </div>
    </v-container>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCms } from '@/composables/useCms'

const router = useRouter()

// Use CMS composable for proper caching and cross-tab sync
const { loadPageData } = useCms('departmentcategories')

// CMS Data
const cmsData = ref({
  sectionTitle: 'Our Departments',
  sectionSubtitle: 'Discover our various ministries designed to help you grow in faith and serve our community.',
  adultLabel: 'ADULT',
  adultName: 'John + Jane Doe',
  adultDescription: 'Helping adults grow in spiritual maturity, strengthen families, and live out faith through community and service.',
  ladiesLabel: 'LADIES',
  ladiesName: 'Jane Smith',
  ladiesDescription: 'Encouraging women to live with grace and faith through prayer, service, and fellowship centered on God\'s Word.',
  youthLabel: 'YOUTH',
  youthName: 'Mike Johnson',
  youthDescription: 'Guiding the next generation to follow Christ with purpose, energy, and joy through youth activities and Bible study.',
  buttonColor: '#14b8a6',
  adultBackgroundImage: '/img/events.jpg',
  ladiesBackgroundImage: '/img/beliefs.jpg',
  youthBackgroundImage: '/img/CHILDREN%20MINISTRY/480913749_2154533405062033_2452182531715777334_n.jpg'
})

// Slideshow state
const currentSlide = ref(0)
const autoPlayInterval = ref(null)

// Department slides data
const departmentSlides = ref([
  {
    id: 1,
    title: 'Adult Ministry',
    description: 'Helping adults grow in spiritual maturity, strengthen families, and live out faith through community and service.',
    image: '/img/events.jpg',
    buttonText: 'Learn More',
    category: 'adult'
  },
  {
    id: 2,
    title: 'Ladies Ministry',
    description: 'Encouraging women to live with grace and faith through prayer, service, and fellowship centered on God\'s Word.',
    image: '/img/beliefs.jpg',
    buttonText: 'Learn More',
    category: 'ladies'
  },
  {
    id: 3,
    title: 'Youth Ministry',
    description: 'Guiding the next generation to follow Christ with purpose, energy, and joy through youth activities and Bible study.',
    image: '/img/CHILDREN%20MINISTRY/480913749_2154533405062033_2452182531715777334_n.jpg',
    buttonText: 'Learn More',
    category: 'youth'
  }
])

// Slideshow methods
const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % departmentSlides.value.length
}

const prevSlide = () => {
  currentSlide.value = currentSlide.value === 0
    ? departmentSlides.value.length - 1
    : currentSlide.value - 1
}

const goToSlide = (index) => {
  currentSlide.value = index
}

const startAutoPlay = () => {
  autoPlayInterval.value = setInterval(() => {
    nextSlide()
  }, 5000) // Change slide every 5 seconds
}

const stopAutoPlay = () => {
  if (autoPlayInterval.value) {
    clearInterval(autoPlayInterval.value)
    autoPlayInterval.value = null
  }
}

// Fetch CMS data using useCms composable for proper caching
const fetchCmsData = async () => {
  try {
    const cmsContent = await loadPageData()

    if (cmsContent) {
      console.log('CMS Data loaded for Department Categories:', cmsContent)

      // Update cmsData with loaded content
      if (cmsContent.sectionTitle) cmsData.value.sectionTitle = cmsContent.sectionTitle
      if (cmsContent.sectionSubtitle) cmsData.value.sectionSubtitle = cmsContent.sectionSubtitle
      if (cmsContent.adultTitle) cmsData.value.adultTitle = cmsContent.adultTitle
      if (cmsContent.adultDescription) cmsData.value.adultDescription = cmsContent.adultDescription
      if (cmsContent.adultLinkText) cmsData.value.adultLinkText = cmsContent.adultLinkText
      if (cmsContent.ladiesTitle) cmsData.value.ladiesTitle = cmsContent.ladiesTitle
      if (cmsContent.ladiesDescription) cmsData.value.ladiesDescription = cmsContent.ladiesDescription
      if (cmsContent.ladiesLinkText) cmsData.value.ladiesLinkText = cmsContent.ladiesLinkText
      if (cmsContent.youthTitle) cmsData.value.youthTitle = cmsContent.youthTitle
      if (cmsContent.youthDescription) cmsData.value.youthDescription = cmsContent.youthDescription
      if (cmsContent.youthLinkText) cmsData.value.youthLinkText = cmsContent.youthLinkText
      if (cmsContent.buttonColor) cmsData.value.buttonColor = cmsContent.buttonColor
      if (cmsContent.adultBackgroundImage) cmsData.value.adultBackgroundImage = cmsContent.adultBackgroundImage
      if (cmsContent.ladiesBackgroundImage) cmsData.value.ladiesBackgroundImage = cmsContent.ladiesBackgroundImage
      if (cmsContent.youthBackgroundImage) cmsData.value.youthBackgroundImage = cmsContent.youthBackgroundImage

      // Update slides data
      departmentSlides.value = [
        {
          id: 1,
          title: cmsData.value.adultTitle || 'Adult Ministry',
          description: cmsData.value.adultDescription || 'Helping adults grow in spiritual maturity, strengthen families, and live out faith through community and service.',
          image: cmsData.value.adultBackgroundImage || '/img/events.jpg',
          buttonText: cmsData.value.adultLinkText || 'Learn More',
          category: 'adult'
        },
        {
          id: 2,
          title: cmsData.value.ladiesTitle || 'Ladies Ministry',
          description: cmsData.value.ladiesDescription || 'Encouraging women to live with grace and faith through prayer, service, and fellowship centered on God\'s Word.',
          image: cmsData.value.ladiesBackgroundImage || '/img/beliefs.jpg',
          buttonText: cmsData.value.ladiesLinkText || 'Learn More',
          category: 'ladies'
        },
        {
          id: 3,
          title: cmsData.value.youthTitle || 'Youth Ministry',
          description: cmsData.value.youthDescription || 'Guiding the next generation to follow Christ with purpose, energy, and joy through youth activities and Bible study.',
          image: cmsData.value.youthBackgroundImage || '/img/CHILDREN%20MINISTRY/480913749_2154533405062033_2452182531715777334_n.jpg',
          buttonText: cmsData.value.youthLinkText || 'Learn More',
          category: 'youth'
        }
      ]

      console.log('✅ Department Categories CMS data loaded successfully')
    } else {
      console.log('⚠️ No CMS data found for Department Categories, using defaults')
    }
  } catch (error) {
    console.error('Error fetching department categories CMS data:', error)
  }
}

// Navigate to category
const navigateToCategory = (category) => {
  router.push({
    path: '/ministries',
    query: { category }
  })
}

onMounted(async () => {
  await fetchCmsData()
  startAutoPlay()
})

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<style scoped>
.department-slideshow-section {
  background-color: #ffffff;
  position: relative;
  overflow: hidden;
}

/* Accent shapes */
.department-slideshow-section::before {
  content: '';
  position: absolute;
  top: 10%;
  right: 5%;
  width: 120px;
  height: 120px;
  background: rgba(20, 184, 166, 0.1);
  border-radius: 50%;
  z-index: 0;
}

.department-slideshow-section::after {
  content: '';
  position: absolute;
  bottom: 15%;
  left: 8%;
  width: 80px;
  height: 80px;
  background: rgba(56, 189, 248, 0.08);
  border-radius: 50%;
  z-index: 0;
}

.slideshow-container {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  height: 500px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.8s ease-in-out;
  display: flex;
  align-items: center;
}

.slide.active {
  opacity: 1;
}

.slide-content {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
}

.slide-image {
  flex: 1;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.department-image {
  width: 100%;
  height: 100%;
  border-radius: 16px 0 0 16px;
  object-fit: cover;
  filter: brightness(1.1) contrast(1.05) saturate(1.1);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.slide.active .department-image {
  filter: brightness(1.15) contrast(1.1) saturate(1.2);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
  transform: scale(1.02);
}

.slide-text {
  flex: 1;
  padding: 60px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: 0 16px 16px 0;
}

.slide-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
}

.slide-description {
  font-size: 1.125rem;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 500px;
}

.learn-more-btn {
  align-self: flex-start;
  padding: 12px 32px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  text-transform: none;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
  transition: all 0.3s ease;
}

.learn-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
}

/* Navigation Dots */
.slide-navigation {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  z-index: 10;
}

.nav-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  border: 2px solid rgba(20, 184, 166, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-dot.active {
  background-color: #14b8a6;
  border-color: #14b8a6;
  transform: scale(1.2);
}

.nav-dot:hover {
  background-color: rgba(20, 184, 166, 0.8);
  border-color: #14b8a6;
}

/* Navigation Arrows */
.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  z-index: 10;
}

.nav-arrow:hover {
  background-color: #14b8a6;
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 6px 20px rgba(20, 184, 166, 0.3);
}

.nav-arrow-prev {
  left: 20px;
}

.nav-arrow-next {
  right: 20px;
}

.nav-arrow .v-icon {
  color: #64748b;
  font-size: 24px;
}

.nav-arrow:hover .v-icon {
  color: white;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .slide-text {
    padding: 40px;
  }

  .slide-title {
    font-size: 2rem;
  }

  .slide-description {
    font-size: 1rem;
  }
}

@media (max-width: 768px) {
  .slideshow-container {
    height: 600px;
    margin: 0 20px;
  }

  .slide-content {
    flex-direction: column;
    height: auto;
  }

  .slide-image {
    flex: none;
    height: 300px;
  }

  .department-image {
    border-radius: 16px 16px 0 0;
  }

  .slide-text {
    flex: none;
    padding: 30px;
    border-radius: 0 0 16px 16px;
  }

  .slide-title {
    font-size: 1.75rem;
    text-align: center;
  }

  .slide-description {
    font-size: 1rem;
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .learn-more-btn {
    align-self: center;
  }

  .nav-arrow {
    width: 40px;
    height: 40px;
  }

  .nav-arrow .v-icon {
    font-size: 20px;
  }

  .nav-arrow-prev {
    left: 10px;
  }

  .nav-arrow-next {
    right: 10px;
  }

  .slide-navigation {
    bottom: 20px;
  }
}

@media (max-width: 480px) {
  .slideshow-container {
    height: 550px;
    margin: 0 10px;
  }

  .slide-image {
    height: 250px;
  }

  .slide-text {
    padding: 20px;
  }

  .slide-title {
    font-size: 1.5rem;
  }

  .slide-description {
    font-size: 0.9rem;
  }
}

/* Animation for section header */
.fade-in-up {
  animation: fadeInUp 1s ease-out;
}

.fade-in-up-delay {
  animation: fadeInUp 1s ease-out 0.3s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

