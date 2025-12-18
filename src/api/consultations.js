// Consultation related API wrappers
// All functions return parsed JSON when possible.

const API_BASE = 'http://localhost:8000/api';
function GetAuthHeaders() {
    const h = new Headers();
    const token = localStorage.getItem('access_token');
    if (token) {
        h.append('Authorization', `Bearer ${token}`);
    }
    return h;
}



function HandleResp(resp) {
    const ct = resp.headers.get('content-type') || '';
    if (!resp.ok) {
        if (ct.includes('application/json')) {
            return resp.json().then((j) => {
                let errorMessage = '';
                if (j.message) {
                    try {
                        const messageStr = j.message;
                        const errorMatches = messageStr.match(/'([^']*[\u4e00-\u9fa5]+[^']*)'/g);
                        if (errorMatches && errorMatches.length) {
                            errorMessage = errorMatches.map((m) => m.replace(/'/g, '')).join('；');
                        } else {
                            errorMessage = messageStr;
                        }
                    } catch (e) {
                        errorMessage = j.message;
                    }
                }
                if (!errorMessage) {
                    errorMessage = `${resp.status} ${resp.statusText}`;
                }
                const error = new Error(errorMessage);
                error.status = resp.status;
                error.body = j;
                throw error;
            });
        }
        return resp.text().then((t) => {
            const error = new Error(t || `${resp.status} ${resp.statusText}`);
            error.status = resp.status;
            throw error;
        });
    }
    if (ct.includes('application/json')) return resp.json();
    return resp.text();
}

export async function CreateConsultation({ doctor_id, initial_message } = {}) {
    const headers = GetAuthHeaders();
    headers.append('Content-Type', 'application/json');
    const body = JSON.stringify({ doctor_id, initial_message });
    const url = `${API_BASE}/consultations/`;
    console.log('创建问诊会话 URL:', url);
    console.log('创建问诊会话 body:', body);
    const resp = await fetch(url, { method: 'POST', headers, body, redirect: 'follow' });
    console.log('创建问诊会话 HTTP 状态码:', resp.status);
    const data = await HandleResp(resp);
    console.log('创建问诊会话响应:', data);
    return data;
}

export async function ListConsultations(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);
    const headers = GetAuthHeaders();
    const qs = query.toString();
    const url = qs ? `${API_BASE}/consultations/?${qs}` : `${API_BASE}/consultations/`;
    console.log('获取问诊列表 URL:', url);
    const resp = await fetch(url, { method: 'GET', headers, redirect: 'follow' });
    const data = await HandleResp(resp);
    console.log('获取问诊列表响应:', data);
    return data;
}

export async function GetConsultationDetail(consultationId, params = {}) {
    if (!consultationId) throw new Error('consultationId is required');
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);
    const headers = GetAuthHeaders();
    const qs = query.toString();
    const url = qs
        ? `${API_BASE}/consultations/${consultationId}/?${qs}`
        : `${API_BASE}/consultations/${consultationId}/`;
    console.log('获取问诊详情 URL:', url);
    const resp = await fetch(url, { method: 'GET', headers, redirect: 'follow' });
    const data = await HandleResp(resp);
    console.log('获取问诊详情响应:', data);
    return data;
}

export async function SendConsultationMessage(consultationId, { text }) {
    if (!consultationId) throw new Error('consultationId is required');
    const headers = GetAuthHeaders();
    headers.append('Content-Type', 'application/json');
    const body = JSON.stringify({ text });
    const url = `${API_BASE}/consultations/${consultationId}/messages/`;
    console.log('发送消息 URL:', url);
    console.log('发送消息 body:', body);
    const resp = await fetch(url, { method: 'POST', headers, body, redirect: 'follow' });
    console.log('发送消息 HTTP 状态码:', resp.status);
    const data = await HandleResp(resp);
    console.log('发送消息响应:', data);
    return data;
}

export async function CloseConsultation(consultationId) {
    if (!consultationId) throw new Error('consultationId is required');
    const headers = GetAuthHeaders();
    const url = `${API_BASE}/consultations/${consultationId}/close/`;
    console.log('关闭问诊会话 URL:', url);
    const resp = await fetch(url, { method: 'POST', headers, redirect: 'follow' });
    const data = await HandleResp(resp);
    console.log('关闭问诊会话响应:', data);
    return data;
}

const consultationApi = {
    CreateConsultation,
    ListConsultations,
    GetConsultationDetail,
    SendConsultationMessage,
    CloseConsultation,
};

export default consultationApi;

