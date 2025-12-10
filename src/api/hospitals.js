// API wrapper for hospitals endpoints
// Each function returns parsed JSON when possible, or raw text otherwise.

const API_BASE = ''; // root; change if backend is mounted under a prefix

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
 * @param {string} params.filter - 筛选类型，可选值： all（全部）、near（距离最近）、frequent（我常去的），默认 all
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
    
    if (latitude) queryParams.append('latitude', latitude);
    if (longitude) queryParams.append('longitude', longitude);

    const requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    const res = await fetch(`${API_BASE}/api/hospitals?${queryParams.toString()}`, requestOptions);
    return handleResponse(res);
}

/**
 * 获取医院详情
 * @param {number} hospital_id - 医院ID
 * @returns {Promise<Object>} 返回医院详情数据
 */
export async function getHospitalDetail(hospital_id) {
    const requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    const res = await fetch(`${API_BASE}/api/hospitals/${hospital_id}`, requestOptions);
    return handleResponse(res);
}

export default {
    getHospitals,
    getHospitalDetail
};