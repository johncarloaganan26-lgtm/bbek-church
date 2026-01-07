<template>
  <div class="content-management-container">
    <div class="max-w-7xl mx-auto p-6">
      <!-- Section Navigation -->
      <div class="bg-white rounded-lg p-4 shadow-lg mb-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Content Categories</h3>
        <div class="flex flex-nowrap gap-2 pb-2 overflow-x-auto">
          <v-chip rounded flat
            v-for="section in contentSections"
            :key="section.id"
            @click="handleSectionAction(section)"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-200 cursor-pointer border shrink-0',
              activeSection === section.id
                ? 'bg-blue-500 text-blue border-blue-500 shadow-md hover:bg-blue-600 hover:shadow-lg'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm'
            ]"
          >
            {{ section.label }}
        </v-chip>
        </div>
      </div>
    </div>
   <Header v-if="activeSection === 'header'" :activeSection="activeSection" />
   <Footer v-if="activeSection === 'footer'" :activeSection="activeSection" />
   <Home v-if="activeSection === 'home'" :activeSection="activeSection" />
   <ImNew v-if="activeSection === 'imNew'" :activeSection="activeSection" />
   <About v-if="activeSection === 'about'" :activeSection="activeSection" />
   <OurStory v-if="activeSection === 'ourStory'" :activeSection="activeSection" />
   <ChurchLeader v-if="activeSection === 'churchLeaders'" :activeSection="activeSection" />
   <DepartmentOfficer v-if="activeSection === 'departmentOfficer'" :activeSection="activeSection" />
   <Belief v-if="activeSection === 'beliefs'" :activeSection="activeSection" />
   <Give v-if="activeSection === 'give'" :activeSection="activeSection" />
   <Events v-if="activeSection === 'events'" :activeSection="activeSection" />
   <PastEvents v-if="activeSection === 'pastEvents'" :activeSection="activeSection" />
   <AdultLadies v-if="activeSection === 'adultLadies'" :activeSection="activeSection" />
   <AdultMen v-if="activeSection === 'adultMen'" :activeSection="activeSection" />
   <YoungPeople v-if="activeSection === 'youngPeople'" :activeSection="activeSection" />
   <Services v-if="activeSection === 'services'" :activeSection="activeSection" />
   <WaterBaptism v-if="activeSection === 'waterBaptism'" :activeSection="activeSection" />
   <BurialService v-if="activeSection === 'burialService'" :activeSection="activeSection" />
   <MarriageService v-if="activeSection === 'marriageService'" :activeSection="activeSection" />
   <ChildDedication v-if="activeSection === 'childDedication'" :activeSection="activeSection" />
   <Sermons v-if="activeSection === 'sermons'" :activeSection="activeSection" />
   <PlanVisit v-if="activeSection === 'planVisit'" :activeSection="activeSection" />
   <Ministries v-if="activeSection === 'ministries'" :activeSection="activeSection" />
   <DepartmentCategories v-if="activeSection === 'departmentcategories'" :activeSection="activeSection" />
   <LearnMoreEvents v-if="activeSection === 'learnMoreEvents'" :activeSection="activeSection" />
   <LearnMoreMinistry v-if="activeSection === 'learnMoreMinistry'" :activeSection="activeSection" />
   <AcceptJesus v-if="activeSection === 'acceptJesus'" :activeSection="activeSection" />
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import Header from './ListItems/Header.vue'
import Footer from './ListItems/Footer.vue'
import Home from './ListItems/Home.vue'
import ImNew from './ListItems/ImNew.vue'
import About from './ListItems/About.vue'
import OurStory from './ListItems/OurStory.vue'
import ChurchLeader from './ListItems/ChurchLeader.vue'
import DepartmentOfficer from './ListItems/DepartmentOfficer.vue'
import Belief from './ListItems/Belief.vue'
import Give from './ListItems/Give.vue'
import Events from './ListItems/Events.vue'
import PastEvents from './ListItems/PastEvents.vue'
import AdultLadies from './ListItems/AdultLadies.vue'
import AdultMen from './ListItems/AdultMen.vue'
import YoungPeople from './ListItems/YoungPeople.vue'
import Services from './ListItems/Services.vue'
import WaterBaptism from './ListItems/WaterBaptism.vue'
import BurialService from './ListItems/BurialService.vue'
import MarriageService from './ListItems/MarriageService.vue'
import ChildDedication from './ListItems/ChildDedication.vue'
import Sermons from './ListItems/Sermons.vue'
import PlanVisit from './ListItems/PlanVisit.vue'
import LearnMoreEvents from './ListItems/LearnMoreEvents.vue'
import LearnMoreMinistry from './ListItems/LearnMoreMinistry.vue'
import AcceptJesus from './ListItems/AcceptJesus.vue'
import Ministries from './ListItems/Ministries.vue'
import DepartmentCategories from './ListItems/DepartmentCategories.vue'
const activeSection = ref('header')

