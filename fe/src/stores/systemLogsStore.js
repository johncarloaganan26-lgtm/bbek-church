import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useSystemLogsStore = defineStore('systemLogs', {
  state: () => ({
    logs: [],
    loading: false,
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0
    },
    filters: {
      search: '',
      action: '',
      userId: '',
      role: '',
      page: '',
      dateRange: []
    },
    filterOptions: {
      uniqueUsers: [],
      uniqueRoles: [],
      uniquePages: []
    }
  }),

  actions: {
    async fetchLogs(params = {}) {
      this.loading = true
      try {
        const response = await axios.get('/system-logs/logs', { params })
        this.logs = response.data.data.logs || []
        this.pagination = response.data.data.pagination || this.pagination
        this.filterOptions = response.data.data.filters || this.filterOptions
        return response.data
      } catch (error) {
        console.error('Error fetching system logs:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async exportLogs(params = {}) {
      try {
        const response = await axios.get('/system-logs/export', {
          params,
          responseType: 'blob'
        })
        return response
      } catch (error) {
        console.error('Error exporting system logs:', error)
        throw error
      }
    },

    async logAction(actionData) {
      try {
        // Get user info from localStorage
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        const token = localStorage.getItem('accessToken')

        if (!userInfo.account || !token) {
          console.warn('No user info or token available for system logging')
          return
        }

        const logData = {
          user_id: userInfo.account.acc_id,
          user_name: `${userInfo.member?.firstname || ''} ${userInfo.member?.lastname || ''}`.trim() || userInfo.account.email,
          role: userInfo.account.position,
          action: actionData.action,
          page: actionData.page,
          description: actionData.description,
          ip_address: actionData.ip_address || null,
          device_info: actionData.device_info || navigator.userAgent
        }

        await axios.post('/system-logs/log', logData)
      } catch (error) {
        console.error('Error logging system action:', error)
        // Don't throw error to avoid breaking the main functionality
      }
    },

    // Helper methods for common actions
    async logLogin(userInfo) {
      await this.logAction({
        action: 'Login',
        page: 'Login Page',
        description: `${userInfo.account.email} logged in successfully`
      })
    },

    async logLogout(userInfo) {
      await this.logAction({
        action: 'Logout',
        page: 'Dashboard',
        description: `${userInfo.account.email} logged out from the system`
      })
    },

    async logView(page, description) {
      await this.logAction({
        action: 'View',
        page: page,
        description: description
      })
    },

    async logCreate(page, description) {
      await this.logAction({
        action: 'Create',
        page: page,
        description: description
      })
    },

    async logUpdate(page, description) {
      await this.logAction({
        action: 'Update',
        page: page,
        description: description
      })
    },

    async logDelete(page, description) {
      await this.logAction({
        action: 'Delete',
        page: page,
        description: description
      })
    },

    async logPrint(page, description) {
      await this.logAction({
        action: 'Print',
        page: page,
        description: description
      })
    },

    async logExport(page, description) {
      await this.logAction({
        action: 'Export',
        page: page,
        description: description
      })
    },

    async logError(page, action, description, errorMessage) {
      await this.logAction({
        action: action,
        page: page,
        description: description,
        error_message: errorMessage
      })
    },

    // Cleanup old logs
    async cleanupOldLogs(daysToKeep = 365) {
      try {
        const response = await axios.delete('/system-logs/cleanup', {
          data: { daysToKeep }
        })
        return response.data
      } catch (error) {
        console.error('Error cleaning up system logs:', error)
        throw error
      }
    },

    // Reset filters
    resetFilters() {
      this.filters = {
        search: '',
        action: '',
        userId: '',
        role: '',
        page: '',
        dateRange: []
      }
    }
  }
})