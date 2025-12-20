// API wrapper for hospitals endpoints
// Each function returns parsed JSON when possible, or raw text otherwise.

// 使用后端 API 地址（允许通过 Vite 环境变量覆盖）
const API_BASE = (() => {
    try {
        return import.meta?.env?.VITE_API_BASE || 'http://localhost:8000/api';
    } catch {
        return 'http://localhost:8000/api';
    }
})();

function authHeader() {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function handleResponse(res) {
    const ct = res.headers.get('content-type') || '';
    if (!res.ok) {
        // try parse error message and include status for better debugging
        if (ct.includes('application/json')) {
            return res.json().then(j => {
                const body = typeof j === 'string' ? j : JSON.stringify(j);
                throw new Error(`${res.status} ${res.statusText}: ${body}`);
            });
        }
        return res.text().then(t => { throw new Error(`${res.status} ${res.statusText}: ${t || ''}`); });
    }
    if (ct.includes('application/json')) return res.json();
    return res.text();
}

/**
 * 获取医院列表
 * @param {Object} params - 请求参数
 * @param {string} params.filter - 筛选类型，可选值： all（全部）、near（距离最近）、frequent（大家常去），默认 all
 * @param {number} params.page - 页码，默认 1
 * @param {number} params.page_size - 每页数量，默认 10
 * @param {number} params.latitude - 纬度（用于计算距离，可选）
 * @param {number} params.longitude - 经度（用于计算距离，可选）
 * @returns {Promise<Object>} 返回医院列表数据
 */
export async function getHospitals(params = {}) {
    const {
        filter = 'all',
        page = 1,
        page_size = 10,
        latitude,
        longitude
    } = params;

    // 构建查询参数
    const queryParams = new URLSearchParams();
    queryParams.append('filter', filter);
    queryParams.append('page', page);
    queryParams.append('page_size', page_size);

    if (latitude != null) queryParams.append('latitude', latitude);
    if (longitude != null) queryParams.append('longitude', longitude);

    const requestOptions = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
        redirect: 'follow'
    };

    const res = await fetch(`${API_BASE}/hospitals/?${queryParams.toString()}`, requestOptions);
    return handleResponse(res);
}

/**
 * 获取医院详情
 * @param {number} hospital_id - 医院ID
 * @returns {Promise<Object>} 返回医院详情数据
 */
export async function getHospitalDetail(hospital_id) {
    const headers = {
        'Accept': 'application/json',
        ...authHeader(),
    };

    const requestOptions = {
        method: 'GET',
        headers,
        redirect: 'follow'
    };

    // Django REST Framework 常见结尾带 /，避免 301 跳转丢 header 或直接 404
    const res = await fetch(`${API_BASE}/hospitals/${hospital_id}/`, requestOptions);
    return handleResponse(res);
}

/**
 * 路线规划：向后端提交当前位置，请求返回路线/导航所需信息
 * POST /hospitals/{id}/route/
 * @param {number|string} hospital_id - 医院ID（Path 参数）
 * @param {{latitude?: number, longitude?: number}} body - 当前位置（可选：不传则后端可自行兜底或按默认处理）
 */
export async function postHospitalRoute(hospital_id, body = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...authHeader()
    };

    const requestOptions = {
        method: 'POST',
        headers,
        body: JSON.stringify({
            latitude: body.latitude,
            longitude: body.longitude
        }),
        redirect: 'follow'
    };

    const res = await fetch(`${API_BASE}/hospitals/${hospital_id}/route/`, requestOptions);
    return handleResponse(res);
}

export default {
    getHospitals,
    getHospitalDetail,
    postHospitalRoute
};