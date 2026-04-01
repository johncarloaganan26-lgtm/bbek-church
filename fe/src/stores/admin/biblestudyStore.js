import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from '@/api/axios';
import { ElMessage } from 'element-plus';

export const useAdminBibleStudyStore = defineStore('admin-biblestudy', () => {
    const requests = ref([]);
    const loading = ref(false);
    const totalCount = ref(0);
    const currentPage = ref(1);
    const pageSize = ref(10);
    const filters = ref({
        status: 'All',
        search: '',
        sortBy: 'date_created_desc'
    });

    const pastors = ref([]);

    const fetchPastors = async () => {
        try {
            const response = await axios.get('/church-records/church-leaders/getAllChurchLeadersForSelect');
            if (response.data.success) {
                pastors.value = response.data.data;
            }
        } catch (error) {
            console.error('Error fetching pastors:', error);
        }
    };

    const fetchRequests = async () => {
        loading.value = true;
        try {
            const params = {
                page: currentPage.value,
                pageSize: pageSize.value,
                search: filters.value.search,
                status: filters.value.status === 'All' ? '' : filters.value.status,
                startDate: filters.value.startDate,
                endDate: filters.value.endDate
            };

            const response = await axios.get('/services/biblestudy-requests', { params });

            if (response.data.success) {
                requests.value = response.data.data;
                totalCount.value = response.data.pagination.total;
            }
        } catch (error) {
            console.error('Error fetching Bible Study requests:', error);
            ElMessage.error('Failed to fetch requests');
        } finally {
            loading.value = false;
        }
    };

    const updateRequest = async (id, data) => {
        loading.value = true;
        try {
            const response = await axios.put(`/services/biblestudy-requests/${id}`, data);
            if (response.data.success) {
                ElMessage.success('Bible Study updated successfully');
                await fetchRequests();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating Bible Study:', error);
            ElMessage.error(error.response?.data?.message || 'Failed to update request');
            return false;
        } finally {
            loading.value = false;
        }
    };

    const promoteToBaptism = async (id) => {
        loading.value = true;
        try {
            const response = await axios.post(`/services/biblestudy-requests/promote/${id}`);
            if (response.data.success) {
                ElMessage.success('Candidate successfully promoted to Water Baptism (Pending status).');
                await fetchRequests();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error promoting to baptism:', error);
            ElMessage.error(error.response?.data?.message || 'Failed to promote candidate');
            return false;
        } finally {
            loading.value = false;
        }
    };

    const inviteToBaptism = async (id) => {
        loading.value = true;
        try {
            const response = await axios.post(`/services/biblestudy-requests/invite-baptism/${id}`);
            if (response.data.success) {
                ElMessage.success('Baptism invitation email sent successfully (no record created yet).');
                await fetchRequests();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error sending invitation:', error);
            ElMessage.error(error.response?.data?.message || 'Failed to send invitation');
            return false;
        } finally {
            loading.value = false;
        }
    };

    const setPage = (page) => {
        currentPage.value = page;
        fetchRequests();
    };

    const setFilters = (newFilters) => {
        filters.value = { ...filters.value, ...newFilters };
        currentPage.value = 1;
        fetchRequests();
    };

    const bulkCompleteRequests = async (requestIds) => {
        loading.value = true;
        try {
            const response = await axios.post('/services/biblestudy-requests/bulk-complete', { requestIds });
            if (response.data.success) {
                ElMessage.success(response.data.message || 'Requests completed successfully');
                await fetchRequests();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error bulk completing Bible Study:', error);
            ElMessage.error(error.response?.data?.message || 'Failed to bulk complete requests');
            return false;
        } finally {
            loading.value = false;
        }
    };

    const rejectRequest = async (id, reason) => {
        loading.value = true;
        try {
            const response = await axios.post(`/services/biblestudy-requests/reject/${id}`, { reason });
            if (response.data.success) {
                ElMessage.success('Bible Study request rejected and suggestions sent.');
                await fetchRequests();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error rejecting Bible Study:', error);
            ElMessage.error(error.response?.data?.message || 'Failed to reject request');
            return false;
        } finally {
            loading.value = false;
        }
    };

    const bulkArchiveRequests = async (requestIds, reason) => {
        loading.value = true;
        try {
            const response = await axios.post('/services/biblestudy-requests/bulk-archive', { requestIds, reason });
            if (response.data.success) {
                ElMessage.success(response.data.message || 'Requests archived successfully');
                await fetchRequests();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error bulk archiving Bible Study:', error);
            ElMessage.error(error.response?.data?.message || 'Failed to bulk archive requests');
            return false;
        } finally {
            loading.value = false;
        }
    };

    const bulkUpdateRequest = async (data) => {
        loading.value = true;
        try {
            const response = await axios.post('/services/biblestudy-requests/bulk-update', data);
            if (response.data.success) {
                ElMessage.success(response.data.message || 'Bulk update completed successfully');
                await fetchRequests();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error bulk updating Bible Study:', error);
            ElMessage.error(error.response?.data?.message || 'Failed to bulk update requests');
            return false;
        } finally {
            loading.value = false;
        }
    };

    const bulkPromoteToBaptism = async (requestIds, isDecided = false, overrides = {}) => {
        loading.value = true;
        try {
            const response = await axios.post('/services/biblestudy-requests/bulk-promote', { requestIds, isDecided, overrides });
            if (response.data.success) {
                ElMessage.success(response.data.message || 'Bulk promotion completed successfully');
                await fetchRequests();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error bulk promoting Bible Study:', error);
            ElMessage.error(error.response?.data?.message || 'Failed to bulk promote requests');
            return false;
        } finally {
            loading.value = false;
        }
    };

    const exportToExcel = async (params = {}) => {
        try {
            const format = params.format || 'xlsx';
            const response = await axios.get('/services/biblestudy-requests/exportExcel', {
                params,
                responseType: 'blob'
            });
            
            const contentType = format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            const blob = new Blob([response.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `biblestudy_records_${new Date().toISOString().split('T')[0]}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Export error:', error);
            ElMessage.error('Failed to export records');
            return false;
        }
    };

    return {
        requests,
        loading,
        totalCount,
        currentPage,
        pageSize,
        filters,
        pastors,
        fetchPastors,
        fetchRequests,
        updateRequest,
        bulkCompleteRequests,
        bulkArchiveRequests,
        bulkUpdateRequest,
        bulkPromoteToBaptism,
        promoteToBaptism,
        inviteToBaptism,
        rejectRequest,
        exportToExcel,
        setPage,
        setFilters
    };
});
