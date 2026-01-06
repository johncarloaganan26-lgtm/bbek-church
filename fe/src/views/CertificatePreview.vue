<template>
  <div class="preview-page">
    <div v-if="!isSpecificCertificate" class="preview-controls no-print">
      <button @click="currentCertificate = 'child'" :class="{ active: currentCertificate === 'child' }" class="preview-btn">
        Child Dedication
      </button>
      <button @click="currentCertificate = 'marriage'" :class="{ active: currentCertificate === 'marriage' }" class="preview-btn">
        Marriage Certificate
      </button>
      <button @click="currentCertificate = 'baptism'" :class="{ active: currentCertificate === 'baptism' }" class="preview-btn">
        Water Baptism
      </button>
      <button @click="currentCertificate = 'death'" :class="{ active: currentCertificate === 'death' }" class="preview-btn">
        Death Certificate
      </button>
    </div>
    
    <div v-if="isSpecificCertificate" class="back-button no-print">
      <button @click="goBack" class="back-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>
    </div>

    <!-- Child Dedication Certificate -->
    <ChildDedicationCertificate
      v-if="currentCertificate === 'child'"
      :child-id="childDedicationData.child_id || childDedicationData.childId || ''"
      :requested-by="childDedicationData.requested_by || childDedicationData.requestedBy || ''"
      :requester-fullname="childDedicationData.requester_fullname || childDedicationData.requesterFullname || ''"
      :requester-firstname="childDedicationData.requester_firstname || ''"
      :requester-lastname="childDedicationData.requester_lastname || ''"
      :requester-middle-name="childDedicationData.requester_middle_name || ''"
      :child-first-name="childDedicationData.child_firstname || childDedicationData.childFirstname || ''"
      :child-middle-name="childDedicationData.child_middle_name || childDedicationData.childMiddlename || ''"
      :child-last-name="childDedicationData.child_lastname || childDedicationData.childLastname || ''"
      :date-of-birth="childDedicationData.date_of_birth || childDedicationData.dateOfBirth || ''"
      :place-of-birth="childDedicationData.place_of_birth || childDedicationData.placeOfBirth || ''"
      :gender="childDedicationData.gender || ''"
      :preferred-dedication-date="childDedicationData.preferred_dedication_date || childDedicationData.preferredDedicationDate || childDedicationData.dedicationDate || ''"
      :contact-phone-number="childDedicationData.contact_phone_number || childDedicationData.contactPhoneNumber || ''"
      :contact-email="childDedicationData.contact_email || childDedicationData.contactEmail || ''"
      :contact-address="childDedicationData.contact_address || childDedicationData.contactAddress || ''"
      :father-first-name="childDedicationData.father_firstname || childDedicationData.fatherFirstname || ''"
      :father-last-name="childDedicationData.father_lastname || childDedicationData.fatherLastname || ''"
      :father-middle-name="childDedicationData.father_middle_name || ''"
      :father-phone-number="childDedicationData.father_phone_number || ''"
      :father-email="childDedicationData.father_email || ''"
      :father-address="childDedicationData.father_address || ''"
      :mother-first-name="childDedicationData.mother_firstname || childDedicationData.motherFirstname || ''"
      :mother-last-name="childDedicationData.mother_lastname || childDedicationData.motherLastname || ''"
      :mother-middle-name="childDedicationData.mother_middle_name || ''"
      :mother-phone-number="childDedicationData.mother_phone_number || ''"
      :mother-email="childDedicationData.mother_email || ''"
      :mother-address="childDedicationData.mother_address || ''"
      :sponsors="childDedicationData.sponsors || []"
      :pastor="childDedicationData.pastor || childDedicationData.ministerName || ''"
      :location="childDedicationData.location || childDedicationData.churchAddress || ''"
      :status="childDedicationData.status || ''"
      :date-created="childDedicationData.date_created || childDedicationData.dateCreated || ''"
      :child-fullname="childDedicationData.child_fullname || childDedicationData.childName || ''"
      :father-fullname="childDedicationData.father_fullname || childDedicationData.fatherName || ''"
      :mother-fullname="childDedicationData.mother_fullname || childDedicationData.motherName || ''"
      :certificate-number="childDedicationData.child_id || childDedicationData.childId || ''"
    />

    <MarriageCertificate
      v-else-if="currentCertificate === 'marriage'"
      :groomName="marriageData.groomName"
      :brideName="marriageData.brideName"
      :marriageDate="marriageData.marriageDate"
      :marriageLocation="marriageData.marriageLocation"
      :sponsors="marriageData.sponsors"
      :ministerName="marriageData.ministerName"
      :churchName="marriageData.churchName"
      :churchAddress="marriageData.churchAddress"
    />

    <!-- Water Baptism Certificate -->
    <WaterBaptismCertificate
      v-else-if="currentCertificate === 'baptism'"
      :baptism-id="baptismData.baptism_id || baptismData.baptismId || ''"
      :member-id="baptismData.member_id || baptismData.memberId || ''"
      :baptism-date="baptismData.baptism_date || baptismData.baptismDate || ''"
      :location="baptismData.location || baptismData.baptismLocation || ''"
      :pastor-name="baptismData.pastor_name || baptismData.pastorName || baptismData.ministerName || ''"
      :status="baptismData.status || ''"
      :guardian-name="baptismData.guardian_name || ''"
      :guardian-contact="baptismData.guardian_contact || ''"
      :guardian-relationship="baptismData.guardian_relationship || ''"
      :date-created="baptismData.date_created || baptismData.dateCreated || ''"
      :first-name="baptismData.firstname || baptismData.firstName || ''"
      :last-name="baptismData.lastname || baptismData.lastName || ''"
      :middle-name="baptismData.middle_name || baptismData.middleName || ''"
      :fullname="baptismData.fullname || baptismData.name || baptismData.member_fullname || ''"
      :birthdate="baptismData.birthdate || baptismData.birthDate || baptismData.member_birthdate || ''"
      :age="baptismData.age || ''"
      :gender="baptismData.gender || ''"
      :address="baptismData.address || baptismData.member_address || ''"
      :email="baptismData.email || ''"
      :phone-number="baptismData.phone_number || baptismData.contactNumber || ''"
      :certificate-number="baptismData.baptism_id || baptismData.baptismId || ''"
    />

    <DeathCertificate
      v-else-if="currentCertificate === 'death'"
      :deceasedName="deathData.deceasedName"
      :birthDate="deathData.birthDate"
      :deathDate="deathData.deathDate"
      :ageAtDeath="deathData.ageAtDeath"
      :placeOfDeath="deathData.placeOfDeath"
      :address="deathData.address"
      :burialDate="deathData.burialDate"
      :burialLocation="deathData.burialLocation"
      :nextOfKin="deathData.nextOfKin"
      :relationship="deathData.relationship"
      :witnessName="deathData.witnessName"
      :ministerName="deathData.ministerName"
      :churchAddress="deathData.churchAddress"
      :contactNumber="deathData.contactNumber"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ChildDedicationCertificate from '../components/Certificates/ChildDedicationCertificate.vue'