// Content sections array with action field
const contentSections = ref([
  {
    id: 'header',
    label: 'Header',
    action: () => {
      activeSection.value = 'header'
    }
  },
  {
    id: 'footer',
    label: 'Footer',
    action: () => {
      activeSection.value = 'footer'
    }
  },
  {
    id: 'home',
    label: 'Home',
    action: () => {
      activeSection.value = 'home'
    }
  },
  {
    id: 'imNew',
    label: "I'm New",
    action: () => {
      activeSection.value = 'imNew'
    }
  },
  {
    id: 'about',
    label: 'About',
    action: () => {
      activeSection.value = 'about'
    }
  },
  {
    id: 'ourStory',
    label: 'Our Story',
    action: () => {
      activeSection.value = 'ourStory'
    }
  },
  {
    id: 'churchLeaders',
    label: 'Church Leaders',
    action: () => {
      activeSection.value = 'churchLeaders'
    }
  },
    {
    id: 'departmentOfficer',
    label: 'Department Officer',
    action: () => {
      activeSection.value = 'departmentOfficer'
    }
  },
  {
    id: 'beliefs',
    label: 'Beliefs',
    action: () => {
      activeSection.value = 'beliefs'
    }
  },
  {
    id: 'give',
    label: 'Give',
    action: () => {
      activeSection.value = 'give'
    }
  },
  {
    id: 'events',
    label: 'Events',
    action: () => {
      activeSection.value = 'events'
    }
  },
  {
    id: 'pastEvents',
    label: 'Past Events',
    action: () => {
      activeSection.value = 'pastEvents'
    }
  },
  // {
  //   id: 'adultLadies',
  //   label: 'Adult Ladies',
  //   action: () => {
  //     activeSection.value = 'adultLadies'
  //   }
  // },
  // {
  //   id: 'adultMen',
  //   label: 'Adult Men',
  //   action: () => {
  //     activeSection.value = 'adultMen'
  //   }
  // },
  // {
  //   id: 'youngPeople',
  //   label: 'Young People',
  //   action: () => {
  //     activeSection.value = 'youngPeople'
  //   }
  // },
  {
    id: 'services',
    label: 'Services',
    action: () => {
      activeSection.value = 'services'
    }
  },
  {
    id: 'waterBaptism',
    label: 'Water Baptism',
    action: () => {
      activeSection.value = 'waterBaptism'
    }
  },
  {
    id: 'burialService',
    label: 'Burial Service',
    action: () => {
      activeSection.value = 'burialService'
    }
  },
  {
    id: 'marriageService',
    label: 'Marriage Service',
    action: () => {
      activeSection.value = 'marriageService'
    }
  },
  {
    id: 'childDedication',
    label: 'Child Dedication',
    action: () => {
      activeSection.value = 'childDedication'
    }
  },
  {
    id: 'sermons',
    label: 'Sermons',
    action: () => {
      activeSection.value = 'sermons'
    }
  },
  {
    id: 'planVisit',
    label: 'Plan Your Visit',
    action: () => {
      activeSection.value = 'planVisit'
    }
  },
  {
    id: 'departmentcategories',
    label: 'Our Departments',
    action: () => {
      activeSection.value = 'departmentcategories'
    }
  },
  {
    id: 'learnMoreEvents',
    label: 'Learn More Events',
    action: () => {
      activeSection.value = 'learnMoreEvents'
    }
  },
  {
    id: 'learnMoreMinistry',
    label: 'Learn More Ministry',
    action: () => {
      activeSection.value = 'learnMoreMinistry'
    }
  },
  {
    id: 'acceptJesus',
    label: 'Accept Jesus Christ',
    action: () => {
      activeSection.value = 'acceptJesus'
    }
  }
])

