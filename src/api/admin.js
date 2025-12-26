// API wrapper for admin endpoints

// 使用后端 API 地址
const API_BASE = 'http://localhost:8000/api';

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
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    headers.append('Accept', 'application/json');
    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
        console.log('admin.js getAuthHeaders 使用 token:', token.substring(0, 20) + '...');
    } else {
        console.warn('admin.js getAuthHeaders 警告: 未找到 token');
    }
    headers.append('Content-Type', 'application/json');
    return headers;
}

// 医生审核相关API
/**
 * 获取医生审核列表
 * @param {Object} params - 查询参数
 * @param {string} params.status - 审核状态：pending（待审核）、approved（已通过）、rejected（已拒绝）
 * @param {number} params.page - 页码，默认1
 * @param {number} params.page_size - 每页数量，默认9
 * @returns {Promise<Object>} 返回医生审核列表数据
 */
export async function getDoctorAudits(params = {}) {
    const { status = 'pending', page = 1, page_size = 9 } = params;
    
    const myHeaders = new Headers();
    myHeaders.append('Accept', 'application/json');
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (token) {
        myHeaders.append('Authorization', `Bearer ${token}`);
    }
    
    const requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };
    
    const queryParams = new URLSearchParams();
    queryParams.append('status', status);
    queryParams.append('page', page);
    queryParams.append('page_size', page_size);
    
    const url = `${API_BASE}/doctors/audits/?${queryParams.toString()}`;
    console.log('[getDoctorAudits] 请求URL:', url);
    const res = await fetch(url, requestOptions);
    const result = await handleResponse(res);
    console.log('[getDoctorAudits] API响应完整结果:', result);
    
    // 后端返回格式: { code, message, data: { count, page, page_size, results } }
    // 解包数据，返回实际的数据对象
    if (result && result.data) {
        console.log('[getDoctorAudits] 解包后的数据:', result.data);
        return result.data;
    }
    console.log('[getDoctorAudits] 返回原始结果');
    return result;
}

/**
 * 获取待审核医生列表（兼容旧接口）
 */
export async function getPendingDoctors() {
    return getDoctorAudits({ status: 'pending', page: 1, page_size: 100 });
}

/**
 * 获取已通过医生列表（兼容旧接口）
 */
export async function getApprovedDoctors() {
    return getDoctorAudits({ status: 'approved', page: 1, page_size: 100 });
}

/**
 * 批准医生审核
 * @param {number} doctorId - 医生ID
 * @returns {Promise<Object>}
 */
export async function approveDoctor(doctorId) {
    const myHeaders = new Headers();
    myHeaders.append('Accept', 'application/json');
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (token) {
        myHeaders.append('Authorization', `Bearer ${token}`);
    }
    myHeaders.append('Content-Type', 'application/json');
    
    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        redirect: 'follow'
    };
    
    const url = `${API_BASE}/doctors/audits/${doctorId}/approve/`;
    console.log('[approveDoctor] 请求URL:', url);
    const res = await fetch(url, requestOptions);
    const result = await handleResponse(res);
    console.log('[approveDoctor] API响应:', result);
    
    // 后端返回格式: { code, message, data: {...} }，解包数据
    if (result && result.data) {
        console.log('[approveDoctor] 批准成功', result.data);
        return result.data;
    }
    return result;
}

/**
 * 拒绝医生审核
 * @param {number} doctorId - 医生ID
 * @param {string} reason - 拒绝原因
 * @returns {Promise<Object>}
 */
export async function rejectDoctor(doctorId, reason = '') {
    const myHeaders = new Headers();
    myHeaders.append('Accept', 'application/json');
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (token) {
        myHeaders.append('Authorization', `Bearer ${token}`);
    }
    myHeaders.append('Content-Type', 'application/json');
    
    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify({
            reason: reason || '不符合要求'
        }),
        redirect: 'follow'
    };
    
    const url = `${API_BASE}/doctors/audits/${doctorId}/reject/`;
    console.log('[rejectDoctor] 请求URL:', url, '原因:', reason);
    const res = await fetch(url, requestOptions);
    const result = await handleResponse(res);
    console.log('[rejectDoctor] API响应:', result);
    
    // 后端返回格式: { code, message, data: {...} }，解包数据
    if (result && result.data) {
        console.log('[rejectDoctor] 拒绝成功', result.data);
        return result.data;
    }
    return result;
}

/**
 * 设置医生为医院管理员
 * @param {number} doctorId - 医生ID
 * @returns {Promise<Object>}
 */