import MarriageCertificate from '../components/Certificates/MarriageCertificate.vue'
import WaterBaptismCertificate from '../components/Certificates/WaterBaptismCertificate.vue'
import DeathCertificate from '../components/Certificates/DeathCertificate.vue'

const route = useRoute()
const router = useRouter()

// Check if this is a specific certificate view (from route params)
const certificateType = route.params.type || route.query.type
const isSpecificCertificate = computed(() => !!certificateType)

// Initialize currentCertificate based on route or default to 'child'
const currentCertificate = ref(certificateType || 'child')

// Get certificate data from route state, sessionStorage, or query params
const routeCertificateData = computed(() => {
  // First try route state
  if (route.state && route.state.certificateData) {
    return route.state.certificateData
  }
  
  // Fallback to sessionStorage
  try {
    const storedData = sessionStorage.getItem('certificateData')
    if (storedData) {
      const parsed = JSON.parse(storedData)
      // Clear after reading
      sessionStorage.removeItem('certificateData')
      return parsed
    }
  } catch (e) {
    console.error('Error reading certificate data from sessionStorage:', e)
  }
  
  // Try to get from query params (for water baptism)
  if (route.query.data) {
    try {
      return JSON.parse(decodeURIComponent(route.query.data))
    } catch (e) {
      console.error('Error parsing certificate data from query:', e)
      return null
    }
  }
  return null
})

const goBack = () => {
  router.back()
}

