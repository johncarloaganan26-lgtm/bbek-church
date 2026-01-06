  import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useWaterBaptismStore = defineStore('waterBaptism', {
  state: () => ({
    baptisms: [],
    loading: false,
    error: null,
    searchQuery: '',
    filters: {
      sortBy: 'Baptism Date (Newest)',
      status: 'All Statuses',
      statusOptions: ['All Statuses', 'Pending', 'Approved', 'Disapproved', 'Completed', 'Cancelled']
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
    },
    thisYearCount: 0
  }),

  getters: {
    totalBaptisms: (state) => state.summaryStats.total || 0,
    thisYear: (state) => state.thisYearCount || 0,
    certificatesIssued: (state) => state.summaryStats.completed || 0
  },

  actions: {
    async fetchMemberOptions() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/church-records/members/getAllMembersWithoutPastorsForSelect')
        if (response.data.success) {
          this.memberOptions = response.data.data
        } else {
          this.error = response.data.message || 'Failed to fetch member options'
        }
      }
      catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch member options'
        console.error('Error fetching member options:', error)
      }
      finally {
        this.loading = false
      }
    },

    async fetchPastorOptions() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/church-records/church-leaders/getAllChurchLeadersForSelect')
        if (response.data.success) {
          this.pastorOptions = response.data.data
        } else {
          this.error = response.data.message || 'Failed to fetch pastor options'
        }
      }
      catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch pastor options'
        console.error('Error fetching pastor options:', error)
      }
      finally {
        this.loading = false
      }
    },

    async fetchMemberDetails(memberId) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`/church-records/members/getMemberById/${memberId}`)
        if (response.data.data) {
          return response.data.data
        } else {
          this.error = 'Member not found'
          return null
        }
      }
      catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch member details'
        console.error('Error fetching member details:', error)
        return null
      }
      finally {
        this.loading = false
      }
    },
    async fetchBaptisms(options = {}) {
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

        const response = await axios.get(`/services/water-baptisms/getAllWaterBaptisms?${params}`)
        if (response.data.success) {
          this.baptisms = response.data.data || []
          this.totalCount = response.data.totalCount || 0
          this.totalPages = response.data.pagination?.totalPages || 1
          this.currentPage = response.data.pagination?.page || 1
          this.summaryStats = response.data.summaryStats || {
            total: 0,
            completed: 0,
            pending: 0,
            ongoing: 0
          }
          this.thisYearCount = response.data.thisYearCount || 0
        } else {
          this.error = response.data.message || 'Failed to fetch water baptisms'
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch water baptisms'
        console.error('Error fetching water baptisms:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchBaptismById(memberId) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`/services/water-baptisms/getWaterBaptismBymemberId/${id}`)
        if (response.data.success) {
          return response.data.data
        } else {
          this.error = response.data.message || 'Failed to fetch water baptism'
          return null
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch water baptism'
        console.error('Error fetching water baptism:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    async createBaptism(baptismData) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post('/services/water-baptisms/createWaterBaptism', baptismData)
        if (response.data.success) {
          await this.fetchBaptisms({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true, data: response.data.data }
        } else {
          this.error = response.data.message || 'Failed to create water baptism'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to create water baptism'
        console.error('Error creating water baptism:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateBaptism(id, baptismData) {
      this.loading = true
      this.error = null
      try {
        // Send all editable fields
        const updateData = {
          member_id: baptismData.member_id,
          baptism_date: baptismData.baptism_date,
          location: baptismData.location,
          pastor_name: baptismData.pastor_name,
          status: baptismData.status,
          guardian_name: baptismData.guardian_name,
          guardian_contact: baptismData.guardian_contact,
          guardian_relationship: baptismData.guardian_relationship
        }

        const response = await axios.put(`/services/water-baptisms/updateWaterBaptism/${id}`, updateData)
        if (response.data.success) {
          // Refresh the baptisms list to get updated data
          await this.fetchBaptisms({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true, data: response.data.data }
        } else {
          this.error = response.data.message || 'Failed to update water baptism'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to update water baptism'
        console.error('Error updating water baptism:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteBaptism(id) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.delete(`/services/water-baptisms/deleteWaterBaptism/${id}`)
        if (response.data.success) {
          await this.fetchBaptisms({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true }
        } else {
          this.error = response.data.message || 'Failed to delete water baptism'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to delete water baptism'
        console.error('Error deleting water baptism:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async exportBaptismsToExcel(options = {}) {
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

        const response = await axios.get(`/services/water-baptisms/exportExcel?${params}`, {
          responseType: 'blob'
        })

        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url

        const contentDisposition = response.headers['content-disposition']
        let filename = 'water_baptisms_export.xlsx'
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
        console.error('Error exporting water baptisms to Excel:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to export water baptisms to Excel'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },
    async fetchBaptismByMemberId(memberId) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        console.log('Fetching baptism for member ID:', memberId)
        const response = await axios.get(`/services/water-baptisms/getWaterBaptismByMemberId/${memberId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          // Add cache busting to ensure fresh data
          params: {
            _t: Date.now()
          }
        })
        console.log('Baptism API response:', response.data)
        if (response.data.success) {
          console.log('Baptism data returned:', response.data.data)
          return response.data.data
        } else {
          console.log('No baptism data found (success: false)')
          return null
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch water baptism by member ID'
        console.error('Error fetching water baptism by member ID:', error)
        console.error('Error response:', error.response?.data)
        return null
      } finally {
        this.loading = false
      }
    },

    setSearchQuery(query) {
      this.searchQuery = query
      this.currentPage = 1
      this.fetchBaptisms({ search: query, page: 1, pageSize: this.itemsPerPage })
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.currentPage = 1
      this.fetchBaptisms({ 
        ...filters, 
        page: 1, 
        pageSize: this.itemsPerPage, 
        search: this.searchQuery 
      })
    },

    setCurrentPage(page) {
      this.currentPage = page
      this.fetchBaptisms({ page, pageSize: this.itemsPerPage, search: this.searchQuery })
    },

    setPageSize(pageSize) {
      if (this.pageSizeOptions.includes(pageSize)) {
        this.itemsPerPage = pageSize
        this.currentPage = 1
        this.fetchBaptisms({ page: 1, pageSize, search: this.searchQuery })
      }
    }
  }
})

