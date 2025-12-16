// API wrapper for doctor endpoints
// 医生端 API 接口

const API_BASE = 'http://127.0.0.1:4523/m1/7500990-7236569-6684919';

function getAuthHeader() {
    const token = localStorage.getItem('authToken') || localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

function handleResponse(res) {
    if (!res) return null;
    try {
        return typeof res === 'string' ? JSON.parse(res) : res;
    } catch {
        return res;
    }
}

/**
 * 获取医生详情
 * @returns {Promise<Object>}
 */
export async function getDoctorDetail() {
    try {
        const response = await fetch(`${API_BASE}/doctors/`, {
            method: 'GET',
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.text();
        console.log('获取医生详情原始响应:', data);
        const parsedData = handleResponse(data);
        console.log('解析后的医生详情:', parsedData);
        return parsedData;
    } catch (error) {
        console.error('获取医生详情失败:', error);
        throw error;
    }
}

/**
 * 医生端获取自己的详情
 * @returns {Promise<Object>}
 */
export async function getDoctorMe() {
    try {
        const response = await fetch(`${API_BASE}/doctors/me`, {
            method: 'GET',
            headers: getAuthHeader(),
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.text();
        console.log('获取医生信息原始响应:', data);
        const parsedData = handleResponse(data);
        console.log('解析后的医生信息:', parsedData);
        return parsedData;
    } catch (error) {
        console.error('获取医生自己的详情失败:', error);
        throw error;
    }
}

/**
 * 医生端更新个人信息
 * @param {Object} updateData - { title, name, specialty, bio, avatar, phone, email }
 * @returns {Promise<Object>}
 */
export async function updateDoctorProfile(updateData) {
    try {
        const response = await fetch(`${API_BASE}/doctors/me`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify(updateData),
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.text();
        console.log('更新医生信息原始响应:', data);
        const parsedData = handleResponse(data);
        console.log('解析后的医生信息:', parsedData);
        return parsedData;
    } catch (error) {
        console.error('更新医生个人信息失败:', error);
        throw error;
    }
}

/**
 * 医生端设置在线状态
 * @param {boolean} isOnline
 * @returns {Promise<Object>}
 */
export async function setDoctorOnlineStatus(isOnline) {
    try {
        const response = await fetch(`${API_BASE}/doctors/me/online-status`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({ is_online: isOnline }),
            redirect: 'follow'
        });
        const data = await response.text();
        return handleResponse(data);
    } catch (error) {
        console.error('设置在线状态失败:', error);
        throw error;
    }
}

/**
 * 获取预约列表
 * @param {Object} params - { status, page, page_size }
 * @returns {Promise<Object>}
 */
export async function getAppointments(params = {}) {
    try {
        const queryStr = new URLSearchParams(params).toString();
        const url = queryStr ? `${API_BASE}/appointments?${queryStr}` : `${API_BASE}/appointments`;
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeader(),
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.text();
        console.log('获取预约列表原始响应:', data);
        const parsedData = handleResponse(data);
        console.log('解析后的预约数据:', parsedData);
        return parsedData;
    } catch (error) {
        console.error('获取预约列表失败:', error);
        throw error;
    }
}

/**
 * 医生端完成预约
 * @param {string|number} appointmentId
 * @returns {Promise<Object>}
 */
export async function completeAppointment(appointmentId) {
    try {
        const response = await fetch(`${API_BASE}/appointments/${appointmentId}/complete`, {
            method: 'POST',
            headers: getAuthHeader(),
            redirect: 'follow'
        });
        const data = await response.text();
        return handleResponse(data);
    } catch (error) {
        console.error('完成预约失败:', error);
        throw error;
    }
}

/**
 * 医生端创建病例
 * @param {Object} recordData - { user_id, hospital_id, date, diagnosis, content, treatment, medications, result_image }
 * @returns {Promise<Object>}
 */
export async function createRecord(recordData) {
    try {
        const response = await fetch(`${API_BASE}/records`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify(recordData),
            redirect: 'follow'
        });
        const data = await response.text();
        return handleResponse(data);
    } catch (error) {
        console.error('创建病例失败:', error);
        throw error;
    }
}

/**
 * 医生端更新病例
 * @param {string|number} recordId
 * @param {Object} recordData - { date, diagnosis, content, treatment, medications, result_image }
 * @returns {Promise<Object>}
 */
export async function updateRecord(recordId, recordData) {
    try {
        const response = await fetch(`${API_BASE}/records/${recordId}`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify(recordData),
            redirect: 'follow'
        });
        const data = await response.text();
        return handleResponse(data);
    } catch (error) {
        console.error('更新病例失败:', error);
        throw error;
    }
}

/**
 * 医生端获取患者病例列表
 * @param {Object} params - { patient_id, page, page_size, date_from, date_to, patient_name, doctor_name }
 * @returns {Promise<Object>}
 */
export async function getPatientRecords(params = {}) {
    try {
        // 过滤空值参数
        const filteredParams = {};
        Object.keys(params).forEach(key => {
            if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
                filteredParams[key] = params[key];
            }
        });
        
        const queryStr = new URLSearchParams(filteredParams).toString();
        const url = queryStr ? `${API_BASE}/doctors/patients/records?${queryStr}` : `${API_BASE}/doctors/patients/records`;
        
        console.log('获取患者病例列表 URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeader(),
            redirect: 'follow'
        });
        const data = await response.text();
        console.log('患者病例列表响应:', data);
        return handleResponse(data);
    } catch (error) {
        console.error('获取患者病例列表失败:', error);
        throw error;
    }
}

export default {
    getDoctorDetail,
    getDoctorMe,
    updateDoctorProfile,
    setDoctorOnlineStatus,
    getAppointments,
    completeAppointment,
    createRecord,
    updateRecord,
    getPatientRecords
};
