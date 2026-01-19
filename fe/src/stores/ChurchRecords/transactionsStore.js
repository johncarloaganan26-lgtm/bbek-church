import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useTransactionsStore = defineStore('transactions', {
  state: () => ({
    transactions: [],
    loading: false,
    error: null,
    searchQuery: '',
    filters: {
      sortBy: 'Date Created (Newest)',
      type_of_service: 'burial'
    },
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    itemsPerPage: 10,
    pageSizeOptions: [10, 20, 50, 100],
    totalsByServiceType: [],
    summaryStats: {
      grand_total: 0,
      total_transactions: 0
    },
    loadingTotals: false,
    searchTimeout: null
  }),

  getters: {
    filteredTransactions: (state) => {
      // Backend handles filtering, so just return transactions
      return state.transactions
    },

    paginatedTransactions: (state) => {
      // Backend handles pagination, so just return transactions
      return state.transactions
    }
  },

  actions: {
    async fetchTransactions(options = {}) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        // Use options or fallback to state values
        const page = options.page !== undefined ? options.page : this.currentPage
        const pageSize = options.pageSize !== undefined ? options.pageSize : this.itemsPerPage
        const search = options.search !== undefined ? options.search : this.searchQuery
        const type_of_service = options.type_of_service !== undefined ? options.type_of_service : this.filters.type_of_service
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy

        const params = new URLSearchParams()
        if (search) params.append('search', search)
        params.append('page', page.toString())
        params.append('pageSize', pageSize.toString())
        
        // Add filter parameters
        if (type_of_service && type_of_service !== 'All Services') {
          params.append('type_of_service', type_of_service)
        }
        if (sortBy) {
          params.append('sortBy', sortBy)
        }

        const response = await axios.get(`/transactions/getAllTransactions?${params}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.data && response.data.success) {
          this.transactions = response.data.data || []
          
          // Update pagination state
          this.currentPage = page
          this.itemsPerPage = pageSize
          
          // Use backend pagination data if available
          if (response.data.pagination) {
            this.totalPages = response.data.pagination.totalPages || 1
            this.totalCount = response.data.pagination.totalCount || 0
          } else {
            // Fallback calculation
            const totalCount = response.data.totalCount || response.data.count || this.transactions.length
            this.totalCount = totalCount
            this.totalPages = Math.ceil(totalCount / pageSize) || 1
          }
          
          // Update search query and filters if provided
          if (options.search !== undefined) {
            this.searchQuery = search
          }
          if (options.type_of_service !== undefined) {
            this.filters.type_of_service = type_of_service
          }
          if (options.sortBy !== undefined) {
            this.filters.sortBy = sortBy
          }
        } else {
          this.error = response.data?.message || 'Failed to fetch transactions'
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch transactions'
        console.error('Error fetching transactions:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchTransactionById(id) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.get(`/transactions/getTransactionById/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data.success) {
          return response.data.data
        } else {
          this.error = response.data.message || 'Failed to fetch transaction'
          return null
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch transaction'
        console.error('Error fetching transaction:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    async createTransaction(transactionData) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.post('/transactions/createTransaction', transactionData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.data && response.status === 201) {
          await this.fetchTransactions({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true, data: response.data.data }
        } else {
          const errorMsg = response.data?.message || 'Failed to create transaction'
          this.error = errorMsg
          return { success: false, error: errorMsg }
        }
      } catch (error) {
        console.error('Error creating transaction:', error)
        const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create transaction'
        this.error = errorMsg
        return { success: false, error: errorMsg }
      } finally {
        this.loading = false
      }
    },

    async updateTransaction(id, transactionData) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.put(`/transactions/updateTransaction/${id}`, transactionData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.data && response.data.success) {
          await this.fetchTransactions({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true, data: response.data.data }
        } else {
          const errorMsg = response.data?.message || 'Failed to update transaction'
          this.error = errorMsg
          return { success: false, error: errorMsg }
        }
      } catch (error) {
        console.error('Error updating transaction:', error)
        const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update transaction'
        this.error = errorMsg
        return { success: false, error: errorMsg }
      } finally {
        this.loading = false
      }
    },

    async deleteTransaction(id) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.delete(`/transactions/deleteTransaction/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.data && response.data.success) {
          await this.fetchTransactions({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true }
        } else {
          const errorMsg = response.data?.message || 'Failed to delete transaction'
          this.error = errorMsg
          return { success: false, error: errorMsg }
        }
      } catch (error) {
        console.error('Error deleting transaction:', error)
        const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to delete transaction'
        this.error = errorMsg
        return { success: false, error: errorMsg }
      } finally {
        this.loading = false
      }
    },

    setSearchQuery(query) {
      this.searchQuery = query
      this.currentPage = 1

      // Clear existing timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }

      // Debounce search to avoid too many API calls
      this.searchTimeout = setTimeout(() => {
        // Refetch with new search query
        this.fetchTransactions({ search: query, page: 1, pageSize: this.itemsPerPage })
      }, 500) // 500ms debounce
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.currentPage = 1
      // Refetch with new filters
      this.fetchTransactions({ 
        ...filters, 
        page: 1, 
        pageSize: this.itemsPerPage, 
        search: this.searchQuery 
      })
    },

    setCurrentPage(page) {
      this.currentPage = page
      // Refetch with new page
      this.fetchTransactions({ page, pageSize: this.itemsPerPage, search: this.searchQuery })
    },

    setPageSize(pageSize) {
      // Validate pageSize is in allowed options
      if (this.pageSizeOptions.includes(pageSize)) {
        this.itemsPerPage = pageSize
        this.currentPage = 1 // Reset to first page when changing page size
        // Refetch with new page size
        this.fetchTransactions({ page: 1, pageSize, search: this.searchQuery })
      } else {
        console.warn(`Page size ${pageSize} is not in allowed options: ${this.pageSizeOptions.join(', ')}`)
      }
    },

    async fetchTotalsByServiceType() {
      this.loadingTotals = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.get('/transactions/getTotalsByServiceType', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.data && response.data.success) {
          this.totalsByServiceType = response.data.data || []
          this.summaryStats = response.data.summary || {
            grand_total: 0,
            total_transactions: 0
          }
        } else {
          this.error = response.data?.message || 'Failed to fetch totals'
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch totals'
        console.error('Error fetching totals by service type:', error)
      } finally {
        this.loadingTotals = false
      }
    },

    async fetchTransactionsByMemberId(memberId, options = {}) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        // Use options or fallback to state values
        const page = options.page !== undefined ? options.page : this.currentPage
        const pageSize = options.pageSize !== undefined ? options.pageSize : this.itemsPerPage
        const search = options.search !== undefined ? options.search : this.searchQuery
        const type_of_service = options.type_of_service !== undefined ? options.type_of_service : this.filters.type_of_service
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy

        const params = new URLSearchParams()
        if (search) params.append('search', search)
        params.append('page', page.toString())
        params.append('pageSize', pageSize.toString())
        
        // Add filter parameters
        if (type_of_service && type_of_service !== 'All Services') {
          params.append('type_of_service', type_of_service)
        }
        if (sortBy) {
          params.append('sortBy', sortBy)
        }

        const response = await axios.get(`/transactions/getTransactionsByMemberId/${memberId}?${params}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.data && response.data.success) {
          this.transactions = response.data.data || []
          
          // Update pagination state
          this.currentPage = page
          this.itemsPerPage = pageSize
          
          // Use backend pagination data if available
          if (response.data.pagination) {
            this.totalPages = response.data.pagination.totalPages || 1
            this.totalCount = response.data.pagination.totalCount || 0
          } else {
            // Fallback calculation
            const totalCount = response.data.totalCount || response.data.count || this.transactions.length
            this.totalCount = totalCount
            this.totalPages = Math.ceil(totalCount / pageSize) || 1
          }
          
          // Update search query and filters if provided
          if (options.search !== undefined) {
            this.searchQuery = search
          }
          if (options.type_of_service !== undefined) {
            this.filters.type_of_service = type_of_service
          }
          if (options.sortBy !== undefined) {
            this.filters.sortBy = sortBy
          }
        } else {
          this.error = response.data?.message || 'Failed to fetch transactions'
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch transactions'
        console.error('Error fetching transactions by member ID:', error)
      } finally {
        this.loading = false
      }
    }
  }
})

