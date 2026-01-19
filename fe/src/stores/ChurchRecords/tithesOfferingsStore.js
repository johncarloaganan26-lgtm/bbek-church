import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useTithesOfferingsStore = defineStore('tithesOfferings', {
  state: () => ({
    donations: [],
    loading: false,
    error: null,
    searchQuery: '',
    filters: {
      sortBy: 'Date Created (Newest)',
      type: 'All Types',
      donationType: 'all',
      dateRange: []
    },
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    itemsPerPage: 10,
    pageSizeOptions: [5, 10, 15],
    memberOptions: [],
    searchTimeout: null,
    summaryStats: {
      totalDonations: 0,
      totalTithes: 0,
      totalOfferings: 0,
      totalSpecialOfferings: 0
    }
  }),

  getters: {
    filteredDonations: (state) => {
      // Backend handles filtering, so just return donations
      return state.donations
    },

    paginatedDonations: (state) => {
      // Backend handles pagination, so just return donations
      return state.donations
    },

    totalDonations: (state) => state.summaryStats.totalDonations || 0,
    totalTithes: (state) => state.summaryStats.totalTithes || 0,
    totalOfferings: (state) => state.summaryStats.totalOfferings || 0,
    totalSpecialOfferings: (state) => state.summaryStats.totalSpecialOfferings || 0
  },

  actions: {
    async fetchDonations(options = {}) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        // Use options or fallback to state values
        const page = options.page !== undefined ? options.page : this.currentPage
        const pageSize = options.pageSize !== undefined ? options.pageSize : this.itemsPerPage
        const search = options.search !== undefined ? options.search : this.searchQuery
        const type = options.type !== undefined ? options.type : this.filters.type
        const donationType = options.donationType !== undefined ? options.donationType : this.filters.donationType
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy
        const dateRange = options.dateRange !== undefined ? options.dateRange : this.filters.dateRange

        // Calculate offset from page and pageSize
        const offset = (page - 1) * pageSize

        const params = new URLSearchParams()
        if (search) params.append('search', search)
        params.append('limit', pageSize.toString())
        params.append('offset', offset.toString())
        params.append('page', page.toString())
        params.append('pageSize', pageSize.toString())
        
        // Add filter parameters
        if (type && type !== 'All Types') {
          params.append('type', type)
        }
        if (donationType && donationType !== 'all') {
          params.append('donationType', donationType)
        }
        if (sortBy) {
          params.append('sortBy', sortBy)
        }
        if (dateRange && dateRange.length === 2) {
          params.append('dateRange', JSON.stringify(dateRange))
        }

        const response = await axios.get(`/church-records/tithes/getAllTithes?${params}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.data && response.data.success) {
          this.donations = response.data.data || []
          
          // Update pagination state
          this.currentPage = page
          this.itemsPerPage = pageSize
          
          // Use backend pagination data if available
          if (response.data.pagination) {
            this.totalPages = response.data.pagination.totalPages || 1
            this.totalCount = response.data.pagination.totalCount || 0
          } else {
            // Fallback calculation
            const totalCount = response.data.totalCount || response.data.count || this.donations.length
            this.totalCount = totalCount
            this.totalPages = Math.ceil(totalCount / pageSize) || 1
          }
          
          // Store summary statistics from API
          this.summaryStats = response.data.summaryStats || {
            totalDonations: 0,
            totalTithes: 0,
            totalOfferings: 0,
            totalSpecialOfferings: 0
          }
          
          // Update search query and filters if provided
          if (options.search !== undefined) {
            this.searchQuery = search
          }
          if (options.type !== undefined) {
            this.filters.type = type
          }
          if (options.donationType !== undefined) {
            this.filters.donationType = donationType
          }
          if (options.sortBy !== undefined) {
            this.filters.sortBy = sortBy
          }
          if (options.dateRange !== undefined) {
            this.filters.dateRange = dateRange
          }
        } else {
          this.error = response.data?.message || 'Failed to fetch donations'
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch donations'
        console.error('Error fetching donations:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchDonationById(id) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.get(`/church-records/tithes/getTitheById/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data.success) {
          return response.data.data
        } else {
          this.error = response.data.message || 'Failed to fetch donation'
          return null
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch donation'
        console.error('Error fetching donation:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    async createDonation(donationData) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.post('/church-records/tithes/createTithe', donationData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        console.log('Create donation response:', response)
        
        if (response.data && response.status === 201) {
          await this.fetchDonations()
          return { success: true, data: response.data.data }
        } else {
          const errorMsg = response.data?.message || 'Failed to create donation'
          this.error = errorMsg
          return { success: false, error: errorMsg }
        }
      } catch (error) {
        console.error('Error creating donation:', error)
        const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create donation'
        this.error = errorMsg
        return { success: false, error: errorMsg }
      } finally {
        this.loading = false
      }
    },

    async updateDonation(id, donationData) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.put(`/church-records/tithes/updateTithe/${id}`, donationData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        console.log('Update donation response:', response)
        
        if (response.data && response.status === 200) {
          await this.fetchDonations()
          return { success: true, data: response.data.data }
        } else {
          const errorMsg = response.data?.message || 'Failed to update donation'
          this.error = errorMsg
          return { success: false, error: errorMsg }
        }
      } catch (error) {
        console.error('Error updating donation:', error)
        const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update donation'
        this.error = errorMsg
        return { success: false, error: errorMsg }
      } finally {
        this.loading = false
      }
    },

    async deleteDonation(id) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.delete(`/church-records/tithes/deleteTithe/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data && response.status === 200) {
          await this.fetchDonations()
          return { success: true }
        } else {
          this.error = response.data.message || 'Failed to delete donation'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to delete donation'
        console.error('Error deleting donation:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
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
          this.fetchDonations({ search: query, page: 1, pageSize: this.itemsPerPage })
        }, 500) // 500ms debounce
      }
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.currentPage = 1
      // Refetch with new filters
      this.fetchDonations({ 
        ...filters, 
        page: 1, 
        pageSize: this.itemsPerPage, 
        search: this.searchQuery 
      })
    },

    setCurrentPage(page) {
      this.currentPage = page
      // Refetch with new page
      this.fetchDonations({ page, pageSize: this.itemsPerPage, search: this.searchQuery })
    },

    setPageSize(pageSize) {
      // Validate pageSize is in allowed options
      if (this.pageSizeOptions.includes(pageSize)) {
        this.itemsPerPage = pageSize
        this.currentPage = 1 // Reset to first page when changing page size
        // Refetch with new page size
        this.fetchDonations({ page: 1, pageSize, search: this.searchQuery })
      } else {
        console.warn(`Page size ${pageSize} is not in allowed options: ${this.pageSizeOptions.join(', ')}`)
      }
    },

    async exportTithesToExcel(options = {}) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const search = options.search !== undefined ? options.search : this.searchQuery
        const type = options.type !== undefined ? options.type : this.filters.type
        const donationType = options.donationType !== undefined ? options.donationType : this.filters.donationType
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy

        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (type && type !== 'All Types') {
          params.append('type', type)
        }
        if (donationType && donationType !== 'all') {
          params.append('donationType', donationType)
        }
        if (sortBy) {
          params.append('sortBy', sortBy)
        }

        const response = await axios.get(`/church-records/tithes/exportExcel?${params}`, {
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url

        const contentDisposition = response.headers['content-disposition']
        let filename = 'tithes_offerings_export.xlsx'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }

        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()

        link.remove()
        window.URL.revokeObjectURL(url)

        return { success: true, message: 'Excel file downloaded successfully' }
      } catch (error) {
        console.error('Error exporting tithes to Excel:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to export tithes to Excel'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    }
  }
})

