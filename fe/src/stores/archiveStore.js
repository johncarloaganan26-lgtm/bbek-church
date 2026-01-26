import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useArchiveStore = defineStore('archive', {
  state: () => ({
    archives: [],
    loading: false,
    error: null,
    searchQuery: '',
    filters: {
      original_table: 'All Tables',
      restored: null, // null = all, true = restored, false = not restored
      date_from: null,
      date_to: null,
      sortBy: 'Date (Newest)'
    },
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    itemsPerPage: 100, // Default to 100 per page
    pageSizeOptions: [25, 50, 100, 200],
    summaryStats: null
  }),

  getters: {
    filteredArchives: (state) => {
      return state.archives
    },

    paginatedArchives: (state) => {
      return state.archives
    }
  },

  actions: {
    async fetchArchives() {
      this.loading = true
      this.error = null

      try {
        const accessToken = localStorage.getItem('accessToken')
        const params = {
          page: this.currentPage,
          pageSize: this.itemsPerPage,
          search: this.searchQuery || undefined,
          original_table: this.filters.original_table && this.filters.original_table !== 'All Tables' ? this.filters.original_table : undefined,
          restored: this.filters.restored !== null && this.filters.restored !== undefined ? this.filters.restored : undefined,
          date_from: this.filters.date_from || undefined,
          date_to: this.filters.date_to || undefined,
          sortBy: this.filters.sortBy || 'Date (Newest)'
        }

        // Remove undefined values
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key])

        const response = await axios.get('/archives/getAllArchives', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          params
        })

        if (response.data.success) {
          this.archives = response.data.data || []
          this.totalCount = response.data.totalCount || 0
          this.totalPages = response.data.pagination?.totalPages || 1
        } else {
          throw new Error(response.data.message || 'Failed to fetch archives')
        }
      } catch (error) {
        console.error('Error fetching archives:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to fetch archives'
        this.archives = []
      } finally {
        this.loading = false
      }
    },

    async fetchArchiveById(id) {
      this.loading = true
      this.error = null

      try {
        const accessToken = localStorage.getItem('accessToken')
        const response = await axios.get(`/archives/getArchiveById/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        if (response.data.success) {
          return response.data.data
        } else {
          throw new Error(response.data.message || 'Failed to fetch archive')
        }
      } catch (error) {
        console.error('Error fetching archive:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to fetch archive'
        throw error
      } finally {
        this.loading = false
      }
    },

    async restoreArchive(id, restoreNotes = null) {
      this.loading = true
      this.error = null

      try {
        const accessToken = localStorage.getItem('accessToken')
        const response = await axios.post(`/archives/restoreArchive/${id}`, {
          restore_notes: restoreNotes
        }, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        if (response.data.success) {
          // Refresh the archives list
          await this.fetchArchives()
          await this.fetchSummaryStats()
          return response.data.data
        } else {
          throw new Error(response.data.message || 'Failed to restore archive')
        }
      } catch (error) {
        console.error('Error restoring archive:', error)
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to restore archive'
        this.error = errorMessage
        // Create a new error with the proper message for the component to catch
        const restoreError = new Error(errorMessage)
        restoreError.response = error.response
        throw restoreError
      } finally {
        this.loading = false
      }
    },

    async fetchSummaryStats() {
      try {
        const accessToken = localStorage.getItem('accessToken')
        const response = await axios.get('/archives/getArchiveSummary', {
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

    async deleteArchivePermanently(id) {
      this.loading = true
      this.error = null

      try {
        const accessToken = localStorage.getItem('accessToken')
        const response = await axios.delete(`/archives/deleteArchive/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        if (response.data.success) {
          // Refresh the archives list and summary stats
          await this.fetchArchives()
          await this.fetchSummaryStats()
          return { success: true, data: response.data.data }
        } else {
          throw new Error(response.data.message || 'Failed to permanently delete archive')
        }
      } catch (error) {
        console.error('Error permanently deleting archive:', error)
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to permanently delete archive'
        this.error = errorMessage
        const deleteError = new Error(errorMessage)
        deleteError.response = error.response
        throw deleteError
      } finally {
        this.loading = false
      }
    },

    async bulkDeleteArchivesPermanently(archiveIds) {
      this.loading = true
      this.error = null

      try {
        const accessToken = localStorage.getItem('accessToken')
        const response = await axios.delete('/archives/bulkDeleteArchives', {
          data: {
            archive_ids: archiveIds
          },
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        if (response.data.success) {
          // Refresh the archives list and summary stats
          await this.fetchArchives()
          await this.fetchSummaryStats()
          return {
            success: true,
            data: response.data.data,
            message: response.data.message
          }
        } else {
          throw new Error(response.data.message || 'Failed to bulk delete archives')
        }
      } catch (error) {
        console.error('Error bulk deleting archives:', error)
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to bulk delete archives'
        this.error = errorMessage
        const bulkDeleteError = new Error(errorMessage)
        bulkDeleteError.response = error.response
        throw bulkDeleteError
      } finally {
        this.loading = false
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
        original_table: 'All Tables',
        restored: null,
        date_from: null,
        date_to: null,
        sortBy: 'Date (Newest)'
      }
      this.currentPage = 1
    }
  }
})

