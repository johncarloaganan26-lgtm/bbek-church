import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useAuditTrailStore = defineStore('auditTrail', {
  state: () => ({
    logs: [],
    loading: false,
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0
    },
    filters: {
      actionType: '',
      userId: '',
      dateRange: [],
      status: ''
    }
  }),

  actions: {
    async fetchLogs(params = {}) {
      this.loading = true
      try {
        const response = await axios.get('/audit-trail/logs', { params })
        this.logs = response.data.data.logs || []
        this.pagination = response.data.data.pagination || this.pagination
        return response.data
      } catch (error) {
        console.error('Error fetching audit logs:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async exportLogs(params = {}) {
      try {
        const response = await axios.get('/audit-trail/export', {
          params,
          responseType: 'blob'
        })
        return response
      } catch (error) {
        console.error('Error exporting audit logs:', error)
        throw error
      }
    },

    async logAction(actionData) {
      try {
        // Get user info from localStorage
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        const token = localStorage.getItem('accessToken')

        if (!userInfo.account || !token) {
          console.warn('No user info or token available for audit logging')
          return
        }

        const logData = {
          user_id: userInfo.account.acc_id,
          user_email: userInfo.account.email,
          user_name: `${userInfo.member?.firstname || ''} ${userInfo.member?.lastname || ''}`.trim() || userInfo.account.email,
          user_position: userInfo.account.position,
          action_type: actionData.action_type,
          module: actionData.module,
          description: actionData.description,
          entity_type: actionData.entity_type || null,
          entity_id: actionData.entity_id || null,
          ip_address: actionData.ip_address || null,
          user_agent: null, // Hidden for privacy
          old_values: actionData.old_values || null,
          new_values: actionData.new_values || null,
          status: actionData.status || 'success',
          error_message: actionData.error_message || null
        }

        await axios.post('/audit-trail/log', logData)
      } catch (error) {
        console.error('Error logging audit action:', error)
        // Don't throw error to avoid breaking the main functionality
      }
    },

    // Helper methods for common actions
    async logLogin(userInfo) {
      await this.logAction({
        action_type: 'LOGIN',
        module: 'Authentication',
        description: `User logged in: ${userInfo.account.email}`,
        status: 'success'
      })
    },

    async logLogout(userInfo) {
      await this.logAction({
        action_type: 'LOGOUT',
        module: 'Authentication',
        description: `User logged out: ${userInfo.account.email}`,
        status: 'success'
      })
    },

    async logView(module, description) {
      await this.logAction({
        action_type: 'VIEW',
        module: module,
        description: description,
        status: 'success'
      })
    },

    async logCreate(module, entityType, entityId, description) {
      await this.logAction({
        action_type: 'CREATE',
        module: module,
        entity_type: entityType,
        entity_id: entityId,
        description: description,
        status: 'success'
      })
    },

    async logUpdate(module, entityType, entityId, description, oldValues = null, newValues = null) {
      await this.logAction({
        action_type: 'UPDATE',
        module: module,
        entity_type: entityType,
        entity_id: entityId,
        description: description,
        old_values: oldValues,
        new_values: newValues,
        status: 'success'
      })
    },

    async logDelete(module, entityType, entityId, description) {
      await this.logAction({
        action_type: 'DELETE',
        module: module,
        entity_type: entityType,
        entity_id: entityId,
        description: description,
        status: 'success'
      })
    },

    async logRestore(module, entityType, entityId, description) {
      await this.logAction({
        action_type: 'RESTORE',
        module: module,
        entity_type: entityType,
        entity_id: entityId,
        description: description,
        status: 'success'
      })
    },

    async logPrint(module, description) {
      await this.logAction({
        action_type: 'PRINT',
        module: module,
        description: description,
        status: 'success'
      })
    },

    async logExport(module, description) {
      await this.logAction({
        action_type: 'EXPORT',
        module: module,
        description: description,
        status: 'success'
      })
    },

    async logError(module, actionType, description, errorMessage) {
      await this.logAction({
        action_type: actionType,
        module: module,
        description: description,
        status: 'failed',
        error_message: errorMessage
      })
    }
  }
})