// Handle section action
const handleSectionAction = (section) => {
  if (section.action && typeof section.action === 'function') {
    section.action()
  } else {
    // Fallback: set activeSection directly if action is not provided
    activeSection.value = section.id
  }
}

// Header data (from React initial state)
const headerData = reactive({
  logo: 'http://localhost:8081/bbek/view_logo',
  logoFile: null,
  acronym: 'BBEK',
  fullName: 'Bible Baptist Eklessia of Kawit',
  bgColor: '#ffffff',
  menuItems: [
    'Home',
    "I'm New",
    'About',
    'Give',
    'Events',
    'Ministry',
    'Services',
    'Sermons'
  ],
  hoverColor: '#14b8a6',
  buttonText: 'Dashboard',
  buttonColor: '#14b8a6'
})

// Footer data (from React initial state, simplified)
const footerData = reactive({
  bgColor: '#000000',
  quickLinks: ['About Us', 'Ministries', 'Events', 'Give', 'Be One of Us'],
  sundayService: '9:30 AM - 12:00 PM',
  wednesdayService: '7:00 PM - 9:00 PM',
  address: '485 Acacia St. Villa Ramirez Tabon 1, Kawit Cavite',
  phone: '09615996049',
  email: 'biblebaptistekklesiaofkawit@gmail.com'
})

// Give page data (from React initial state)
const giveData = reactive({
  heroImg: '/img/give.jpg',
  heroTitle: 'Give Generously',
  heroSubtitle:
    "Your generous donations help us share God's Word, serve our community, and support those in need. Every gift makes a lasting impact.",
  sectionTitle: 'Biblical Giving & Donation',
  biblicalFoundationTitle: 'Biblical Foundation',
  biblicalFoundationText:
    'Biblical giving is an act of worship and obedience to God. The Bible teaches us that everything we have comes from God, and we are called to be faithful stewards of His blessings.',
  purposeTitle: 'Purpose of Giving',
  purposeText:
    "Your generous donations support our church's mission to spread the Gospel, serve our community, and help those in need. Every gift enables us to continue God's work in our midst.",
  chooseMethodText:
    'Choose your preferred method of giving below. Every gift makes a lasting impact.',
  gcashText: 'GCash',
  gcashNumber: '09309224324',
  backBtnText: 'Back to Home',
  backBtnColor: '#14b8a6'
})

const onHeaderMenuChange = (event, index) => {
  headerData.menuItems[index] = event.target.value
}

const onFooterQuickLinkChange = (event, index) => {
  footerData.quickLinks[index] = event.target.value
}

const onLogoChange = (e) => {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    headerData.logo = ev.target?.result || headerData.logo
    headerData.logoFile = file
  }
  reader.readAsDataURL(file)
}

const onImageChange = (e, target, field) => {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    target[field] = ev.target?.result || target[field]
  }
  reader.readAsDataURL(file)
}

const saveContent = () => {
  try {
    localStorage.setItem('headerData', JSON.stringify(headerData))
    localStorage.setItem('footerData', JSON.stringify(footerData))
    localStorage.setItem('giveData', JSON.stringify(giveData))
    // In this Vue version we just persist to localStorage and show a simple alert.
    // You can wire this up to your real API similar to the React version if needed.
    // eslint-disable-next-line no-alert
    alert('Content saved successfully!')
  } catch (e) {
    // eslint-disable-next-line no-alert
    alert('Failed to save content')
    // eslint-disable-next-line no-console
    console.error('Save error:', e)
  }
}
</script>

<style scoped>
/* Ensure proper scrolling for the main container */
.content-management-container {
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  /* Let browser handle vertical scrolling naturally */
  background-color: #f9fafb;
}

/* Optional: basic fallback styling if Tailwind is not available */
table {
  border-spacing: 0;
}

th,
td {
  border: 1px solid #e5e7eb;
}
</style>


