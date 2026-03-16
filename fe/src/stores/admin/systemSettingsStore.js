import { defineStore } from 'pinia';
import { ref, onMounted } from 'vue';
import axios from '@/api/axios';
import { ElMessage } from 'element-plus';

export const useSystemSettingsStore = defineStore('system-settings', () => {
    const settings = ref({
        allow_complete_without_schedule: false
    });
    const loading = ref(false);

    const fetchSettings = async () => {
        loading.value = true;
        try {
            const response = await axios.get('/cms/system_settings');
            if (response.data.success && response.data.data && response.data.data.content) {
                settings.value = {
                    ...settings.value,
                    ...response.data.data.content
                };
            }
        } catch (error) {
            console.warn('Failed to fetch system settings, using defaults:', error.message);
        } finally {
            loading.value = false;
        }
    };

    const updateSetting = async (key, value) => {
        const newSettings = { ...settings.value, [key]: value };
        loading.value = true;
        try {
            const response = await axios.post('/cms/system_settings', {
                content: newSettings
            });
            if (response.data.success) {
                settings.value = newSettings;
                ElMessage.success('Settings updated successfully');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating system settings:', error);
            ElMessage.error('Failed to update settings');
            return false;
        } finally {
            loading.value = false;
        }
    };

    const toggleAllowComplete = async (explicitValue = null) => {
        const newValue = explicitValue !== null ? explicitValue : !settings.value.allow_complete_without_schedule;
        return await updateSetting('allow_complete_without_schedule', newValue);
    };

    return {
        settings,
        loading,
        fetchSettings,
        updateSetting,
        toggleAllowComplete
    };
});
