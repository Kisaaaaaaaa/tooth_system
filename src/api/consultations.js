// Consultation related API wrappers
// All functions return parsed JSON when possible.

const API_BASE = 'http://localhost:8000/api';
function getAuthHeaders() {
    const h = new Headers();
    const token = localStorage.getItem('access_token');
    if (token) {
        h.append('Authorization', `Bearer ${token}`);
    }
    return h;
}



function handleResp(resp) {
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

export async function createConsultation({ doctor_id, initial_message } = {}) {
    const headers = getAuthHeaders();
    headers.append('Content-Type', 'application/json');
    const body = JSON.stringify({ doctor_id, initial_message });
    const resp = await fetch(`${API_BASE}/consultations/`, { method: 'POST', headers, body, redirect: 'follow' });
    return handleResp(resp);
}

export async function listConsultations(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);
    const headers = getAuthHeaders();
    const qs = query.toString();
    const resp = await fetch(`${API_BASE}/consultations/${qs ? `?${qs}` : ''}`, { method: 'GET', headers, redirect: 'follow' });
    return handleResp(resp);
}

export async function getConsultationDetail(consultationId, params = {}) {
    if (!consultationId) throw new Error('consultationId is required');
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);
    const headers = getAuthHeaders();
    const qs = query.toString();
    const resp = await fetch(`${API_BASE}/consultations/${consultationId}${qs ? `?${qs}` : ''}`, { method: 'GET', headers, redirect: 'follow' });
    return handleResp(resp);
}

export async function sendConsultationMessage(consultationId, { text }) {
    if (!consultationId) throw new Error('consultationId is required');
    const headers = getAuthHeaders();
    headers.append('Content-Type', 'application/json');
    const body = JSON.stringify({ text });
    const resp = await fetch(`${API_BASE}/consultations/${consultationId}/messages`, { method: 'POST', headers, body, redirect: 'follow' });
    return handleResp(resp);
}

export async function closeConsultation(consultationId) {
    if (!consultationId) throw new Error('consultationId is required');
    const headers = getAuthHeaders();
    const resp = await fetch(`${API_BASE}/consultations/${consultationId}/close`, { method: 'POST', headers, redirect: 'follow' });
    return handleResp(resp);
}

const consultationApi = {
    createConsultation,
    listConsultations,
    getConsultationDetail,
    sendConsultationMessage,
    closeConsultation,
};

export default consultationApi;

