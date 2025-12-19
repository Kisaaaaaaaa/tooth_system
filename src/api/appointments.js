// API wrapper for appointments endpoints
const API_BASE = 'http://localhost:8000/api';

function handleResponse(res) {
    const ct = res.headers.get('content-type') || '';
    if (!res.ok) {
        if (ct.includes('application/json')) {
            return res.json().then(j => {
                // 透出 http 状态码，便于前端区分 401/409 等
                if (j && typeof j === 'object' && !('status' in j)) {
                    j.status = res.status;
                }
                throw j;
            });
        }
        return res.text().then(t => {
            const e = new Error(t || res.statusText);
            e.status = res.status;
            throw e;
        });
    }
    if (ct.includes('application/json')) {
        return res.json().then(j => {
            // 后端业务错误也会返回 HTTP 200，但 body 里 code!=200
            if (j && typeof j === 'object' && 'code' in j && Number(j.code) !== 200) {
                // 透出 http status 便于调试
                if (!('status' in j)) j.status = res.status;
                throw j;
            }
            return j;
        });
    }
    return res.text();
}

function getAuthHeader() {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
}

//创建预约
export async function createAppointment(payload) {
    const bodyPayload = { ...payload };
    if (bodyPayload.doctor == null && bodyPayload.doctor_id != null) bodyPayload.doctor = bodyPayload.doctor_id;
    if (bodyPayload.hospital == null && bodyPayload.hospital_id != null) bodyPayload.hospital = bodyPayload.hospital_id;

    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...getAuthHeader()
    };

    const res = await fetch(`${API_BASE}/appointments/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
        redirect: 'follow'
    });

    return handleResponse(res);
}

export async function getAppointments({ status, page = 1, page_size = 10 } = {}) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (page) params.append('page', page);
    if (page_size) params.append('page_size', page_size);

    const headers = {
        'Accept': 'application/json',
        ...getAuthHeader()
    };

    const res = await fetch(`${API_BASE}/appointments/?${params.toString()}`, {
        method: 'GET',
        headers,
        redirect: 'follow'
    });

    return handleResponse(res);
}

// 取消预约
export async function cancelAppointment(appointmentId, reason) {
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...getAuthHeader()
    };
    const body = reason ? JSON.stringify({ reason }) : null;
    const res = await fetch(`${API_BASE}/appointments/${appointmentId}/cancel/`, {
        method: 'POST',
        headers,
        body,
        redirect: 'follow'
    });
    return handleResponse(res);
}

// 预约签到
export async function checkinAppointment(appointmentId, latitude, longitude) {
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...getAuthHeader()
    };
    const body = (latitude !== undefined && longitude !== undefined)
        ? JSON.stringify({ latitude, longitude })
        : null;
    const res = await fetch(`${API_BASE}/appointments/${appointmentId}/checkin/`, {
        method: 'POST',
        headers,
        body,
        redirect: 'follow'
    });
    return handleResponse(res);
}
export default { createAppointment, getAppointments, cancelAppointment, checkinAppointment };