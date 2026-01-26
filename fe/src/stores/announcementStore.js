import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useAnnouncementStore = defineStore('announcement', {
  state: () => ({
    announcements: [],
    loading: false,
    error: null,
    searchQuery: '',
    filters: {
      type: 'All Types',
      priority: 'All Priorities',
      target_audience: 'All Audiences',
      is_active: null,
      sortBy: 'Date (Newest)',
      dateRange: []
    },
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    itemsPerPage: 10,
    pageSizeOptions: [10, 25, 50, 100],
    summaryStats: null,
    activeAnnouncements: []
  }),

  getters: {
    filteredAnnouncements: (state) => {
      return state.announcements
    },

    paginatedAnnouncements: (state) => {
      return state.announcements
    }
  },

  actions: {
    async fetchAnnouncements() {
      this.loading = true
      this.error = null

      try {
        const accessToken = localStorage.getItem('accessToken')
        const params = {
          page: this.currentPage,
          pageSize: this.itemsPerPage,
          search: this.searchQuery || undefined,
          type: this.filters.type && this.filters.type !== 'All Types' ? this.filters.type : undefined,
          priority: this.filters.priority && this.filters.priority !== 'All Priorities' ? this.filters.priority : undefined,
          target_audience: this.filters.target_audience && this.filters.target_audience !== 'All Audiences' ? this.filters.target_audience : undefined,
          is_active: this.filters.is_active !== null && this.filters.is_active !== undefined ? this.filters.is_active : undefined,
          sortBy: this.filters.sortBy || 'Date (Newest)',
          dateRange: this.filters.dateRange && this.filters.dateRange.length === 2 ? JSON.stringify(this.filters.dateRange) : undefined
        }

        // Remove undefined values
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key])

        const response = await axios.get('/announcements/getAllAnnouncements', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          params
        })

        if (response.data.success) {
          this.announcements = response.data.data || []
          this.totalCount = response.data.totalCount || 0
          this.totalPages = response.data.pagination?.totalPages || 1
        } else {
          throw new Error(response.data.message || 'Failed to fetch announcements')
        }
      } catch (error) {
        console.error('Error fetching announcements:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to fetch announcements'
        this.announcements = []
      } finally {
        this.loading = false
      }
    },

    async fetchAnnouncementById(id) {
      this.loading = true
      this.error = null

      try {
        const accessToken = localStorage.getItem('accessToken')
        const response = await axios.get(`/announcements/getAnnouncementById/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        if (response.data.success) {
          return response.data.data
        } else {
          throw new Error(response.data.message || 'Failed to fetch announcement')
        }
      } catch (error) {
        console.error('Error fetching announcement:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to fetch announcement'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createAnnouncement(announcementData) {
      this.loading = true
      this.error = null

      try {
        const accessToken = localStorage.getItem('accessToken')
        const response = await axios.post('/announcements/createAnnouncement', announcementData, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        if (response.data.success) {
          await this.fetchAnnouncements()
          await this.fetchSummaryStats()
          return response.data.data
        } else {
          throw new Error(response.data.message || 'Failed to create announcement')
        }
      } catch (error) {
        console.error('Error creating announcement:', error)
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create announcement'
        this.error = errorMessage
        throw new Error(errorMessage)
      } finally {
        this.loading = false
      }
    },

    async updateAnnouncement(id, announcementData) {
      this.loading = true
      this.error = null

      try {
        const accessToken = localStorage.getItem('accessToken')
        const response = await axios.put(`/announcements/updateAnnouncement/${id}`, announcementData, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        if (response.data.success) {
          await this.fetchAnnouncements()
          await this.fetchSummaryStats()
          return response.data.data
        } else {
          throw new Error(response.data.message || 'Failed to update announcement')
        }
      } catch (error) {
        console.error('Error updating announcement:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to update announcement'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteAnnouncement(id) {
      this.loading = true
      this.error = null

      try {
        const accessToken = localStorage.getItem('accessToken')
        const response = await axios.delete(`/announcements/deleteAnnouncement/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        if (response.data.success) {
          await this.fetchAnnouncements()
          await this.fetchSummaryStats()
          return true
        } else {
          throw new Error(response.data.message || 'Failed to delete announcement')
        }
      } catch (error) {
        console.error('Error deleting announcement:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to delete announcement'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchActiveAnnouncementsForUser() {
      try {
        // Check if announcements are already cached and still valid
        if (this.activeAnnouncements.length > 0) {
          return this.activeAnnouncements
        }

        const accessToken = localStorage.getItem('accessToken')
        const headers = {}
        
        // Only add Authorization header if token exists
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`
        }
        
        const response = await axios.get('/announcements/getActiveAnnouncementsForUser', {
          headers
        })

        if (response.data.success) {
          this.activeAnnouncements = response.data.data || []
          return this.activeAnnouncements
        } else {
          throw new Error(response.data.message || 'Failed to fetch active announcements')
        }
      } catch (error) {
        console.error('Error fetching active announcements:', error)
        // Don't throw error for 401 (unauthorized) - just return empty array
        if (error.response?.status === 401) {
          this.activeAnnouncements = []
          return []
        }
        this.activeAnnouncements = []
        return []
      }
    },

    async markAnnouncementAsViewed(announcementId) {
      try {
        const accessToken = localStorage.getItem('accessToken')
        const headers = {}
        
        // Only add Authorization header if token exists
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`
        }
        
        const response = await axios.post(`/announcements/markAsViewed/${announcementId}`, {}, {
          headers
        })

        if (response.data.success) {
          // Remove from active announcements
          this.activeAnnouncements = this.activeAnnouncements.filter(
            a => a.announcement_id !== announcementId
          )
          return true
        } else {
          throw new Error(response.data.message || 'Failed to mark announcement as viewed')
        }
      } catch (error) {
        console.error('Error marking announcement as viewed:', error)
        // For non-authenticated users, still remove from list locally
        if (error.response?.status === 401 || !localStorage.getItem('accessToken')) {
          this.activeAnnouncements = this.activeAnnouncements.filter(
            a => a.announcement_id !== announcementId
          )
          return true
        }
        throw error
      }
    },

    async fetchSummaryStats() {
      try {
        const accessToken = localStorage.getItem('accessToken')
        const response = await axios.get('/announcements/getAnnouncementSummary', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        if (response.data.success) {
          this.summaryStats = response.data.data
        }
      } catch (error) {
        console.error('Error fetching summary stats:', error)
      }
    },

    setSearchQuery(query) {
      this.searchQuery = query
      this.currentPage = 1
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.currentPage = 1
    },

    setCurrentPage(page) {
      this.currentPage = page
    },

    setPageSize(size) {
      this.itemsPerPage = size
      this.currentPage = 1
    },

    resetFilters() {
      this.searchQuery = ''
      this.filters = {
        type: 'All Types',
        priority: 'All Priorities',
        target_audience: 'All Audiences',
        is_active: null,
        sortBy: 'Date (Newest)'
      }
      this.currentPage = 1
    },

    async bulkDeleteAnnouncements(announcementIds) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.delete('/announcements/bulkDeleteAnnouncements', {
          data: { announcementIds },
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data.success) {
          await this.fetchAnnouncements({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          await this.fetchSummaryStats()
          return {
            success: true,
            data: response.data.data,
            message: response.data.message
          }
        } else {
          this.error = response.data.message || 'Failed to bulk delete announcements'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to bulk delete announcements'
        console.error('Error bulk deleting announcements:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    }
  }
})

