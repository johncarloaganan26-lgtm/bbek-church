import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from '@/api/axios';
import { ElMessage } from 'element-plus';

export const useAdminDiscipleshipStore = defineStore('admin-discipleship', () => {
    const requests = ref([]);
    const loading = ref(false);
    const totalCount = ref(0);
    const currentPage = ref(1);
    const pageSize = ref(10);
    const filters = ref({
        status: 'All',
        search: '',
        request_type: 'Salvation',
        sortBy: 'date_created_desc'
    });

    const pastors = ref([]);

    const fetchPastors = async () => {
        try {
            const response = await axios.get('/church-records/church-leaders/getAllChurchLeadersForSelect');
            if (response.data.success) {
                // Ensure every pastor has an id field mapped to acc_id for consistency
                // and normalized (no leading zeros) for perfect v-select matching
                pastors.value = response.data.data.map(p => {
                    const rawId = String(p.acc_id || p.id || '');
                    const cleanId = rawId.replace(/^0+/, '');
                    return {
                        ...p,
                        id: cleanId === '' ? (rawId === '0' ? '0' : null) : cleanId,
                        name: p.name
                    };
                });
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
                status: filters.value.status === 'All' ? undefined : filters.value.status,
                request_type: filters.value.request_type,
                startDate: filters.value.startDate,
                endDate: filters.value.endDate
            };

            const response = await axios.get('/services/discipleship-requests', { params });

            if (response.data.success) {
                requests.value = response.data.data;
                totalCount.value = response.data.pagination.totalCount;
            }
        } catch (error) {
            console.error('Error fetching discipleship requests:', error);
            ElMessage.error('Failed to fetch requests');
        } finally {
            loading.value = false;
        }
    };

    const updateRequest = async (id, data) => {
        loading.value = true;
        try {
            const response = await axios.put(`/services/discipleship-requests/${id}`, data);
            if (response.data.success) {
                ElMessage.success('Request updated successfully');
                await fetchRequests(); // Refresh list
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating request:', error);
            if (error.response?.data) {
                console.warn('API Error Details:', JSON.stringify(error.response.data, null, 2));
            }
            const errorMessage = error.response?.data?.message || error.response?.data?.errorCode || 'Failed to update request';
            ElMessage.error(errorMessage);
            return false;
        } finally {
            loading.value = false;
        }
    };

    const createRequest = async (data) => {
        loading.value = true;
        try {
            const response = await axios.post('/services/discipleship-requests/submit', data);
            if (response.data.success) {
                ElMessage.success('New request created successfully');
                await fetchRequests();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error creating request:', error);
            ElMessage.error(error.response?.data?.message || 'Failed to create request');
            return false;
        } finally {
            loading.value = false;
        }
    };

    const promoteToBaptism = async (id) => {
        loading.value = true;
        try {
            const response = await axios.post(`/services/discipleship-requests/promote/${id}`);
            if (response.data.success) {
                ElMessage.success('Successfully promoted to Baptism candidates!');
                await fetchRequests();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error promoting request:', error);
            ElMessage.error(error.response?.data?.message || 'Failed to promote request');
            return false;
        } finally {
            loading.value = false;
        }
    };

    const promoteToBibleStudy = async (id, payload) => {
        loading.value = true;
        try {
            const data = typeof payload === 'object' ? payload : { isDecided: !!payload };
            const response = await axios.post(`/services/discipleship-requests/promote-to-bible-study/${id}`, data);
            if (response.data.success) {
                ElMessage.success(response.data.message || (data.isDecided
                    ? 'Promoted to Bible Study! Please schedule the sessions.'
                    : 'Record updated and invitation form link sent to candidate.'));
                await fetchRequests();
                return true;
            }
            ElMessage.error(response.data?.message || 'Failed to promote to Bible Study');
            return false;
        } catch (error) {
            console.error('Error promoting to Bible Study:', error);
            ElMessage.error(error.response?.data?.message || 'Failed to promote to Bible Study');
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
        currentPage.value = 1; // Reset to first page on filter change
        fetchRequests();
    };

    const rejectRequest = async (id, reason) => {
        loading.value = true;
        try {
            const response = await axios.post(`/services/discipleship-requests/reject/${id}`, { reason });
            if (response.data.success) {
                ElMessage.success('Request rejected and email with suggestions sent');
                await fetchRequests();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error rejecting request:', error);
            ElMessage.error(error.response?.data?.message || 'Failed to reject request');
            return false;
        } finally {
            loading.value = false;
        }
    };

    const deleteRequest = async (id, reason = '') => {
        loading.value = true;
        try {
            const response = await axios.delete(`/services/discipleship-requests/${id}`, {
                data: { reason }
            });
            if (response.data.success) {
                ElMessage.success('Request archived successfully');
                await fetchRequests();
                return response.data;
            }
            ElMessage.error(response.data.message || 'Failed to archive request');
            return response.data;
        } catch (error) {
            console.error('Error archiving request:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to archive request';
            ElMessage.error(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            loading.value = false;
        }
    };

    const inviteToBaptism = async (id, isDecided = false) => {
        loading.value = true;
        try {
            const response = await axios.post(`/services/discipleship-requests/invite-baptism/${id}`, { isDecided });
            if (response.data.success) {
                if (isDecided) {
                    ElMessage.success('Candidate successfully promoted to Water Baptism module!');
                } else {
                    ElMessage.success('Baptism invitation email sent to the requester!');
                }
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

    const fetchRegistrationData = async (id) => {
        try {
            const response = await axios.get(`/services/discipleship-requests/registration-data/${id}`);
            return response.data.success ? response.data.data : null;
        } catch (error) {
            console.error('Error fetching registration data:', error);
            return null;
        }
    };

    const bulkArchiveRequests = async (requestIds, reason) => {
        loading.value = true;
        try {
            const response = await axios.post('/services/discipleship-requests/bulk-archive', {
                requestIds,
                reason
            });
            
            if (response.data.success) {
                const { archived, failed } = response.data.data;
                ElMessage.success(`Successfully archived ${archived.length} requests`);
                
                if (failed.length > 0) {
                    ElMessage.warning(`${failed.length} requests failed to archive`);
                }
                
                await fetchRequests();
                return response.data;
            }
            
            ElMessage.error(response.data.message || 'Failed to archive requests');
            return response.data;
        } catch (error) {
            console.error('Error bulk archiving requests:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to archive requests';
            ElMessage.error(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            loading.value = false;
        }
    };

    const bulkCompleteRequests = async (requestIds) => {
        loading.value = true;
        try {
            const response = await axios.post('/services/discipleship-requests/bulk-complete', {
                requestIds
            });
            
            if (response.data.success) {
                const { completed, failed } = response.data.data;
                ElMessage.success(`Successfully completed ${completed.length} requests`);
                
                if (failed.length > 0) {
                    const errorReasons = failed.map(f => f.reason).join(', ');
                    ElMessage.warning(`${failed.length} requests failed to complete: ${errorReasons}`);
                }
                
                await fetchRequests();
                return response.data;
            }
            
            ElMessage.error(response.data.message || 'Failed to complete requests');
            return response.data;
        } catch (error) {
            console.error('Error bulk completing requests:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to complete requests';
            ElMessage.error(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            loading.value = false;
        }
    };

    const schedulePromotionVisit = async (id, data) => {
        loading.value = true;
        try {
            const response = await axios.post(`/services/promotion-visits/${id}`, data);
            if (response.data.success) {
                ElMessage.success('Promotion visit scheduled successfully');
                return true;
            }
            ElMessage.error(response.data.message || 'Failed to schedule promotion visit');
            return false;
        } catch (error) {
            console.error('Error scheduling promotion visit:', error);
            ElMessage.error(error.response?.data?.message || 'Failed to schedule promotion visit');
            return false;
        } finally {
            loading.value = false;
        }
    };

    const fetchPromotionVisit = async (id) => {
        try {
            const response = await axios.get(`/services/promotion-visits/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching promotion visit:', error);
            return { success: false };
        }
    };

    const exportToExcel = async (params = {}) => {
        try {
            const format = params.format || 'xlsx';
            const response = await axios.get('/services/discipleship-requests/exportExcel', {
                params,
                responseType: 'blob'
            });
            
            const contentType = format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            const blob = new Blob([response.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `salvation_records_${new Date().toISOString().split('T')[0]}.${format}`);
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
        promoteToBaptism,
        promoteToBibleStudy,
        inviteToBaptism,
        rejectRequest,
        fetchRegistrationData,
        deleteRequest,
        bulkArchiveRequests,
        bulkCompleteRequests,
        createRequest,
        schedulePromotionVisit,
        fetchPromotionVisit,
        exportToExcel,
        setPage,
        setFilters
    };
});
