import { defineStore } from 'pinia'
import axios from '@/api/axios'
import { checkAccessTokenValidity } from '@/utils/tokenValidation'

export const useAccountsStore = defineStore('accounts', {
  state: () => ({
    accounts: [],
    loading: false,
    error: null,
    searchQuery: '',
    filters: {
      status: 'All Statuses',
      position: 'All Positions',
      sortBy: 'Date Created (Newest)'
    },
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    itemsPerPage: 10,
    pageSizeOptions: [5, 10, 15],
    emailOptions: []
  }),

  getters: {
    filteredAccounts: (state) => {
      // Backend handles filtering, so just return accounts
      return state.accounts
    },

    paginatedAccounts: (state) => {
      // Backend handles pagination, so just return accounts
      return state.accounts
    }
  },

  actions: {
    // Check access token validity using utility function
    checkAccessTokenValidity() {
      return checkAccessTokenValidity()
    },
    async login(email, password) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post('/church-records/accounts/login', { email, password })
        if (response.data && response.data.success) {
          // save the access token to the local storage
          localStorage.setItem('userInfo', JSON.stringify({account: response.data.data.account, member: response.data.data.member}))
          localStorage.setItem('accessToken', response.data.data.account.accessToken)
          return { success: true, data: response.data.data }
        } else {
          return { success: false, error: response.data.message }
        }
      }
      catch (error) {
        console.error('Error logging in:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to login'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
      return response.data.data
    },
    async fetchAccounts(options = {}) {
      this.loading = true
      this.error = null
      try {
        // Use options or fallback to state values
        const page = options.page !== undefined ? options.page : this.currentPage
        const pageSize = options.pageSize !== undefined ? options.pageSize : this.itemsPerPage
        const search = options.search !== undefined ? options.search : this.searchQuery
        const status = options.status !== undefined ? options.status : this.filters.status
        const position = options.position !== undefined ? options.position : this.filters.position
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy

        // Calculate offset from page and pageSize
        const offset = (page - 1) * pageSize

        const params = new URLSearchParams()
        if (search) params.append('search', search)
        params.append('limit', pageSize.toString())
        params.append('offset', offset.toString())
        params.append('page', page.toString())
        params.append('pageSize', pageSize.toString())
        
        // Add filter parameters (only if not default values)
        if (status && status !== 'All Status' && status !== 'All Statuses') {
          params.append('status', status)
        }
        if (position && position !== 'All Positions') {
          params.append('position', position)
        }
        if (sortBy) {
          params.append('sortBy', sortBy)
        }
        const response = await axios.get(`/church-records/accounts/getAllAccounts?${params}`)
        
        if (response.data && response.data.success) {
          this.accounts = response.data.data || []
          
          // Update pagination state
          this.currentPage = page
          this.itemsPerPage = pageSize
          
          // Use backend pagination data if available
          if (response.data.pagination) {
            this.totalPages = response.data.pagination.totalPages || 1
            this.totalCount = response.data.pagination.totalCount || 0
          } else {
            // Fallback calculation
            const totalCount = response.data.totalCount || response.data.count || this.accounts.length
            this.totalCount = totalCount
            this.totalPages = Math.ceil(totalCount / pageSize) || 1
          }
          
          // Update search query and filters if provided
          if (options.search !== undefined) {
            this.searchQuery = search
          }
          if (options.status !== undefined) {
            this.filters.status = status
          }
          if (options.position !== undefined) {
            this.filters.position = position
          }
          if (options.sortBy !== undefined) {
            this.filters.sortBy = sortBy
          }
        } else {
          this.error = response.data?.message || 'Failed to fetch accounts'
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch accounts'
        console.error('Error fetching accounts:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchAccountById(id) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`/church-records/accounts/getAccountById/${id}`)
        if (response.status === 200 ) {
          return response.data.data
        } else {
          return null
        }
      } catch (error) {
        console.error('Error fetching account:', error)
        return null
      }
    },

    async createAccount(accountData) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.post('/church-records/accounts/createAccount', accountData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        console.log('Create account response:', response)
        
        if (response.data && response.status === 201) {
          await this.fetchAccounts()
          return { success: true, data: response.data.data }
        } else {
          const errorMsg = response.data?.message || 'Failed to create account'
          this.error = errorMsg
          return { success: false, error: errorMsg }
        }
      } catch (error) {
        console.error('Error creating account:', error)
        const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create account'
        this.error = errorMsg
        return { success: false, error: errorMsg }
      } finally {
        this.loading = false
      }
    },

    async updateAccount(id, accountData) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.put(`/church-records/accounts/updateAccount/${id}`, accountData)
        console.log('Update account response:', response)
        
        if (response.data && response.status === 200) {
          await this.fetchAccounts()
          return { success: true, data: response.data.data, message: response.data.message }
        } else {
          const errorMsg = response.data?.message || 'Failed to update account'
          this.error = errorMsg
          return { success: false, error: errorMsg }
        }
      } catch (error) {
        console.error('Error updating account:', error)
        const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update account'
        this.error = errorMsg
        return { success: false, error: errorMsg }
      } finally {
        this.loading = false
      }
    },

    async deleteAccount(id) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.delete(`/church-records/accounts/deleteAccount/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data && response.status === 200) {
          await this.fetchAccounts()
          return { success: true }
        } else {
          this.error = response.data.message || 'Failed to delete account'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to delete account'
        console.error('Error deleting account:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchEmailOptions() {
      try {
        const response = await axios.get('/church-records/members/getAllMembersForSelect')
        if (response.data.success && response.data.data) {
          this.emailOptions = response.data.data
            .filter(member => member.email)
            .map(member => ({
              name: ` ${member.email} (${member.name})`,
              email: member.email
            }))
        }
      } catch (error) {
        console.error('Error fetching email options:', error)
      }
    },
    async forgotPassword(email) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post('/church-records/accounts/forgotPassword', { email })
        if (response.data.success) {
          return response.data.data
        } else {
          this.error = response.data.message || 'Failed to forgot password'
          return null
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to forgot password'
        console.error('Error forgot password:', error)
        return null
      } finally {
        this.loading = false
      }
    },
    setSearchQuery(query) {
      this.searchQuery = query
      this.currentPage = 1
      // Refetch with new search query
      this.fetchAccounts({ search: query, page: 1, pageSize: this.itemsPerPage })
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.currentPage = 1
      // Refetch with new filters
      this.fetchAccounts({ 
        ...filters, 
        page: 1, 
        pageSize: this.itemsPerPage, 
        search: this.searchQuery 
      })
    },

    setCurrentPage(page) {
      this.currentPage = page
      // Refetch with new page
      this.fetchAccounts({ page, pageSize: this.itemsPerPage, search: this.searchQuery })
    },

    setPageSize(pageSize) {
      // Validate pageSize is in allowed options
      if (this.pageSizeOptions.includes(pageSize)) {
        this.itemsPerPage = pageSize
        this.currentPage = 1 // Reset to first page when changing page size
        // Refetch with new page size
        this.fetchAccounts({ page: 1, pageSize, search: this.searchQuery })
      } else {
        console.warn(`Page size ${pageSize} is not in allowed options: ${this.pageSizeOptions.join(', ')}`)
      }
    },

    async exportAccountsToExcel(options = {}) {
      this.loading = true
      this.error = null
      try {
        // Use current filters if not provided
        const search = options.search !== undefined ? options.search : this.searchQuery
        const position = options.position !== undefined ? options.position : this.filters.position
        const status = options.status !== undefined ? options.status : this.filters.status
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy

        // Build query parameters
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (position && position !== 'All Positions') {
          params.append('position', position)
        }
        if (status && status !== 'All Statuses') {
          params.append('status', status)
        }
        if (sortBy) {
          params.append('sortBy', sortBy)
        }

        // Make request with responseType: 'blob' to handle binary data
        const response = await axios.get(`/church-records/accounts/exportExcel?${params}`, {
          responseType: 'blob'
        })

        // Create blob from response
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url

        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers['content-disposition']
        let filename = 'accounts_export.xlsx'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }

        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()

        // Cleanup
        link.remove()
        window.URL.revokeObjectURL(url)

        return { success: true, message: 'Excel file downloaded successfully' }
      } catch (error) {
        console.error('Error exporting accounts to Excel:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to export accounts to Excel'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    }
  }
})

