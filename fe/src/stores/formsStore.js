import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useFormsStore = defineStore('forms', {
  state: () => ({
    forms: [],
    myForms: [],
    loading: false,
    error: null,
    searchQuery: '',
    filters: {
      status: null,
      form_type: null,
      sortBy: 'Date (Newest)',
      dateRange: []
    },
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    itemsPerPage: 10,
    pageSizeOptions: [10, 25, 50, 100],
    selectedForm: null,
    memberServices: {
      'water-baptism': [],
      'marriage': [],
      'burial': [],
      'child-dedication': []
    }
  }),

  getters: {
    filteredForms: (state) => {
      return state.forms
    },

    paginatedForms: (state) => {
      return state.forms
    },

    pendingForms: (state) => {
      return state.forms.filter(form => form.status === 'pending')
    },

    scheduleChangeForms: (state) => {
      return state.forms.filter(form => form.form_type === 'schedule_change')
    },

    prayerRequestForms: (state) => {
      return state.forms.filter(form => form.form_type === 'prayer_request')
    }
  },

  actions: {
    /**
     * Fetch all forms (admin view)
     */
    async fetchForms(options = {}) {
      this.loading = true
      this.error = null

      try {
        const search = options.search !== undefined ? options.search : this.searchQuery
        const page = options.page !== undefined ? options.page : this.currentPage
        const pageSize = options.pageSize !== undefined ? options.pageSize : this.itemsPerPage
        const status = options.status !== undefined ? options.status : this.filters.status
        const form_type = options.form_type !== undefined ? options.form_type : this.filters.form_type
        const dateRange = options.dateRange !== undefined ? options.dateRange : this.filters.dateRange

        const params = {
          page,
          pageSize
        }

        if (search) params.search = search
        if (status) params.status = status
        if (form_type) params.form_type = form_type
        if (dateRange && dateRange.length === 2) {
          params.dateRange = JSON.stringify(dateRange)
        }

        // Remove undefined values
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key])

        const response = await axios.get('/forms/getAllForms', { params })

        if (response.data.success) {
          this.forms = response.data.data || []
          this.totalCount = response.data.totalCount || 0
          this.totalPages = response.data.pagination?.totalPages || 1
          this.currentPage = response.data.pagination?.page || 1
        } else {
          throw new Error(response.data.message || 'Failed to fetch forms')
        }
      } catch (error) {
        console.error('Error fetching forms:', error)
        this.error = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to fetch forms'
        this.forms = []
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch forms by current user
     */
    async fetchMyForms(formType = null) {
      // Check if user is authenticated before making request
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null')
      const userId = userInfo?.account?.acc_id || userInfo?.acc_id
      
      // If no user ID, skip the API call and return empty array
      if (!userId) {
        this.myForms = []
        return []
      }

      this.loading = true
      this.error = null

      try {
        const params = {}
        if (formType) {
          params.form_type = formType
        }

        const response = await axios.get('/forms/getMyForms', { params })
        console.log(response.data.data ,'FORMS')
        if (response.data.success) {
          this.myForms = response.data.data || []
          return this.myForms
        } else {
          throw new Error(response.data.message || 'Failed to fetch your forms')
        }
      } catch (error) {
        console.error('Error fetching user forms:', error)
        // Don't throw error for 401 (unauthorized) - just return empty array
        if (error.response?.status === 401) {
          this.myForms = []
          return []
        }
        this.error = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to fetch your forms'
        this.myForms = []
        return []
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch a single form by ID
     */
    async fetchFormById(formId) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`/forms/getFormById/${formId}`)

        if (response.data.success) {
          this.selectedForm = response.data.data
          return response.data.data
        } else {
          throw new Error(response.data.message || 'Failed to fetch form')
        }
      } catch (error) {
        console.error('Error fetching form:', error)
        this.error = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to fetch form'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new form submission
     */
    async createForm(formData) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.post('/forms/createForm', formData)

        if (response.data.success) {
          // Refresh my forms if user is authenticated
          const userInfo = JSON.parse(localStorage.getItem('userInfo')) || null
          if (userInfo?.account?.acc_id || userInfo?.acc_id) {
            await this.fetchMyForms(formData.form_type)
          }
          return { success: true, data: response.data.data, message: response.data.message }
        } else {
          throw new Error(response.data.message || 'Failed to create form')
        }
      } catch (error) {
        console.error('Error creating form:', error)
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create form'
        this.error = errorMessage
        throw new Error(errorMessage)
      } finally {
        this.loading = false
      }
    },

    /**
     * Update a form (typically for status changes and admin notes)
     */
    async updateForm(formId, updateData) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.put(`/forms/updateForm/${formId}`, updateData)

        if (response.data.success) {
          // Update the form in the list if it exists
          const formIndex = this.forms.findIndex(f => f.form_id === formId)
          if (formIndex !== -1) {
            this.forms[formIndex] = response.data.data
          }

          // Update selected form if it's the same
          if (this.selectedForm?.form_id === formId) {
            this.selectedForm = response.data.data
          }

          // Refresh forms list
          await this.fetchForms({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery,
            status: this.filters.status,
            form_type: this.filters.form_type
          })

          return { success: true, data: response.data.data }
        } else {
          throw new Error(response.data.message || 'Failed to update form')
        }
      } catch (error) {
        console.error('Error updating form:', error)
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update form'
        this.error = errorMessage
        throw new Error(errorMessage)
      } finally {
        this.loading = false
      }
    },

    /**
     * Approve a form
     */
    async approveForm(formId) {
      return await this.updateForm(formId, {
        status: 'approved'
      })
    },

    /**
     * Reject a form
     */
    async rejectForm(formId, adminNotes = null) {
      return await this.updateForm(formId, {
        status: 'rejected',
        admin_notes: adminNotes
      })
    },

    /**
     * Delete a form
     */
    async deleteForm(formId) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.delete(`/forms/deleteForm/${formId}`)

        if (response.data.success) {
          // Remove from forms list
          this.forms = this.forms.filter(f => f.form_id !== formId)
          
          // Refresh forms list
          await this.fetchForms({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery,
            status: this.filters.status,
            form_type: this.filters.form_type
          })

          return { success: true }
        } else {
          throw new Error(response.data.message || 'Failed to delete form')
        }
      } catch (error) {
        console.error('Error deleting form:', error)
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to delete form'
        this.error = errorMessage
        throw new Error(errorMessage)
      } finally {
        this.loading = false
      }
    },

    /**
     * Set search query
     */
    setSearchQuery(query) {
      this.searchQuery = query
      this.currentPage = 1
    },

    /**
     * Set filters
     */
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.currentPage = 1
    },

    /**
     * Set current page
     */
    setCurrentPage(page) {
      this.currentPage = page
    },

    /**
     * Set page size
     */
    setPageSize(size) {
      this.itemsPerPage = size
      this.currentPage = 1
    },

    /**
     * Reset filters
     */
    resetFilters() {
      this.searchQuery = ''
      this.filters = {
        status: null,
        form_type: null,
        sortBy: 'Date (Newest)'
      }
      this.currentPage = 1
    },

    /**
     * Set selected form
     */
    setSelectedForm(form) {
      this.selectedForm = form
    },

    /**
     * Get member services (non-completed) for schedule change selection
     */
    async fetchMemberServices(memberId) {
      this.loading = true
      this.error = null

      try {
        console.log(`[formsStore] Fetching member services for memberId: ${memberId}`)
        const response = await axios.get(`/forms/getMemberServices/${memberId}`)
        console.log(`[formsStore] Response received:`, response.data)

        if (response.data.success) {
          this.memberServices = response.data.data || {
            'water-baptism': [],
            'marriage': [],
            'burial': [],
            'child-dedication': []
          }
          
          // Log the services for debugging
          console.log(`[formsStore] Member services loaded:`, this.memberServices)
          Object.keys(this.memberServices).forEach(serviceType => {
            const services = this.memberServices[serviceType]
            console.log(`[formsStore] ${serviceType}: ${services.length} services found`)
            if (services.length > 0) {
              services.forEach((service, index) => {
                console.log(`[formsStore]   Service ${index + 1}:`, {
                  service_id: service.service_id,
                  service_date: service.service_date,
                  status: service.status
                })
              })
            }
          })
          
          return this.memberServices
        } else {
          throw new Error(response.data.message || 'Failed to fetch member services')
        }
      } catch (error) {
        console.error('[formsStore] Error fetching member services:', error)
        console.error('[formsStore] Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        this.error = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to fetch member services'
        this.memberServices = {
          'water-baptism': [],
          'marriage': [],
          'burial': [],
          'child-dedication': []
        }
        return this.memberServices
      } finally {
        this.loading = false
      }
    }
  }
})

