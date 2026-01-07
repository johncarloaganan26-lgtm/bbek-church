import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useBurialServiceStore = defineStore('burialService', {
  state: () => ({
    services: [],
    loading: false,
    error: null,
    searchQuery: '',
    filters: {
      sortBy: 'Service Date (Newest)',
      status: 'All Statuses'
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
      scheduled: 0,
      completed: 0,
      pending: 0,
      approved: 0,
      disapproved: 0,
      cancelled: 0,
      ongoing: 0
    }
  }),

  getters: {
    totalServices: (state) => state.summaryStats.total || 0,
    scheduledServices: (state) => state.summaryStats.scheduled || 0,
    completedServices: (state) => state.summaryStats.completed || 0,
    pendingServices: (state) => state.summaryStats.pending || 0
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
    async fetchServices(options = {}) {
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
        if (status && status !== 'All Statuses') {
          params.append('status', status)
        }
        if (sortBy) {
          params.append('sortBy', sortBy)
        }

        const response = await axios.get(`/church-records/burial-services/getAllBurialServices?${params}`)
        if (response.data.success) {
          this.services = response.data.data || []
          this.totalCount = response.data.totalCount || 0
          this.totalPages = response.data.pagination?.totalPages || 1
          this.currentPage = response.data.pagination?.page || 1
          this.summaryStats = response.data.summaryStats || {
            total: 0,
            scheduled: 0,
            completed: 0,
            pending: 0,
            approved: 0,
            disapproved: 0,
            cancelled: 0,
            ongoing: 0
          }
        } else {
          this.error = response.data.message || 'Failed to fetch burial services'
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch burial services'
        console.error('Error fetching burial services:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchServiceById(id) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`/church-records/burial-services/getBurialServiceById/${id}`)
        if (response.data.success) {
          return response.data.data
        } else {
          this.error = response.data.message || 'Failed to fetch burial service'
          return null
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch burial service'
        console.error('Error fetching burial service:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    async createService(serviceData) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.post('/church-records/burial-services/createBurialService', serviceData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data.success) {
          await this.fetchServices({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true, data: response.data.data }
        } else {
          this.error = response.data.message || 'Failed to create burial service'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to create burial service'
        console.error('Error creating burial service:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateService(id, serviceData) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.put(`/church-records/burial-services/updateBurialService/${id}`, serviceData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data.success) {
          await this.fetchServices({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true, data: response.data.data }
        } else {
          this.error = response.data.message || 'Failed to update burial service'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to update burial service'
        console.error('Error updating burial service:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteService(id) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.delete(`/church-records/burial-services/deleteBurialService/${id}`)
        if (response.data.success) {
          await this.fetchServices({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true }
        } else {
          this.error = response.data.message || 'Failed to delete burial service'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to delete burial service'
        console.error('Error deleting burial service:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async exportServicesToExcel(options = {}) {
      this.loading = true
      this.error = null
      try {
        const search = options.search !== undefined ? options.search : this.searchQuery
        const status = options.status !== undefined ? options.status : this.filters.status
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy

        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (status && status !== 'All Statuses') {
          params.append('status', status)
        }
        if (sortBy) {
          params.append('sortBy', sortBy)
        }

        const response = await axios.get(`/church-records/burial-services/exportExcel?${params}`, {
          responseType: 'blob'
        })

        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url

        const contentDisposition = response.headers['content-disposition']
        let filename = 'burial_services_export.xlsx'
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
        console.error('Error exporting burial services to Excel:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to export burial services to Excel'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    setSearchQuery(query) {
      this.searchQuery = query
      this.currentPage = 1
      this.fetchServices({ search: query, page: 1, pageSize: this.itemsPerPage })
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.currentPage = 1
      this.fetchServices({ 
        ...filters, 
        page: 1, 
        pageSize: this.itemsPerPage, 
        search: this.searchQuery 
      })
    },

    setCurrentPage(page) {
      this.currentPage = page
      this.fetchServices({ page, pageSize: this.itemsPerPage, search: this.searchQuery })
    },

    setPageSize(pageSize) {
      if (this.pageSizeOptions.includes(pageSize)) {
        this.itemsPerPage = pageSize
        this.currentPage = 1
        this.fetchServices({ page: 1, pageSize, search: this.searchQuery })
      }
    }
  }
})

