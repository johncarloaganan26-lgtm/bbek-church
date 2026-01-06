import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useSystemLogsStore = defineStore('systemLogs', {
  state: () => ({
    logs: [],
    loading: false,
    error: null,
    filters: {
      search: '',
      action_type: '',
      entity_type: '',
      status: '',
      date_from: '',
      date_to: ''
    },
    pagination: {
      page: 1,
      pageSize: 25,
      totalCount: 0,
      totalPages: 0
    },
    stats: {
      total_count: 0,
      by_action: [],
      by_entity: [],
      by_status: []
    }
  }),

  actions: {
    async fetchLogs(options = {}) {
      this.loading = true
      this.error = null

      try {
        const params = {
          page: options.page || this.pagination.page,
          pageSize: options.pageSize || this.pagination.pageSize,
          limit: options.limit || undefined,
          offset: options.offset || undefined,
          search: options.search || this.filters.search || undefined,
          action_type: options.action_type || this.filters.action_type || undefined,
          entity_type: options.entity_type || this.filters.entity_type || undefined,
          status: options.status || this.filters.status || undefined,
          date_from: options.date_from || this.filters.date_from || undefined,
          date_to: options.date_to || this.filters.date_to || undefined,
          sortBy: options.sortBy || 'Date (Newest)'
        }

        const response = await axios.get('/system-logs/getAll', { params })

        if (response.data && response.data.success) {
          this.logs = response.data.data || []
          this.pagination.page = response.data.pagination?.page || 1
          this.pagination.pageSize = response.data.pagination?.pageSize || 25
          this.pagination.totalCount = response.data.pagination?.totalCount || 0
          this.pagination.totalPages = response.data.pagination?.totalPages || 0

          return {
            success: true,
            data: this.logs,
            totalCount: this.pagination.totalCount,
            pagination: this.pagination
          }
        } else {
          throw new Error(response.data?.message || 'Failed to fetch system logs')
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch system logs'
        console.error('Error fetching system logs:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.loading = false
      }
    },

    async getStats() {
      try {
        const response = await axios.get('/system-logs/stats')

        if (response.data && response.data.success) {
          this.stats = response.data.data || {
            total_count: 0,
            by_action: [],
            by_entity: [],
            by_status: []
          }

          return {
            success: true,
            data: this.stats
          }
        } else {
          throw new Error(response.data?.message || 'Failed to fetch stats')
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch stats'
        console.error('Error fetching stats:', error)
        return {
          success: false,
          error: this.error
        }
      }
    },

    async getLogById(logId) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`/system-logs/getById/${logId}`)

        if (response.data && response.data.success) {
          return {
            success: true,
            data: response.data.data
          }
        } else {
          throw new Error(response.data?.message || 'Log not found')
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch log'
        console.error('Error fetching log:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.loading = false
      }
    },

    async deleteLogs(dateBefore) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.delete('/system-logs/deleteOld', {
          data: { date_before: dateBefore }
        })

        if (response.data && response.data.success) {
          await this.fetchLogs()
          
          return {
            success: true,
            message: response.data.message,
            data: response.data.data
          }
        } else {
          throw new Error(response.data?.message || 'Failed to delete logs')
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to delete logs'
        console.error('Error deleting logs:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.loading = false
      }
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.pagination.page = 1
    },

    resetFilters() {
      this.filters = {
        search: '',
        action_type: '',
        entity_type: '',
        status: '',
        date_from: '',
        date_to: ''
      }
      this.pagination.page = 1
    },

    setPage(page) {
      this.pagination.page = page
    },

    setPageSize(pageSize) {
      this.pagination.pageSize = pageSize
      this.pagination.page = 1
    }
  }
})
