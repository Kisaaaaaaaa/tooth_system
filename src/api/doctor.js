// API wrapper for doctor endpoints
// 医生端 API 接口

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:8000/api';

function getAuthHeader() {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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

// 从 localStorage 获取当前登录用户（兼容不同存储结构）
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
        const parsed = JSON.parse(userStr);
        // 可能直接是用户对象，也可能是 { user: {...} }
        return parsed.user || parsed;
    } catch (e) {
        console.warn('解析用户信息失败:', e);
        return null;
    }
}

import { resolveMediaUrl } from './utils';

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
        const headers = getAuthHeader();
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id;
        if (!currentUserId) {
            throw new Error('未找到当前用户ID，无法匹配医生');
        }

        const errors = [];

        // 1) 先尝试后端可能存在的自查接口 /doctors/me/
        const selfUrls = [`${API_BASE}/doctors/me/`, `${API_BASE}/doctors/me/`];
        for (const url of selfUrls) {
            const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify({}), redirect: 'follow' });
            const body = await res.text();
            if (res.ok) {
                const parsed = handleResponse(body);
                const doctor = parsed?.data ?? parsed;
                const merged = currentUser ? {
                    ...doctor,
                    email: currentUser.email ?? doctor?.email,
                    phone: currentUser.phone ?? doctor?.phone,
                    name: doctor?.name ?? currentUser.name
                } : doctor;
                console.log(`[doctor.me] 使用 PUT ${url} 成功返回:`, merged);
                return merged;
            }
            const allow = res.headers?.get?.('allow') || '';
            errors.push({ url, method: 'PUT', status: res.status, allow, body });
        }

        // 2) 拉取医生列表，按 user_id 匹配 doctor_id
        const listRes = await fetch(`${API_BASE}/doctors/`, {
            method: 'GET',
            headers,
            redirect: 'follow'
        });
        const listBody = await listRes.text();
        if (!listRes.ok) {
            errors.push({ url: `${API_BASE}/doctors/`, status: listRes.status, body: listBody });
            throw new Error(`无法获取医生列表: ${JSON.stringify(errors)}`);
        }

        const parsedList = handleResponse(listBody);
        const doctorList = parsedList?.data?.results
            || parsedList?.results
            || parsedList?.data
            || parsedList;

        const normalizeId = (v) => (v === undefined || v === null) ? null : Number(v);
        const matchedDoctor = Array.isArray(doctorList)
            ? doctorList.find(d => normalizeId(d?.user_id) === normalizeId(currentUserId))
            : null;

        const doctorId = normalizeId(matchedDoctor?.id) ?? (Array.isArray(doctorList) && doctorList.length ? normalizeId(doctorList[0]?.id) : null);
        if (!doctorId) {
            errors.push({ reason: '列表中未找到匹配的医生且无可用医生项', currentUserId });
            throw new Error(`未找到当前医生，调试信息: ${JSON.stringify(errors)}`);
        }

        // 3) 根据 doctor_id 请求详情 /doctors/{doctor_id}
        const detailRes = await fetch(`${API_BASE}/doctors/${doctorId}/`, {
            method: 'GET',
            headers,
            redirect: 'follow'
        });
        const detailBody = await detailRes.text();
        if (!detailRes.ok) {
            errors.push({ url: `${API_BASE}/doctors/${doctorId}/`, status: detailRes.status, body: detailBody });
            throw new Error(`获取医生详情失败: ${JSON.stringify(errors)}`);
        }

        const parsedDetail = handleResponse(detailBody);
            const doctorRaw = parsedDetail?.data ?? parsedDetail;
            const doctor = {
                ...doctorRaw,
                avatar: resolveMediaUrl(doctorRaw?.avatar)
            };
        const mergedDoctor = currentUser ? {
            ...doctor,
            email: currentUser.email ?? doctor?.email,
            phone: currentUser.phone ?? doctor?.phone,
            name: doctor?.name ?? currentUser.name
        } : doctor;

        console.log('解析后的医生信息(根据 doctor_id 获取):', mergedDoctor);
        return mergedDoctor;
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
        const headers = getAuthHeader();
        const payload = JSON.stringify(updateData || {});
        const methods = ['PATCH', 'PUT'];
        const errors = [];

        // 1) 尝试 /doctors/me 或 /doctors/me/，按 PATCH/PUT 组合
        const meUrls = [`${API_BASE}/doctors/me/`, `${API_BASE}/doctors/me/`];
        for (const url of meUrls) {
            for (const method of methods) {
                const res = await fetch(url, { method, headers, body: payload, redirect: 'follow' });
                const bodyText = await res.text();
                if (res.ok) {
                    const parsed = handleResponse(bodyText);
                    const normalized = parsed?.data ?? parsed;
                    console.log(`[doctor.update] ${method} ${url} 成功:`, normalized);
                    return normalized;
                }
                const allow = res.headers?.get?.('allow') || '';
                errors.push({ url, method, status: res.status, allow, body: bodyText });

                // 若 405 且允许另一种方法，自动重试一次
                if (res.status === 405 && allow) {
                    const alt = allow.toUpperCase().includes('PATCH') && method !== 'PATCH' ? 'PATCH'
                        : allow.toUpperCase().includes('PUT') && method !== 'PUT' ? 'PUT'
                        : null;
                    if (alt) {
                        const retry = await fetch(url, { method: alt, headers, body: payload, redirect: 'follow' });
                        const retryBody = await retry.text();
                        if (retry.ok) {
                            const parsed = handleResponse(retryBody);
                            const normalized = parsed?.data ?? parsed;
                            console.log(`[doctor.update] ${alt} ${url} 成功(Allow回退):`, normalized);
                            return normalized;
                        }
                        errors.push({ url, method: alt, status: retry.status, allow, body: retryBody });
                    }
                }
            }
        }

        // 2) 回退：用当前用户匹配 doctor_id，再调 /doctors/{id}
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id;
        if (!currentUserId) {
            throw new Error(`无法获取当前用户ID，错误: ${JSON.stringify(errors)}`);
        }

        const listRes = await fetch(`${API_BASE}/doctors/`, { method: 'GET', headers, redirect: 'follow' });
        const listBody = await listRes.text();
        if (!listRes.ok) {
            errors.push({ url: `${API_BASE}/doctors/`, method: 'GET', status: listRes.status, body: listBody });
            throw new Error(`更新失败，且无法获取医生列表: ${JSON.stringify(errors)}`);
        }
        const parsedList = handleResponse(listBody);
        const doctorList = parsedList?.data?.results || parsedList?.results || parsedList?.data || parsedList;
        const matchedDoctor = Array.isArray(doctorList) ? doctorList.find(d => d?.user_id === currentUserId) : null;
        const doctorId = matchedDoctor?.id;
        if (!doctorId) {
            errors.push({ reason: '列表中未找到匹配的医生', currentUserId });
            throw new Error(`更新失败，未找到 doctor_id，调试: ${JSON.stringify(errors)}`);
        }

        for (const method of methods) {
            const url = `${API_BASE}/doctors/${doctorId}`;
            const res = await fetch(url, { method, headers, body: payload, redirect: 'follow' });
            const bodyText = await res.text();
            if (res.ok) {
                const parsed = handleResponse(bodyText);
                const normalized = parsed?.data ?? parsed;
                console.log(`[doctor.update] ${method} ${url} 成功:`, normalized);
                return normalized;
            }
            const allow = res.headers?.get?.('allow') || '';
            errors.push({ url, method, status: res.status, allow, body: bodyText });
        }

        throw new Error(`更新医生信息失败: ${JSON.stringify(errors)}`);
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
        const response = await fetch(`${API_BASE}/doctors/me/online-status/`, {
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
        const url = queryStr ? `${API_BASE}/appointments?${queryStr}` : `${API_BASE}/appointments/`;
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
        const response = await fetch(`${API_BASE}/appointments/${appointmentId}/complete/`, {
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
        const response = await fetch(`${API_BASE}/records/`, {
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
        const response = await fetch(`${API_BASE}/records/${recordId}/`, {
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
        const url = queryStr ? `${API_BASE}/doctors/patients/records/?${queryStr}` : `${API_BASE}/doctors/patients/records/`;
        
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
