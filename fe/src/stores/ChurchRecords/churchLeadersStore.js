import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useChurchLeadersStore = defineStore('churchLeaders', {
  state: () => ({
    leaders: [],
    loading: false,
    error: null,
    searchQuery: '',
    filters: {
      sortBy: 'Leader ID (Low to High)',
      dateRange: []
    },
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    itemsPerPage: 10,
    pageSizeOptions: [5, 10, 15],
    memberOptions: [],
    searchTimeout: null
  }),

  getters: {
    filteredLeaders: (state) => {
      // Backend handles filtering, so just return leaders
      return state.leaders
    },

    paginatedLeaders: (state) => {
      // Backend handles pagination, so just return leaders
      return state.leaders
    }
  },

  actions: {
    async fetchLeaders(options = {}) {
      this.loading = true
      this.error = null
      try {
        // Use options or fallback to state values
        const page = options.page !== undefined ? options.page : this.currentPage
        const pageSize = options.pageSize !== undefined ? options.pageSize : this.itemsPerPage
        const search = options.search !== undefined ? options.search : this.searchQuery
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
        if (sortBy) {
          params.append('sortBy', sortBy)
        }
        if (dateRange && dateRange.length === 2) {
          params.append('dateRange', JSON.stringify(dateRange))
        }

        const response = await axios.get(`/church-records/church-leaders/getAllChurchLeaders?${params}`)
        
        if (response.data && response.data.success) {
          this.leaders = response.data.data || []
          
          // Update pagination state
          this.currentPage = page
          this.itemsPerPage = pageSize
          
          // Use backend pagination data if available
          if (response.data.pagination) {
            this.totalPages = response.data.pagination.totalPages || 1
            this.totalCount = response.data.pagination.totalCount || 0
          } else {
            // Fallback calculation
            const totalCount = response.data.totalCount || response.data.count || this.leaders.length
            this.totalCount = totalCount
            this.totalPages = Math.ceil(totalCount / pageSize) || 1
          }
          
          // Update search query and filters if provided
          if (options.search !== undefined) {
            this.searchQuery = search
          }
          if (options.sortBy !== undefined) {
            this.filters.sortBy = sortBy
          }
          if (options.dateRange !== undefined) {
            this.filters.dateRange = dateRange
          }
        } else {
          this.error = response.data?.message || 'Failed to fetch leaders'
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch leaders'
        console.error('Error fetching leaders:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchLeaderById(id) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.get(`/church-records/church-leaders/getChurchLeaderById/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data.success) {
          return response.data.data
        } else {
          this.error = response.data.message || 'Failed to fetch leader'
          return null
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch leader'
        console.error('Error fetching leader:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    async createLeader(leaderData) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.post('/church-records/church-leaders/createChurchLeader', leaderData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        console.log('Create leader response:', response)
        
        if (response.data && response.status === 201) {
          await this.fetchLeaders()
          return { success: true, data: response.data.data }
        } else {
          const errorMsg = response.data?.message || 'Failed to create leader'
          this.error = errorMsg
          return { success: false, error: errorMsg }
        }
      } catch (error) {
        console.error('Error creating leader:', error)
        const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create leader'
        this.error = errorMsg
        return { success: false, error: errorMsg }
      } finally {
        this.loading = false
      }
    },

    async updateLeader(id, leaderData) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.put(`/church-records/church-leaders/updateChurchLeader/${id}`, leaderData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        console.log('Update leader response:', response)
        
        if (response.data && response.status === 200) {
          await this.fetchLeaders()
          return { success: true, data: response.data.data }
        } else {
          const errorMsg = response.data?.message || 'Failed to update leader'
          this.error = errorMsg
          return { success: false, error: errorMsg }
        }
      } catch (error) {
        console.error('Error updating leader:', error)
        const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update leader'
        this.error = errorMsg
        return { success: false, error: errorMsg }
      } finally {
        this.loading = false
      }
    },

    async deleteLeader(id) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.delete(`/church-records/church-leaders/deleteChurchLeader/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data && response.status === 200) {
          await this.fetchLeaders()
          return { success: true }
        } else {
          this.error = response.data.message || 'Failed to delete leader'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to delete leader'
        console.error('Error deleting leader:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async bulkDeleteLeaders(leaderIds) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')

      try {
        const response = await axios.delete('/church-records/church-leaders/bulkDeleteChurchLeaders', {
          data: {
            leader_ids: leaderIds
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.data && response.status === 200) {
          await this.fetchLeaders()
          return {
            success: true,
            data: response.data.data,
            message: response.data.message
          }
        } else {
          this.error = response.data.message || 'Failed to bulk delete leaders'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to bulk delete leaders'
        console.error('Error bulk deleting leaders:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchMemberOptions() {
      try {
        const response = await axios.get('/church-records/members/getAllPastorsForSelect')
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
          this.fetchLeaders({ search: query, page: 1, pageSize: this.itemsPerPage })
        }, 500) // 500ms debounce
      }
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.currentPage = 1
      // Refetch with new filters
      this.fetchLeaders({ 
        ...filters, 
        page: 1, 
        pageSize: this.itemsPerPage, 
        search: this.searchQuery 
      })
    },

    setCurrentPage(page) {
      this.currentPage = page
      // Refetch with new page
      this.fetchLeaders({ page, pageSize: this.itemsPerPage, search: this.searchQuery })
    },

    setPageSize(pageSize) {
      // Validate pageSize is in allowed options
      if (this.pageSizeOptions.includes(pageSize)) {
        this.itemsPerPage = pageSize
        this.currentPage = 1 // Reset to first page when changing page size
        // Refetch with new page size
        this.fetchLeaders({ page: 1, pageSize, search: this.searchQuery })
      } else {
        console.warn(`Page size ${pageSize} is not in allowed options: ${this.pageSizeOptions.join(', ')}`)
      }
    },

    async exportChurchLeadersToExcel(options = {}) {
      this.loading = true
      this.error = null
      try {
        // Use current filters if not provided
        const search = options.search !== undefined ? options.search : this.searchQuery
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy
        const dateRange = options.dateRange !== undefined ? options.dateRange : this.filters.dateRange

        // Build query parameters
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (sortBy) {
          params.append('sortBy', sortBy)
        }

        // Make request with responseType: 'blob' to handle binary data
        const response = await axios.get(`/church-records/church-leaders/exportExcel?${params}`, {
          responseType: 'blob'
        })

        // Create blob from response
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url

        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers['content-disposition']
        let filename = 'church_leaders_export.xlsx'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }

        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()

        // Cleanup
        link.remove()
        window.URL.revokeObjectURL(url)

        return { success: true, message: 'Excel file downloaded successfully' }
      } catch (error) {
        console.error('Error exporting church leaders to Excel:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to export church leaders to Excel'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    }
  }
})

