import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useBurialServiceStore = defineStore('burialService', {
  state: () => ({
    services: [],
    loading: false,
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    totalServices: 0,
    scheduledServices: 0,
    completedServices: 0,
    pendingServices: 0,
    itemsPerPage: 10,
    pageSizeOptions: [10, 25, 50, 100],
    searchQuery: '',
    filters: {
      status: 'All Statuses',
      sortBy: 'Status (Pending First)'
    },
    memberOptions: [],
    pastorOptions: []
  }),

  actions: {
    async fetchServices() {
      try {
        this.loading = true
        const params = {
          page: this.currentPage,
          pageSize: this.itemsPerPage,
          search: this.searchQuery,
          status: this.filters.status,
          sortBy: this.filters.sortBy
        }
        
        const response = await axios.get('/church-records/burial-services/getAllBurialServices', { params })
        
        if (response.data.success) {
          this.services = response.data.data || []
          this.totalPages = response.data.pagination?.totalPages || 1
          this.totalCount = response.data.pagination?.totalCount || 0
          this.totalServices = response.data.summaryStats?.total || 0
          this.scheduledServices = response.data.summaryStats?.scheduled || 0
          this.completedServices = response.data.summaryStats?.completed || 0
          this.pendingServices = response.data.summaryStats?.pending || 0
        } else {
          console.error('Failed to fetch burial services:', response.data.message)
        }
      } catch (error) {
        console.error('Error fetching burial services:', error)
      } finally {
        this.loading = false
      }
    },

    async createService(data) {
      try {
        const response = await axios.post('/church-records/burial-services/createBurialService', data)
        if (response.data.success) {
          // Refresh the list after successful creation
          await this.fetchServices()
        }
        return response.data
      } catch (error) {
        console.error('Error creating burial service:', error)
        return { success: false, error: error.response?.data?.message || 'Failed to create burial service' }
      }
    },

    async updateService(id, data) {
      try {
        const response = await axios.put(`/church-records/burial-services/updateBurialService/${id}`, data)
        if (response.data.success) {
          // Refresh the list after successful update
          await this.fetchServices()
        }
        return response.data
      } catch (error) {
        console.error('Error updating burial service:', error)
        return { success: false, error: error.response?.data?.message || 'Failed to update burial service' }
      }
    },

    async deleteService(id) {
      try {
        const response = await axios.delete(`/church-records/burial-services/deleteBurialService/${id}`)
        if (response.data.success) {
          // Refresh the list after successful deletion
          await this.fetchServices()
        }
        return response.data
      } catch (error) {
        console.error('Error deleting burial service:', error)
        return { success: false, error: error.response?.data?.message || 'Failed to delete burial service' }
      }
    },

    async exportServicesToExcel() {
      try {
        const params = {
          search: this.searchQuery,
          status: this.filters.status,
          sortBy: this.filters.sortBy
        }
        
        const response = await axios.get('/church-records/burial-services/exportExcel', { 
          params,
          responseType: 'blob'
        })
        
        if (response.data) {
          // Create download link for Excel file
          const blob = new Blob([response.data], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', `burial_services_export_${new Date().toISOString().slice(0, 10)}.xlsx`)
          document.body.appendChild(link)
          link.click()
          link.remove()
          window.URL.revokeObjectURL(url)
          
          return { success: true, message: 'Excel file downloaded successfully' }
        } else {
          return { success: false, error: 'No data to export' }
        }
      } catch (error) {
        console.error('Error exporting burial services:', error)
        return { success: false, error: error.response?.data?.message || 'Failed to export burial services' }
      }
    },

    async fetchMemberOptions() {
      try {
        const response = await axios.get('/church-records/members/getAllMembersWithoutPastorsForSelect')
        if (response.data.success) {
          this.memberOptions = response.data.data || []
        } else {
          console.error('Failed to fetch member options:', response.data.message)
        }
      } catch (error) {
        console.error('Error fetching member options:', error)
      }
    },

    async fetchPastorOptions() {
      try {
        const response = await axios.get('/church-records/members/getAllPastorsForSelect')
        if (response.data.success) {
          this.pastorOptions = response.data.data || []
        } else {
          console.error('Failed to fetch pastor options:', response.data.message)
        }
      } catch (error) {
        console.error('Error fetching pastor options:', error)
      }
    },

    // Pagination actions
    setCurrentPage(page) {
      this.currentPage = page
      this.fetchServices()
    },

    setPageSize(size) {
      this.itemsPerPage = size
      this.currentPage = 1 // Reset to first page when changing page size
      this.fetchServices()
    },

    // Search and filter actions
    setSearchQuery(query) {
      this.searchQuery = query
      this.currentPage = 1 // Reset to first page when searching
      this.fetchServices()
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.currentPage = 1 // Reset to first page when filtering
      this.fetchServices()
    }
  }
})