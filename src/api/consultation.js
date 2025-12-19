// 在线问诊 API 接口
// 医生端和患者端都使用这些接口进行消息交互

const API_BASE = 'http://localhost:8000/api';

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
 * 创建问诊会话 (患者端调用)
 * @param {Object} sessionData - { doctor_id, content }
 * @returns {Promise<Object>}
 */
export async function createConsultationSession(sessionData) {
    try {
        const response = await fetch(`${API_BASE}/consultation-sessions`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify(sessionData),
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.text();
        console.log('创建问诊会话响应:', data);
        return handleResponse(data);
    } catch (error) {
        console.error('创建问诊会话失败:', error);
        throw error;
    }
}

/**
 * 获取问诊列表 (医生端和患者端都可用)
 * @param {Object} params - { status, page, page_size }
 * @returns {Promise<Object>}
 */
export async function getConsultationSessions(params = {}) {
    try {
        const queryStr = new URLSearchParams(params).toString();
        const url = queryStr ? `${API_BASE}/consultations/?${queryStr}` : `${API_BASE}/consultations/`;
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeader(),
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('获取问诊列表响应:', data);
        return data;
    } catch (error) {
        console.error('获取问诊列表失败:', error);
        throw error;
    }
}

/**
 * 获取问诊详情（包括聊天记录）
 * @param {string|number} consultationId
 * @param {Object} params - { page, page_size }
 * @returns {Promise<Object>}
 */
export async function getConsultationDetail(consultationId, params = {}) {
    try {
        const queryStr = new URLSearchParams(params).toString();
        const url = queryStr
            ? `${API_BASE}/consultations/${consultationId}/?${queryStr}`
            : `${API_BASE}/consultations/${consultationId}/`;
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeader(),
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('获取问诊详情响应:', data);
        return data;
    } catch (error) {
        console.error('获取问诊详情失败:', error);
        throw error;
    }
}

/**
 * 获取问诊会话详情（包括聊天记录）- 保留此方法用于兼容性
 * @param {string|number} sessionId
 * @returns {Promise<Object>}
 */
export async function getConsultationSessionDetail(sessionId) {
    return getConsultationDetail(sessionId);
}

/**
 * 发送消息 (医生端和患者端都可用)
 * @param {string|number} consultationId
 * @param {string} text - 消息内容
 * @returns {Promise<Object>}
 */
export async function sendMessage(consultationId, text) {
    try {
        const messageData = JSON.stringify({ text });
        const url = `${API_BASE}/consultations/${consultationId}/messages/`;
        console.log('发送消息 URL:', url);
        console.log('发送消息 body:', messageData);

        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeader(),
            body: messageData,
            redirect: 'follow'
        });

        console.log('发送消息 HTTP 状态码:', response.status);

        const data = await response.json();
        console.log('发送消息 响应数据:', data);

        if (!response.ok) {
            console.error('HTTP 请求失败，状态码:', response.status);
        }

        return data;
    } catch (error) {
        console.error('发送消息异常:', error);
        throw error;
    }
}

/**
 * 关闭问诊会话 (医生或患者可以关闭)
 * @param {string|number} consultationId
 * @returns {Promise<Object>}
 */
export async function closeConsultationSession(consultationId) {
    try {
        const response = await fetch(`${API_BASE}/consultations/${consultationId}/close/`, {
            method: 'POST',
            headers: getAuthHeader(),
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('关闭问诊会话响应:', data);
        return data;
    } catch (error) {
        console.error('关闭问诊会话失败:', error);
        throw error;
    }
}

export default {
    createConsultationSession,
    getConsultationSessions,
    getConsultationSessionDetail,
    getConsultationDetail,
    sendMessage,
    closeConsultationSession
};