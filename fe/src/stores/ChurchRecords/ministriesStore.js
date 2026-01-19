import { defineStore } from 'pinia'
import axios from '@/api/axios'

// Helper function to convert base64 to Blob
function base64ToBlob(base64String, contentType = 'image/jpeg') {
  // Remove data URL prefix if present
  let base64 = base64String
  if (base64String.includes(',')) {
    const parts = base64String.split(',')
    base64 = parts[1]
    // Try to extract content type from data URL
    const mimeMatch = parts[0].match(/data:([^;]+)/)
    if (mimeMatch) {
      contentType = mimeMatch[1]
    }
  }
  
  // Convert base64 to binary
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  
  return new Blob([byteArray], { type: contentType })
}

export const useMinistriesStore = defineStore('ministries', {
  state: () => ({
    ministries: [],
    loading: false,
    error: null,
    searchQuery: '',
    filters: {
      sortBy: 'Date Created (Newest)',
      status: 'All Statuses',
      departmentNamePattern: '',
      dateRange: []
    },
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    itemsPerPage: 10,
    pageSizeOptions: [10, 20, 50, 100],
    // Options for dropdowns
    leaderOptions: [],
    departmentOptions: [],
    memberOptions: [],
    searchTimeout: null,
    summaryStats: {
      totalMinistries: 0,
      activeMinistries: 0,
      totalMembers: 0
    },
    publicMinistries: []
  }),

  getters: {
    totalMinistries: (state) => state.summaryStats.totalMinistries || 0,
    activeMinistries: (state) => state.summaryStats.activeMinistries || 0,
    totalMembers: (state) => state.summaryStats.totalMembers || 0
  },

  actions: {
    async fetchPublicMinistries() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/church-records/ministries/getPublicMinistries')
        console.log(response , response.data , 'response.data')
        if (response.status === 200) {
          // Ensure response.data is an array
          const data = response.data
          this.publicMinistries = Array.isArray(data) ? data : []
        } else {
          this.publicMinistries = []
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch public ministries'
        console.error('Error fetching public ministries:', error)
        // Ensure publicMinistries is always an array even on error
        this.publicMinistries = []
      } finally {
        this.loading = false
      }
    },
    async fetchMinistries(options = {}) {
      this.loading = true
      this.error = null
      try {
        const search = options.search !== undefined ? options.search : this.searchQuery
        const page = options.page !== undefined ? options.page : this.currentPage
        const pageSize = options.pageSize !== undefined ? options.pageSize : this.itemsPerPage
        const status = options.status !== undefined ? options.status : this.filters.status
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy
        const departmentNamePattern = options.departmentNamePattern !== undefined
          ? options.departmentNamePattern
          : this.filters.departmentNamePattern
        const dateRange = options.dateRange !== undefined ? options.dateRange : this.filters.dateRange

        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (page) params.append('page', page)
        if (pageSize) params.append('pageSize', pageSize)
        if (status && status !== 'All Statuses') {
          params.append('status', status)
        }
        if (sortBy) {
          params.append('sortBy', sortBy)
        }
        if (departmentNamePattern) {
          params.append('department_name_pattern', departmentNamePattern)
        }
        if (dateRange && dateRange.length === 2) {
          params.append('dateRange', JSON.stringify(dateRange))
        }

        const response = await axios.get(`/church-records/ministries/getAllMinistries?${params}`)
        if (response.data.success) {
          this.ministries = response.data.data || []
          this.totalCount = response.data.totalCount || 0
          this.totalPages = response.data.pagination?.totalPages || 1
          this.currentPage = response.data.pagination?.page || 1
          this.summaryStats = response.data.summaryStats || {
            totalMinistries: 0,
            activeMinistries: 0,
            totalMembers: 0
          }

          // Update search query and filters if provided
          if (options.search !== undefined) {
            this.searchQuery = search
          }
          if (options.status !== undefined) {
            this.filters.status = status
          }
          if (options.sortBy !== undefined) {
            this.filters.sortBy = sortBy
          }
          if (options.dateRange !== undefined) {
            this.filters.dateRange = dateRange
          }
        } else {
          this.error = response.data.message || 'Failed to fetch ministries'
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch ministries'
        console.error('Error fetching ministries:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchMinistryById(id) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.get(`/church-records/ministries/getMinistryById/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data.success) {
          return response.data.data
        } else {
          this.error = response.data.message || 'Failed to fetch ministry'
          return null
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch ministry'
        console.error('Error fetching ministry:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    async createMinistry(ministryData) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        // Create FormData for file upload
        const formData = new FormData()
        
        // Add all fields to FormData
        formData.append('ministry_name', ministryData.ministry_name || '')
        if (ministryData.schedule) {
          formData.append('schedule', ministryData.schedule)
        }
        formData.append('leader_id', ministryData.leader_id || '')
        formData.append('department_id', ministryData.department_id || '')
        formData.append('members', JSON.stringify(ministryData.members || []))
        formData.append('status', ministryData.status || 'active')
        if (ministryData.description) {
          formData.append('description', ministryData.description)
        }
        
        // Add image file if provided
        if (ministryData.imageFile) {
          // imageFile is already a File object
          console.log('Adding image file to FormData:', ministryData.imageFile.name, ministryData.imageFile.size, 'bytes')
          formData.append('image', ministryData.imageFile)
        } else if (ministryData.image) {
          // If image is base64, convert to blob and add as file
          console.log('Converting base64 image to file for FormData')
          const blob = base64ToBlob(ministryData.image)
          const file = new File([blob], 'ministry-image.jpg', { type: blob.type })
          formData.append('image', file)
        } else {
          console.log('No image provided for create')
        }
        
        // Debug: Log FormData contents
        console.log('FormData entries:')
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`)
          } else {
            console.log(`  ${key}: ${value}`)
          }
        }
        
        // Don't set Content-Type header - axios will set it automatically with boundary for FormData
        const response = await axios.post('/church-records/ministries/createMinistry', formData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.data.success) {
          await this.fetchMinistries({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true, data: response.data.data }
        } else {
          this.error = response.data.message || 'Failed to create ministry'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to create ministry'
        console.error('Error creating ministry:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateMinistry(id, ministryData) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        // Create FormData for file upload
        const formData = new FormData()
        
        // Add all fields to FormData (only include defined fields)
        if (ministryData.ministry_name !== undefined) formData.append('ministry_name', ministryData.ministry_name)
        if (ministryData.schedule !== undefined) formData.append('schedule', ministryData.schedule || '')
        if (ministryData.leader_id !== undefined) formData.append('leader_id', ministryData.leader_id)
        if (ministryData.department_id !== undefined) formData.append('department_id', ministryData.department_id)
        if (ministryData.members !== undefined) formData.append('members', JSON.stringify(ministryData.members))
        if (ministryData.status !== undefined) formData.append('status', ministryData.status)
        if (ministryData.description !== undefined) {
          formData.append('description', ministryData.description || '')
        }
        
        // Add image file if provided (new file or base64)
        if (ministryData.imageFile) {
          // imageFile is already a File object
          console.log('Adding image file to FormData for update:', ministryData.imageFile.name, ministryData.imageFile.size, 'bytes')
          formData.append('image', ministryData.imageFile)
        } else if (ministryData.image !== undefined) {
          if (ministryData.image) {
            // If image is base64, convert to blob and add as file
            console.log('Converting base64 image to file for FormData update')
            const blob = base64ToBlob(ministryData.image)
            const file = new File([blob], 'ministry-image.jpg', { type: blob.type })
            formData.append('image', file)
          } else {
            console.log('Image is empty/null - keeping existing image')
          }
          // If image is null/empty, don't append (keeps existing image)
        } else {
          console.log('No image provided for update - keeping existing image')
        }
        
        // Debug: Log FormData contents
        console.log('FormData entries for update:')
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`)
          } else {
            console.log(`  ${key}: ${value}`)
          }
        }
        
        // Don't set Content-Type header - axios will set it automatically with boundary for FormData
        const response = await axios.put(`/church-records/ministries/updateMinistry/${id}`, formData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.data.success) {
          await this.fetchMinistries({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true, data: response.data.data }
        } else {
          this.error = response.data.message || 'Failed to update ministry'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to update ministry'
        console.error('Error updating ministry:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteMinistry(id) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.delete(`/church-records/ministries/deleteMinistry/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data.success) {
          await this.fetchMinistries({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true }
        } else {
          this.error = response.data.message || 'Failed to delete ministry'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to delete ministry'
        console.error('Error deleting ministry:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchLeaderOptions() {
      try {
        // Changed to getAllMembersWithoutPastorsForSelect to exclude pastors from ministry leader selection
        const response = await axios.get('/church-records/members/getAllMembersWithoutPastorsForSelect')
        if (response.data.success && response.data.data) {
          this.leaderOptions = response.data.data
        }
      } catch (error) {
        console.error('Error fetching leader options:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to fetch leader options'
      }
    },

    async fetchDepartmentOptions() {
      try {
        const response = await axios.get('/church-records/departments/getAllDepartmentsForSelect')
        if (response.data.success && response.data.data) {
          this.departmentOptions = response.data.data
        }
      } catch (error) {
        console.error('Error fetching department options:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to fetch department options'
      }
    },

    async fetchMemberOptions() {
      try {
        const response = await axios.get('/church-records/members/getAllMembersForSelect')
        if (response.data.success && response.data.data) {
          this.memberOptions = response.data.data
        }
      } catch (error) {
        console.error('Error fetching member options:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to fetch member options'
      }
    },

    /**
     * Fetch ministries for a specific member (ministries they have joined)
     * @param {Number} memberId - Member ID
     * @param {Object} options - { page, pageSize, search, status, sortBy }
     * @returns {Promise<Object>} { success, data, totalPages, loading }
     */
    async fetchUserMinistries(memberId, options = {}) {
      const { page = 1, pageSize = 10, search = '', status = '', sortBy = 'Date Created (Newest)' } = options
      
      this.loading = true
      this.error = null
      
      try {
        if (!memberId) {
          throw new Error('Member ID is required')
        }

        // Build query parameters
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('pageSize', pageSize.toString())
        
        if (search && search.trim()) {
          params.append('search', search.trim())
        }
        
        if (status && status !== 'All Statuses') {
          params.append('status', status)
        }
        
        if (sortBy) {
          params.append('sortBy', sortBy)
        }
        
        // Call backend API
        const response = await axios.get(`/church-records/ministries/getMinistriesByMemberId/${memberId}?${params.toString()}`)
        
        if (response.data.success) {
          // Map backend response to frontend format
          const ministries = response.data.data || []
          const formattedMinistries = ministries.map(ministry => {
            // Use imageUrl from backend if available, otherwise convert base64 image to data URL
            let imageUrl = ministry.imageUrl || null
            if (!imageUrl && ministry.image) {
              // Fallback: If imageUrl not provided, convert base64 image to data URL
              imageUrl = ministry.image.startsWith('data:') 
                ? ministry.image 
                : `data:image/jpeg;base64,${ministry.image}`
            }
            
            return {
              ministry_id: ministry.ministry_id,
              ministry_name: ministry.ministry_name,
              description: ministry.description,
              schedule: ministry.schedule,
              leader_id: ministry.leader_id,
              leader_fullname: ministry.leader_fullname,
              department_id: ministry.department_id,
              department_name: ministry.department_name,
              status: ministry.status,
              members: ministry.members,
              imageUrl: imageUrl,
              ...ministry // Include all other fields
            }
          })
          
          const totalPages = response.data.pagination?.totalPages || 1
          
          return {
            success: true,
            data: formattedMinistries,
            totalPages: totalPages,
            loading: false
          }
        } else {
          this.error = response.data.message || 'Failed to fetch user ministries'
          return {
            success: false,
            data: [],
            totalPages: 1,
            loading: false,
            error: this.error
          }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch user ministries'
        console.error('Error fetching user ministries:', error)
        return {
          success: false,
          data: [],
          totalPages: 1,
          loading: false,
          error: this.error
        }
      } finally {
        this.loading = false
      }
    },

    setSearchQuery(query) {
      this.searchQuery = query
      this.currentPage = 1

      // Clear existing timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }

      // Only search if query has at least 3 characters or is empty
      if (query.length >= 3 || query.length === 0) {
        // Debounce search to avoid too many API calls
        this.searchTimeout = setTimeout(() => {
          // Refetch with new search query
          this.fetchMinistries({ search: query, page: 1, pageSize: this.itemsPerPage })
        }, 500) // 500ms debounce
      }
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.currentPage = 1
      // Refetch with new filters
      this.fetchMinistries({ 
        ...filters, 
        page: 1, 
        pageSize: this.itemsPerPage, 
        search: this.searchQuery 
      })
    },

    setCurrentPage(page) {
      this.currentPage = page
      // Refetch with new page
      this.fetchMinistries({ page, pageSize: this.itemsPerPage, search: this.searchQuery })
    },

    setPageSize(pageSize) {
      // Validate pageSize is in allowed options
      if (this.pageSizeOptions.includes(pageSize)) {
        this.itemsPerPage = pageSize
        this.currentPage = 1 // Reset to first page when changing page size
        // Refetch with new page size
        this.fetchMinistries({ page: 1, pageSize, search: this.searchQuery })
      } else {
        console.warn(`Page size ${pageSize} is not in allowed options: ${this.pageSizeOptions.join(', ')}`)
      }
    },
    async exportMinistriesToExcel(options = {}) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        // Build query parameters
        const params = new URLSearchParams()
        if (options.search) params.append('search', options.search)
        if (options.status && options.status !== 'All Statuses') {
          params.append('status', options.status)
        }
        if (options.sortBy) {
          params.append('sortBy', options.sortBy)
        }
        if (options.departmentNamePattern) {
          params.append('department_name_pattern', options.departmentNamePattern)
        }
        if (options.dateRange && options.dateRange.length === 2) {
          params.append('dateRange', JSON.stringify(options.dateRange))
        }
        
        // Make request with responseType: 'blob' to handle binary data
        const response = await axios.get(`/church-records/ministries/exportExcel?${params}`, {
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        // Extract filename from content-disposition header or use default
        const contentDisposition = response.headers['content-disposition']
        let filename = 'ministries_export.xlsx'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1]
          }
        }
        
        // Create download link and trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        
        // Cleanup
        link.parentNode.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        return { success: true, message: 'Excel file downloaded successfully' }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to export ministries to Excel'
        console.error('Error exporting ministries to Excel:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    }
  }
})