export async function setDoctorAsAdmin(doctorId) {
    const myHeaders = new Headers();
    myHeaders.append('Accept', 'application/json');
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (token) {
        myHeaders.append('Authorization', `Bearer ${token}`);
    }
    
    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        redirect: 'follow'
    };
    
    const url = `${API_BASE}/doctors/${doctorId}/set-admin/`;
    console.log('[setDoctorAsAdmin] 请求URL:', url);
    const res = await fetch(url, requestOptions);
    const result = await handleResponse(res);
    console.log('[setDoctorAsAdmin] API响应:', result);
    
    // 后端返回格式: { code, message, data: {...} }，解包数据
    if (result && result.data) {
        console.log('[setDoctorAsAdmin] 设置成功', result.data);
        return result.data;
    }
    return result;
}

// 医院管理相关API
/**
 * 获取医院列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码，默认1
 * @param {number} params.page_size - 每页数量，默认10
 * @returns {Promise<Object>}
 */
export async function getHospitals(params = {}) {
    const { page = 1, page_size = 10 } = params;
    
    const myHeaders = new Headers();
    myHeaders.append('Accept', 'application/json');
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (token) {
        myHeaders.append('Authorization', `Bearer ${token}`);
    }
    
    const requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };
    
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('page_size', page_size);
    
    const url = `${API_BASE}/hospitals/?${queryParams.toString()}`;
    console.log('[getHospitals] 请求URL:', url);
    const res = await fetch(url, requestOptions);
    const result = await handleResponse(res);
    console.log('[getHospitals] API响应:', result);
    
    // 后端返回格式: { code, message, data: {...} }，解包数据
    if (result && result.data) {
        console.log('[getHospitals] 获取成功', result.data);
        return result.data;
    }
    return result;
}

/**
 * 添加新医院
 * @param {Object} hospitalData - 医院数据
 * @param {string} hospitalData.name - 医院名称
 * @param {string} hospitalData.address - 医院地址
 * @param {number} hospitalData.latitude - 纬度
 * @param {number} hospitalData.longitude - 经度
 * @param {string} hospitalData.image - 医院图片URL
 * @param {string} hospitalData.description - 医院描述
 * @param {string} hospitalData.business_hours - 营业时间
 * @param {string} hospitalData.phone - 联系电话
 * @returns {Promise<Object>}
 */
export async function addHospital(hospitalData) {
    const myHeaders = new Headers();
    myHeaders.append('Accept', 'application/json');
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (token) {
        myHeaders.append('Authorization', `Bearer ${token}`);
    }
    myHeaders.append('Content-Type', 'application/json');
    
    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify(hospitalData),
        redirect: 'follow'
    };
    
    const url = `${API_BASE}/hospitals/admin/create/`;
    console.log('[addHospital] 请求URL:', url);
    console.log('[addHospital] 医院数据:', hospitalData);
    const res = await fetch(url, requestOptions);
    const result = await handleResponse(res);
    console.log('[addHospital] API响应:', result);
    
    // 后端返回格式: { code, message, data: {...} }，解包数据
    if (result && result.data) {
        console.log('[addHospital] 添加成功', result.data);
        return result.data;
    }
    return result;
}

/**
 * 上传医院图片（本地文件）
 * @param {File} file - 本地选择的图片文件
 * @returns {Promise<{url: string}>} 返回可访问的图片URL
 */
export async function uploadHospitalImage(file) {
    if (!file) throw new Error('未选择文件');

    const myHeaders = new Headers();
    myHeaders.append('Accept', 'application/json');
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (token) {
        myHeaders.append('Authorization', `Bearer ${token}`);
    }
    // 不能显式设置 Content-Type，浏览器会自动设置 multipart/form-data 边界
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', 'hospitals');

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: formData,
        redirect: 'follow'
    };

    const url = `${API_BASE}/upload/file/`;
    console.log('[uploadHospitalImage] 请求URL:', url, '文件名:', file?.name);
    const res = await fetch(url, requestOptions);
    const result = await handleResponse(res);
    console.log('[uploadHospitalImage] API响应:', result);

    // 后端返回格式: { code, message, data: { url, ... } }
    if (result && result.data) {
        return result.data;
    }
    return result;
}

// 医生归属管理API
/**
 * 为医生分配医院
 * @param {number} doctorId - 医生ID
 * @param {number} hospitalId - 医院ID
 * @returns {Promise<Object>}
 */
