<template>
  <div class="import-members">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Import Members</h1>
      <div class="d-flex gap-2">
        <v-tooltip text="Download Template" location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              icon="mdi-download"
              variant="outlined"
              v-bind="props"
              @click="downloadTemplate"
            ></v-btn>
          </template>
        </v-tooltip>
      </div>
    </div>

    <v-card class="mb-6" elevation="2">
      <v-card-title>Upload Member Records</v-card-title>
      <v-card-text>
        <v-alert
          v-if="errorMessage"
          type="error"
          class="mb-4"
          dismissible
          @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </v-alert>

        <v-alert
          v-if="successMessage"
          type="success"
          class="mb-4"
          dismissible
          @click:close="successMessage = ''"
        >
          {{ successMessage }}
        </v-alert>

        <div class="upload-section">
          <v-file-input
            v-model="selectedFile"
            label="Select CSV or Excel file"
            accept=".csv,.xlsx"
            prepend-icon="mdi-file-upload"
            show-size
            :loading="uploading"
            :disabled="uploading"
            @change="handleFileSelect"
          ></v-file-input>

          <div class="mt-4">
            <v-btn
              color="primary"
              :loading="uploading"
              :disabled="!selectedFile || uploading"
              prepend-icon="mdi-upload"
              @click="uploadFile"
            >
              {{ uploading ? 'Importing...' : 'Import Members' }}
            </v-btn>
          </div>
        </div>

        <v-divider class="my-6"></v-divider>

        <div class="instructions">
          <h3 class="text-h6 mb-3">Instructions:</h3>
          <ul class="text-body-2">
            <li>Download the template to see the required column format</li>
            <li>Required columns: firstname, lastname, birthdate, gender, email, position</li>
            <li>Optional columns: middle_name, age, address, phone_number, civil_status, profession, children, guardian_name, guardian_contact, guardian_relationship</li>
            <li>File size limit: 5MB</li>
            <li>Supported formats: CSV (.csv) and Excel (.xlsx)</li>
            <li>Existing members will be updated if email or name+birthdate matches</li>
          </ul>
        </div>
      </v-card-text>
    </v-card>

    <!-- Preview Table -->
    <v-card v-if="previewData.length > 0" class="mb-6" elevation="2">
      <v-card-title>Preview (First 5 rows)</v-card-title>
      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th v-for="header in previewHeaders" :key="header" class="text-left">
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in previewData" :key="index">
              <td v-for="header in previewHeaders" :key="header">
                {{ row[header] || '-' }}
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- Import Results -->
    <v-card v-if="importResults" class="mb-6" elevation="2">
      <v-card-title>Import Results</v-card-title>
      <v-card-text>
        <div class="results-summary">
          <v-row>
            <v-col cols="12" md="4">
              <v-card color="success" dark>
                <v-card-text class="text-center">
                  <div class="text-h4">{{ importResults.imported || 0 }}</div>
                  <div>New Records Added</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card color="warning" dark>
                <v-card-text class="text-center">
                  <div class="text-h4">{{ importResults.updated || 0 }}</div>
                  <div>Records Updated</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card color="error" dark>
                <v-card-text class="text-center">
                  <div class="text-h4">{{ importResults.errors || 0 }}</div>
                  <div>Errors</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/api/axios'
import { ElMessage } from 'element-plus'

// Component state
const router = useRouter()
const selectedFile = ref(null)
const uploading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const previewData = ref([])
const previewHeaders = ref([])
const importResults = ref(null)

// Methods
const handleFileSelect = (file) => {
  if (file) {
    // Validate file type
    const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      errorMessage.value = 'Invalid file type. Please select a CSV or Excel file.'
      selectedFile.value = null
      return
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      errorMessage.value = 'File size exceeds 5MB limit. Please select a smaller file.'
      selectedFile.value = null
      return
    }

    errorMessage.value = ''
    // TODO: Implement preview functionality
    // previewFile(file)
  }
}

const uploadFile = async () => {
  if (!selectedFile.value) {
    errorMessage.value = 'Please select a file to upload.'
    return
  }

  uploading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      throw new Error('No access token found. Please log in again.')
    }

    const response = await axios.post('/church-records/members/import', formData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data.success) {
      importResults.value = response.data.data
      successMessage.value = `Import completed successfully! ${response.data.data.imported || 0} new records added, ${response.data.data.updated || 0} records updated.`
      selectedFile.value = null
      previewData.value = []
      previewHeaders.value = []
    } else {
      errorMessage.value = response.data.message || 'Import failed.'
    }
  } catch (error) {
    console.error('Upload error:', error)
    const errorMsg = error.response?.data?.message || error.message || 'Upload failed. Please try again.'
    errorMessage.value = errorMsg
  } finally {
    uploading.value = false
  }
}

const downloadTemplate = () => {
  // Create CSV template with sample data
  const headers = [
    'firstname',
    'lastname',
    'middle_name',
    'birthdate',
    'age',
    'gender',
    'address',
    'email',
    'phone_number',
    'position',
    'civil_status',
    'profession',
    'children',
    'guardian_name',
    'guardian_contact',
    'guardian_relationship'
  ]

  // Sample data rows
  const sampleData = [
    ['John', 'Doe', '', '1990-01-15', '34', 'M', '123 Main St, City', 'john.doe@example.com', '+639123456789', 'member', 'single', 'Engineer', '', '', '', ''],
    ['Jane', 'Smith', 'Marie', '1985-05-20', '39', 'F', '456 Oak Ave, Town', 'jane.smith@example.com', '+639987654321', 'member', 'married', 'Teacher', '["Anna (12)", "Mark (8)"]', '', '', ''],
    ['Bob', 'Johnson', '', '2000-12-10', '23', 'M', '789 Pine Rd, Village', 'bob.johnson@example.com', '+639555123456', 'member', 'single', 'Student', '', '', '', ''],
    ['Alice', 'Brown', 'Lee', '1975-03-08', '49', 'F', '321 Elm St, Suburb', 'alice.brown@example.com', '+639444567890', 'pastor', 'married', 'Pastor', '["Sarah (15)", "David (10)"]', '', '', '']
  ]

  // Create CSV content
  let csvContent = headers.join(',') + '\n'
  sampleData.forEach(row => {
    const escapedRow = row.map(field => {
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`
      }
      return field
    })
    csvContent += escapedRow.join(',') + '\n'
  })

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'member_import_template.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)

  ElMessage.success('Template downloaded successfully')
}

// Removed goBack function - navigation handled by browser back button

// Optional: Preview file functionality (for future implementation)
const previewFile = async (file) => {
  // This would parse the first few rows of the file for preview
  // Implementation depends on whether we want client-side or server-side preview
}
</script>

<style scoped>
.import-members {
  padding: 24px;
}

.upload-section {
  margin-bottom: 24px;
}

.instructions ul {
  padding-left: 20px;
}

.instructions li {
  margin-bottom: 8px;
}

.results-summary .v-card {
  height: 100%;
}
</style>