// Computed property for child dedication data - use route data if available, otherwise use default
const childDedicationData = computed(() => {
  if (routeCertificateData.value && currentCertificate.value === 'child') {
    let data = routeCertificateData.value
    if (data.service) {
      data = data.service
    }
    return data
  }
  
  // Default data for preview
  return {
    child_id: '0000000001',
    requested_by: '1',
    requester_fullname: 'John Member',
    child_firstname: 'John Michael',
    child_middle_name: 'Santos',
    child_lastname: 'Smith',
    date_of_birth: '2020-05-15',
    place_of_birth: 'Manila, Philippines',
    gender: 'M',
    preferred_dedication_date: '2021-06-20',
    contact_phone_number: '09123456789',
    contact_email: 'parent@email.com',
    contact_address: '123 Main St, Kawit Cavite',
    father_firstname: 'John',
    father_lastname: 'Smith',
    father_middle_name: 'Robert',
    mother_firstname: 'Jane',
    mother_lastname: 'Smith',
    mother_middle_name: 'Doe',
    sponsors: [
      { firstname: 'Michael', lastname: 'Johnson' },
      { firstname: 'Sarah', lastname: 'Johnson' }
    ],
    pastor: 'Rev. Fresco Q. Sulapas',
    location: 'Bible Baptist Ekklesia of Kawit',
    status: 'completed',
    child_fullname: 'John Michael Santos Smith'
  }
})

const marriageData = ref({
  groomName: 'John Michael Smith',
  brideName: 'Sarah Elizabeth Johnson',
  marriageDate: '2025-08-15',
  marriageLocation: '123 Anywhere St., Any City',
  sponsors: [
    'Michael Johnson',
    'Sarah Johnson',
    'David Williams'
  ],
  ministerName: 'Rev. Fresco Q. Sulapas',
  churchName: 'BIBLE BAPTIST EKKLESIA OF KAWIT',
  churchAddress: '485 Acacia St. Villa Ramirez, Tabon 1, Kawit Cavite'
})

// Computed property for baptism data - use route data if available, otherwise use default
const baptismData = computed(() => {
  if (routeCertificateData.value && currentCertificate.value === 'baptism') {
    let data = routeCertificateData.value
    if (data.service) {
      data = data.service
    }
    return data
  }
  
  // Default data for preview
  return {
    baptism_id: '0000000001',
    member_id: '1',
    firstname: 'John Michael',
    lastname: 'Smith',
    middle_name: 'Santos',
    fullname: 'John Michael Santos Smith',
    birthdate: '1990-05-15',
    age: '34',
    gender: 'M',
    address: '123 Main Street, Kawit, Cavite',
    email: 'member@email.com',
    phone_number: '09123456789',
    baptism_date: '2024-06-20',
    location: 'Bible Baptist Ekklesia of Kawit',
    pastor_name: 'Rev. Fresco Q. Sulapas',
    status: 'completed',
    guardian_name: '',
    guardian_contact: '',
    guardian_relationship: ''
  }
})

onMounted(() => {
  // Set certificate type from route if available
  if (certificateType) {
    currentCertificate.value = certificateType
  }
})

const deathData = ref({
  deceasedName: 'John Michael Smith',
  birthDate: '1950-03-20',
  deathDate: '2024-12-15',
  ageAtDeath: '74 years',
  placeOfDeath: 'Manila, Philippines',
  address: '123 Main Street, Kawit, Cavite',
  burialDate: '2024-12-20',
  burialLocation: 'Kawit Memorial Cemetery',
  nextOfKin: 'Jane Smith',
  relationship: 'Spouse',
  witnessName: 'Michael Johnson',
  ministerName: 'Rev. Fresco Q. Sulapas',
  churchAddress: '0559 Villa Ramirez, Tabon 1, Kawit, Cavite',
  contactNumber: '09353166809'
})
</script>

<style scoped>
.preview-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
  position: relative;
}

.back-button {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #1e40af;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  color: #1e40af;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.back-btn:hover {
  background: #eff6ff;
  transform: translateX(-2px);
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.preview-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.preview-btn {
  padding: 10px 20px;
  background: white;
  border: 2px solid #1e40af;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  color: #1e40af;
}

.preview-btn:hover {
  background: #eff6ff;
}

.preview-btn.active {
  background: #1e40af;
  color: white;
}

@media print {
  .no-print {
    display: none !important;
  }
}
</style>

