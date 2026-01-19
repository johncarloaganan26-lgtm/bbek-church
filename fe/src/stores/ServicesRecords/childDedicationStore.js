import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useChildDedicationStore = defineStore('childDedication', {
  state: () => ({
    dedications: [],
    loading: false,
    error: null,
    searchQuery: '',
    filters: {
      sortBy: 'Dedication Date (Newest)',
      status: 'All Statuses',
      dateRange: []
    },
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    itemsPerPage: 10,
    pageSizeOptions: [10, 20, 50, 100],
    summaryStats: {
      total: 0,
      completed: 0,
      pending: 0,
      ongoing: 0
    }
  }),

  getters: {
    totalDedications: (state) => state.summaryStats.total || 0,
    dedicated: (state) => state.summaryStats.completed || 0,
    newDedications: (state) => state.summaryStats.pending || 0
  },

  actions: {
  
    async fetchDedications(options = {}) {
      this.loading = true
      this.error = null
      try {
        const search = options.search !== undefined ? options.search : this.searchQuery
        const page = options.page !== undefined ? options.page : this.currentPage
        const pageSize = options.pageSize !== undefined ? options.pageSize : this.itemsPerPage
        const status = options.status !== undefined ? options.status : this.filters.status
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy
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
        if (dateRange && dateRange.length === 2) {
          params.append('dateRange', JSON.stringify(dateRange))
        }

        const response = await axios.get(`/church-records/child-dedications/getAllChildDedications?${params}`)
        if (response.data.success) {
          this.dedications = response.data.data || []
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
          this.error = response.data.message || 'Failed to fetch child dedications'
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch child dedications'
        console.error('Error fetching child dedications:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchDedicationById(id) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`/church-records/child-dedications/getChildDedicationById/${id}`)
        if (response.data.success) {
          return response.data.data
        } else {
          this.error = response.data.message || 'Failed to fetch child dedication'
          return null
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch child dedication'
        console.error('Error fetching child dedication:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    async createDedication(dedicationData) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post('/church-records/child-dedications/createChildDedication', dedicationData)
        if (response.data.success) {
          await this.fetchDedications({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true, data: response.data.data }
        } else {
          this.error = response.data.message || 'Failed to create child dedication'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to create child dedication'
        console.error('Error creating child dedication:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateDedication(id, dedicationData) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.put(`/church-records/child-dedications/updateChildDedication/${id}`, dedicationData)
        if (response.data.success) {
          await this.fetchDedications({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true, data: response.data.data }
        } else {
          this.error = response.data.message || 'Failed to update child dedication'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to update child dedication'
        console.error('Error updating child dedication:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteDedication(id) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.delete(`/church-records/child-dedications/deleteChildDedication/${id}`)
        if (response.data.success) {
          await this.fetchDedications({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true }
        } else {
          this.error = response.data.message || 'Failed to delete child dedication'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to delete child dedication'
        console.error('Error deleting child dedication:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async exportDedicationsToExcel(options = {}) {
      this.loading = true
      this.error = null
      try {
        const search = options.search !== undefined ? options.search : this.searchQuery
        const status = options.status !== undefined ? options.status : this.filters.status
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy
        const dateRange = options.dateRange !== undefined ? options.dateRange : this.filters.dateRange

        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (status && status !== 'All Statuses') {
          params.append('status', status)
        }
        if (sortBy) {
          params.append('sortBy', sortBy)
        }
        if (dateRange && dateRange.length === 2) {
          params.append('dateRange', JSON.stringify(dateRange))
        }

        const response = await axios.get(`/church-records/child-dedications/exportExcel?${params}`, {
          responseType: 'blob'
        })

        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url

        const contentDisposition = response.headers['content-disposition']
        let filename = 'child_dedications_export.xlsx'
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
        console.error('Error exporting child dedications to Excel:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to export child dedications to Excel'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    setSearchQuery(query) {
      this.searchQuery = query
      this.currentPage = 1
      this.fetchDedications({ search: query, page: 1, pageSize: this.itemsPerPage })
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.currentPage = 1
      this.fetchDedications({ 
        ...filters, 
        page: 1, 
        pageSize: this.itemsPerPage, 
        search: this.searchQuery 
      })
    },

    setCurrentPage(page) {
      this.currentPage = page
      this.fetchDedications({ page, pageSize: this.itemsPerPage, search: this.searchQuery })
    },

    setPageSize(pageSize) {
      if (this.pageSizeOptions.includes(pageSize)) {
        this.itemsPerPage = pageSize
        this.currentPage = 1
        this.fetchDedications({ page: 1, pageSize, search: this.searchQuery })
      }
    }
  }
})

