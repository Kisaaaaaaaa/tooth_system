// API wrapper for admin endpoints

const API_BASE = 'http://10.83.132.102:8000/api';

function handleResponse(res) {
    const ct = res.headers.get('content-type') || '';
    if (!res.ok) {
        if (ct.includes('application/json')) {
            return res.json().then(j => {
                // 尝试解析错误信息，提取用户友好的提示
                let errorMessage = '';
                
                if (j.message) {
                    try {
                        const messageStr = j.message;
                        const errors = [];
                        
                        // 直接使用正则表达式提取所有中文错误信息
                        const errorMatches = messageStr.match(/'([^']*[\u4e00-\u9fa5]+[^']*)'/g);
                        
                        if (errorMatches) {
                            // 移除引号并将所有错误信息合并
                            errorMatches.forEach(match => {
                                errors.push(match.replace(/'/g, ''));
                            });
                            errorMessage = errors.join('；');
                        } else {
                            // 如果没有找到中文错误，使用原始错误信息
                            errorMessage = messageStr;
                        }
                    } catch (e) {
                        // 如果解析失败，使用原始message
                        errorMessage = j.message;
                    }
                } else if (typeof j === 'string') {
                    errorMessage = j;
                }
                
                // 如果没有提取到错误信息，使用默认的错误提示
                if (!errorMessage) {
                    errorMessage = `${res.status} ${res.statusText}`;
                }
                
                throw new Error(errorMessage);
            });
        }
        return res.text().then(t => { throw new Error(t || `${res.status} ${res.statusText}`); });
    }
    if (ct.includes('application/json')) return res.json();
    return res.text();
}

function getAuthHeaders() {
    const headers = new Headers();
    const token = localStorage.getItem('authToken');
    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }
    headers.append('Content-Type', 'application/json');
    return headers;
}

// 医生审核相关API
export async function getPendingDoctors() {
    const requestOptions = {
        method: 'GET',
        headers: getAuthHeaders(),
        redirect: 'follow'
    };
    const res = await fetch(`${API_BASE}/admin/doctors/pending`, requestOptions);
    return handleResponse(res);
}

export async function approveDoctor(doctorId) {
    const requestOptions = {
        method: 'PUT',
        headers: getAuthHeaders(),
        redirect: 'follow'
    };
    const res = await fetch(`${API_BASE}/admin/doctors/${doctorId}/approve`, requestOptions);
    return handleResponse(res);
}

export async function rejectDoctor(doctorId) {
    const requestOptions = {
        method: 'PUT',
        headers: getAuthHeaders(),
        redirect: 'follow'
    };
    const res = await fetch(`${API_BASE}/admin/doctors/${doctorId}/reject`, requestOptions);
    return handleResponse(res);
}

export async function getApprovedDoctors() {
    const requestOptions = {
        method: 'GET',
        headers: getAuthHeaders(),
        redirect: 'follow'
    };
    const res = await fetch(`${API_BASE}/admin/doctors/approved`, requestOptions);
    return handleResponse(res);
}

// 医院管理相关API
export async function getHospitals() {
    const requestOptions = {
        method: 'GET',
        headers: getAuthHeaders(),
        redirect: 'follow'
    };
    const res = await fetch(`${API_BASE}/admin/hospitals`, requestOptions);
    return handleResponse(res);
}

export async function addHospital(hospitalData) {
    const requestOptions = {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(hospitalData),
        redirect: 'follow'
    };
    const res = await fetch(`${API_BASE}/admin/hospitals`, requestOptions);
    return handleResponse(res);
}

// 医生归属管理API
export async function assignDoctorToHospital(doctorId, hospitalId) {
    const requestOptions = {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ hospitalId }),
        redirect: 'follow'
    };
    const res = await fetch(`${API_BASE}/admin/doctors/${doctorId}/hospital`, requestOptions);
    return handleResponse(res);
}

// 用户管理API
export async function getUsers() {
    const requestOptions = {
        method: 'GET',
        headers: getAuthHeaders(),
        redirect: 'follow'
    };
    const res = await fetch(`${API_BASE}/admin/users`, requestOptions);
    return handleResponse(res);
}

export async function toggleUserBlacklist(userId, isBlacklisted) {
    const requestOptions = {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ blacklisted: isBlacklisted }),
        redirect: 'follow'
    };
    const res = await fetch(`${API_BASE}/admin/users/${userId}/blacklist`, requestOptions);
    return handleResponse(res);
}

export async function autoBlacklistUsers() {
    const requestOptions = {
        method: 'POST',
        headers: getAuthHeaders(),
        redirect: 'follow'
    };
    const res = await fetch(`${API_BASE}/admin/users/auto-blacklist`, requestOptions);
    return handleResponse(res);
}

export default {
    getPendingDoctors,
    approveDoctor,
    rejectDoctor,
    getApprovedDoctors,
    getHospitals,
    addHospital,
    assignDoctorToHospital,
    getUsers,
    toggleUserBlacklist,
    autoBlacklistUsers
};
