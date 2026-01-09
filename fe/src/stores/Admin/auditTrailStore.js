import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useAuditTrailStore = defineStore('auditTrail', {
  state: () => ({
    auditLogs: [],
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
      pageSize: 100, // Default to 100 per page
      totalCount: 0,
      totalPages: 0,
      pageSizeOptions: [100, 500, 1000, -1] // -1 means "Show All"
    },
    stats: {
      total_count: 0,
      by_action: [],
      by_entity: [],
      by_status: []
    }
  }),

  actions: {
    async fetchAuditLogs(options = {}) {
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

        const response = await axios.get('/audit-trail/getAll', { params })

        if (response.data && response.data.success) {
          this.auditLogs = response.data.data || []
          this.pagination.page = response.data.pagination?.page || 1
          this.pagination.pageSize = response.data.pagination?.pageSize || this.pagination.pageSize
          this.pagination.totalCount = response.data.pagination?.totalCount || 0
          this.pagination.totalPages = response.data.pagination?.totalPages || Math.ceil((response.data.pagination?.totalCount || 0) / this.pagination.pageSize)

          return {
            success: true,
            data: this.auditLogs,
            totalCount: this.pagination.totalCount,
            pagination: this.pagination
          }
        } else {
          throw new Error(response.data?.message || 'Failed to fetch audit logs')
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch audit logs'
        console.error('Error fetching audit logs:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.loading = false
      }
    },

    async getAuditStats() {
      try {
        const response = await axios.get('/audit-trail/stats')

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
          throw new Error(response.data?.message || 'Failed to fetch audit stats')
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch audit stats'
        console.error('Error fetching audit stats:', error)
        return {
          success: false,
          error: this.error
        }
      }
    },

    async getAuditLogById(auditId) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`/audit-trail/getById/${auditId}`)

        if (response.data && response.data.success) {
          return {
            success: true,
            data: response.data.data
          }
        } else {
          throw new Error(response.data?.message || 'Audit log not found')
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch audit log'
        console.error('Error fetching audit log:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.loading = false
      }
    },

    async deleteAuditLogs(dateBefore) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.delete(`/audit-trail/deleteOld`, {
          data: { date_before: dateBefore }
        })

        if (response.data && response.data.success) {
          // Refresh data after deletion
          await this.fetchAuditLogs()
          
          return {
            success: true,
            message: response.data.message,
            data: response.data.data
          }
        } else {
          throw new Error(response.data?.message || 'Failed to delete audit logs')
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to delete audit logs'
        console.error('Error deleting audit logs:', error)
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
