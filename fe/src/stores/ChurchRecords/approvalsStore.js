import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useApprovalsStore = defineStore('approvals', {
  state: () => ({
    approvals: [],
    loading: false,
    error: null,
    searchQuery: '',
    filters: {
      sortBy: 'Date Created (Newest)',
      status: 'All Statuses',
      type: 'All Types',
      dateRange: []
    },
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    itemsPerPage: 10,
    pageSizeOptions: [10, 20, 50, 100],
    searchTimeout: null,
    summaryStats: {
      totalApprovals: 0,
      pendingApprovals: 0,
      approvedApprovals: 0,
      rejectedApprovals: 0
    }
  }),

  getters: {
    totalApprovals: (state) => state.summaryStats.totalApprovals || 0,
    pendingApprovals: (state) => state.summaryStats.pendingApprovals || 0,
    approvedApprovals: (state) => state.summaryStats.approvedApprovals || 0,
    rejectedApprovals: (state) => state.summaryStats.rejectedApprovals || 0
  },

  actions: {
    async createApproval(approvalData) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.post('/church-records/approvals/createApproval', approvalData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data.success) {
          return response.data.data
        } else {
          this.error = response.data.message || 'Failed to create approval'
          return null
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to create approval'
        console.error('Error creating approval:', error)
        return null
      } finally {
        this.loading = false
      }
    },
    async fetchApprovals(options = {}) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const search = options.search !== undefined ? options.search : this.searchQuery
        const page = options.page !== undefined ? options.page : this.currentPage
        const pageSize = options.pageSize !== undefined ? options.pageSize : this.itemsPerPage
        const status = options.status !== undefined ? options.status : this.filters.status
        const type = options.type !== undefined ? options.type : this.filters.type
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy
        const dateRange = options.dateRange !== undefined ? options.dateRange : this.filters.dateRange

        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (page) params.append('page', page)
        if (pageSize) params.append('pageSize', pageSize)
        if (status && status !== 'All Statuses') {
          params.append('status', status)
        }
        if (type && type !== 'All Types') {
          params.append('type', type)
        }
        if (sortBy) {
          params.append('sortBy', sortBy)
        }
        if (dateRange && dateRange.length === 2) {
          params.append('dateRange', JSON.stringify(dateRange))
        }

        const response = await axios.get(`/church-records/approvals/getAllApprovals?${params}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.data.success) {
          this.approvals = response.data.data || []
          this.totalCount = response.data.totalCount || 0
          this.totalPages = response.data.pagination?.totalPages || 1
          this.currentPage = response.data.pagination?.page || 1
          this.summaryStats = response.data.summaryStats || {
            totalApprovals: 0,
            pendingApprovals: 0,
            approvedApprovals: 0,
            rejectedApprovals: 0
          }
        } else {
          this.error = response.data.message || 'Failed to fetch approvals'
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch approvals'
        console.error('Error fetching approvals:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchApprovalById(id) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.get(`/church-records/approvals/getApprovalById/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data.success) {
          return response.data.data
        } else {
          this.error = response.data.message || 'Failed to fetch approval'
          return null
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch approval'
        console.error('Error fetching approval:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    async updateApprovalStatus(id, status, scheduleDate = null, scheduleTime = null) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const payload = { status };
        
        // Include schedule date/time for child dedication approvals
        if (scheduleDate) {
          payload.schedule_date = scheduleDate;
        }
        if (scheduleTime) {
          payload.schedule_time = scheduleTime;
        }
        
        const response = await axios.put(`/church-records/approvals/updateApprovalStatus/${id}`, 
          payload,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )
        
        if (response.data.success) {
          await this.fetchApprovals({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true, data: response.data.data }
        } else {
          this.error = response.data.message || 'Failed to update approval status'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to update approval status'
        console.error('Error updating approval status:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteApproval(id) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.delete(`/church-records/approvals/deleteApproval/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data.success) {
          await this.fetchApprovals({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true }
        } else {
          this.error = response.data.message || 'Failed to delete approval'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to delete approval'
        console.error('Error deleting approval:', error)
        return { success: false, error: this.error }
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
          this.fetchApprovals({ search: query, page: 1, pageSize: this.itemsPerPage })
        }, 500) // 500ms debounce
      }
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.currentPage = 1
      this.fetchApprovals({ 
        ...filters, 
        page: 1, 
        pageSize: this.itemsPerPage, 
        search: this.searchQuery 
      })
    },

    setCurrentPage(page) {
      this.currentPage = page
      this.fetchApprovals({ page, pageSize: this.itemsPerPage, search: this.searchQuery })
    },

    setPageSize(pageSize) {
      if (this.pageSizeOptions.includes(pageSize)) {
        this.itemsPerPage = pageSize
        this.currentPage = 1
        this.fetchApprovals({ page: 1, pageSize, search: this.searchQuery })
      } else {
        console.warn(`Page size ${pageSize} is not in allowed options: ${this.pageSizeOptions.join(', ')}`)
      }
    },
    async exportApprovalsToExcel(options = {}) {
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
        if (options.type && options.type !== 'All Types') {
          params.append('type', options.type)
        }
        if (options.sortBy) {
          params.append('sortBy', options.sortBy)
        }
        if (options.dateRange && options.dateRange.length === 2) {
          params.append('dateRange', JSON.stringify(options.dateRange))
        }
        
        // Make request with responseType: 'blob' to handle binary data
        const response = await axios.get(`/church-records/approvals/exportExcel?${params}`, {
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        // Extract filename from content-disposition header or use default
        const contentDisposition = response.headers['content-disposition']
        let filename = 'approvals_export.xlsx'
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
        this.error = error.response?.data?.error || error.message || 'Failed to export approvals to Excel'
        console.error('Error exporting approvals to Excel:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async bulkDeleteApprovals(approvalIds) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.delete('/church-records/approvals/bulkDeleteApprovals', {
          data: { approvalIds },
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data.success) {
          await this.fetchApprovals({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return {
            success: true,
            data: response.data.data,
            message: response.data.message
          }
        } else {
          this.error = response.data.message || 'Failed to bulk delete approvals'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to bulk delete approvals'
        console.error('Error bulk deleting approvals:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    }
  }
})

