import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useMarriageServiceStore = defineStore('marriageService', {
  state: () => ({
    marriages: [],
    loading: false,
    error: null,
    searchQuery: '',
    filters: {
      sortBy: 'Marriage Date (Newest)',
      status: 'All Status'
    },
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    itemsPerPage: 10,
    pageSizeOptions: [10, 20, 50, 100],
    memberOptions: [],
    pastorOptions: [],
    summaryStats: {
      total: 0,
      completed: 0,
      pending: 0,
      ongoing: 0
    }
  }),

  getters: {
    totalMarriages: (state) => state.summaryStats.total || 0,
    completed: (state) => state.summaryStats.completed || 0,
    pendingApprovals: (state) => state.summaryStats.pending || 0
  },

  actions: {
    async fetchMemberOptions() {
      try {
        const response = await axios.get('/church-records/members/getAllMembersWithoutPastorsForSelect')
        if (response.data.success) {
          this.memberOptions = response.data.data
        } else {
          this.error = response.data.message || 'Failed to fetch member options'
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch member options'
        console.error('Error fetching member options:', error)
      }
    },
    async fetchPastorOptions() {
      try {
        const response = await axios.get('/church-records/members/getAllPastorsForSelect')
        if (response.data.success) {
          this.pastorOptions = response.data.data || []
        } else {
          this.error = response.data.message || 'Failed to fetch pastor options'
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch pastor options'
        console.error('Error fetching pastor options:', error)
      }
    },
    async fetchMarriages(options = {}) {
      this.loading = true
      this.error = null
      try {
        const search = options.search !== undefined ? options.search : this.searchQuery
        const page = options.page !== undefined ? options.page : this.currentPage
        const pageSize = options.pageSize !== undefined ? options.pageSize : this.itemsPerPage
        const status = options.status !== undefined ? options.status : this.filters.status
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy

        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (page) params.append('page', page)
        if (pageSize) params.append('pageSize', pageSize)
        if (status && status !== 'All Status') {
          params.append('status', status)
        }
        if (sortBy) {
          params.append('sortBy', sortBy)
        }

        const response = await axios.get(`/services/marriage-services/getAllMarriageServices?${params}`)
        if (response.data.success) {
          this.marriages = response.data.data || []
          this.totalCount = response.data.totalCount || 0
          this.totalPages = response.data.pagination?.totalPages || 1
          this.currentPage = response.data.pagination?.page || 1
          this.summaryStats = response.data.summaryStats || {
            total: 0,
            completed: 0,
            pending: 0,
            ongoing: 0
          }
        } else {
          this.error = response.data.message || 'Failed to fetch marriages'
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch marriages'
        console.error('Error fetching marriages:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchMarriageById(id) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`/services/marriage-services/getMarriageServiceById/${id}`)
        if (response.data.success) {
          return response.data.data
        } else {
          this.error = response.data.message || 'Failed to fetch marriage'
          return null
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch marriage'
        console.error('Error fetching marriage:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    async createMarriage(marriageData) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post('/services/marriage-services/createMarriageService', marriageData)
        if (response.data.success) {
          await this.fetchMarriages({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true, data: response.data.data }
        } else {
          this.error = response.data.message || 'Failed to create marriage'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to create marriage'
        console.error('Error creating marriage:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateMarriage(id, marriageData) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.put(`/services/marriage-services/updateMarriageService/${id}`, marriageData)
        if (response.data.success) {
          await this.fetchMarriages({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true, data: response.data.data }
        } else {
          this.error = response.data.message || 'Failed to update marriage'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to update marriage'
        console.error('Error updating marriage:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteMarriage(id) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.delete(`/services/marriage-services/deleteMarriageService/${id}`)
        if (response.data.success) {
          await this.fetchMarriages({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true }
        } else {
          this.error = response.data.message || 'Failed to delete marriage'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to delete marriage'
        console.error('Error deleting marriage:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async exportMarriagesToExcel(options = {}) {
      this.loading = true
      this.error = null
      try {
        const search = options.search !== undefined ? options.search : this.searchQuery
        const status = options.status !== undefined ? options.status : this.filters.status
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy

        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (status && status !== 'All Status') {
          params.append('status', status)
        }
        if (sortBy) {
          params.append('sortBy', sortBy)
        }

        const response = await axios.get(`/services/marriage-services/exportExcel?${params}`, {
          responseType: 'blob'
        })

        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url

        const contentDisposition = response.headers['content-disposition']
        let filename = 'marriages_export.xlsx'
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
        console.error('Error exporting marriages to Excel:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to export marriages to Excel'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    setSearchQuery(query) {
      this.searchQuery = query
      this.currentPage = 1
      this.fetchMarriages({ search: query, page: 1, pageSize: this.itemsPerPage })
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.currentPage = 1
      this.fetchMarriages({
        ...filters,
        page: 1,
        pageSize: this.itemsPerPage,
        search: this.searchQuery
      })
    },

    setCurrentPage(page) {
      this.currentPage = page
      this.fetchMarriages({ page, pageSize: this.itemsPerPage, search: this.searchQuery })
    },

    setPageSize(pageSize) {
      if (this.pageSizeOptions.includes(pageSize)) {
        this.itemsPerPage = pageSize
        this.currentPage = 1
        this.fetchMarriages({ page: 1, pageSize, search: this.searchQuery })
      }
    }
  }
})