export async function assignDoctorToHospital(doctorId, hospitalId) {
    const myHeaders = new Headers();
    myHeaders.append('Accept', 'application/json');
    myHeaders.append('Content-Type', 'application/json');
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (token) {
        myHeaders.append('Authorization', `Bearer ${token}`);
    }
    
    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify({ doctor_id: doctorId, hospital_id: hospitalId }),
        redirect: 'follow'
    };
    
    const url = `${API_BASE}/hospitals/admin/assign-doctor/`;
    console.log('[assignDoctorToHospital] 请求URL:', url);
    console.log('[assignDoctorToHospital] 参数:', { doctor_id: doctorId, hospital_id: hospitalId });
    const res = await fetch(url, requestOptions);
    const result = await handleResponse(res);
    console.log('[assignDoctorToHospital] API响应:', result);
    return result;
}

// 用户管理API
// 用户管理API（对齐接口规范）
/**
 * 获取用户列表
 * @param {Object} params
 * @param {string} params.status - 用户状态，如 pending
 * @param {string} params.keyword - 关键词搜索
 * @param {number} params.page - 页码（可选）
 * @param {number} params.page_size - 每页数量（可选）
 * @returns {Promise<{results: Array, count?: number}>}
 */
export async function getUsers(params = {}) {
    const { status, keyword = '', page, page_size, role = 'user' } = params;

    const myHeaders = new Headers();
    myHeaders.append('Accept', 'application/json');
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (token) {
        myHeaders.append('Authorization', `Bearer ${token}`);
    }

    const queryParams = new URLSearchParams();
    // 只有当 status 有值（非空字符串）时才添加
    if (status && status.trim()) queryParams.append('status', status);
    if (role) queryParams.append('role', role);
    // keyword 总是添加（后端根据空值判断是否搜索）
    queryParams.append('keyword', keyword);
    if (page) queryParams.append('page', String(page));
    if (page_size) queryParams.append('page_size', String(page_size));

    const requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    const url = `${API_BASE}/auth/admin/users/?${queryParams.toString()}`;
    console.log('[getUsers] 请求URL:', url);
    console.log('[getUsers] 参数:', { status, keyword, role, page, page_size });
    const res = await fetch(url, requestOptions);
    const result = await handleResponse(res);
    console.log('[getUsers] API响应:', result);

    // 统一返回结构
    if (result && result.data && Array.isArray(result.data.results)) {
        return result.data; // { results, count, ... }
    }
    if (result && Array.isArray(result.results)) {
        return result; // { results, count, ... }
    }
    if (Array.isArray(result)) {
        return { results: result, count: result.length };
    }
    return result;
}

/**
 * 手动拉黑用户
 */
export async function blacklistUser(userId) {
    const myHeaders = new Headers();
    myHeaders.append('Accept', 'application/json');
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (token) {
        myHeaders.append('Authorization', `Bearer ${token}`);
    }

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        redirect: 'follow'
    };
    const url = `${API_BASE}/auth/admin/users/${userId}/blacklist/`;
    console.log('[blacklistUser] 请求URL:', url);
    const res = await fetch(url, requestOptions);
    return handleResponse(res);
}

/**
 * 解除拉黑用户
 */
export async function unblacklistUser(userId) {
    const myHeaders = new Headers();
    myHeaders.append('Accept', 'application/json');
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (token) {
        myHeaders.append('Authorization', `Bearer ${token}`);
    }

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        redirect: 'follow'
    };
    const url = `${API_BASE}/auth/admin/users/${userId}/unblacklist/`;
    console.log('[unblacklistUser] 请求URL:', url);
    const res = await fetch(url, requestOptions);
    return handleResponse(res);
}

/**
 * 批量拉黑未按时签到超过阈值的用户
 * @param {number} threshold - 未按时签到次数阈值，默认5
 */
export async function autoBlacklistUsers(threshold = 5) {
    const myHeaders = new Headers();
    myHeaders.append('Accept', 'application/json');
    myHeaders.append('Content-Type', 'application/json');
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (token) {
        myHeaders.append('Authorization', `Bearer ${token}`);
    }

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify({ threshold }),
        redirect: 'follow'
    };
    
    const url = `${API_BASE}/auth/admin/users/blacklist-by-noshow/`;
    console.log('[autoBlacklistUsers] 请求URL:', url, '阈值:', threshold);
    const res = await fetch(url, requestOptions);
    return handleResponse(res);
}

export default {
    getDoctorAudits,
    getPendingDoctors,
    getApprovedDoctors,
    approveDoctor,
    rejectDoctor,
    setDoctorAsAdmin,
    getHospitals,
    addHospital,
    uploadHospitalImage,
    assignDoctorToHospital,
    getUsers,
    blacklistUser,
    unblacklistUser,
    autoBlacklistUsers
};
