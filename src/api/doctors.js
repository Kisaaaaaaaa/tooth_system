// API wrapper for doctors endpoints
// Each function returns parsed JSON when possible, or raw text otherwise.

// 使用后端API服务器地址
const API_BASE = 'http://localhost:8000/api';

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
 * 获取医生列表
 * @param {Object} params - 请求参数
 * @param {string} params.view - 视图类型，可选值： list（列表）、rank（排行榜），默认 list
 * @param {number} params.hospital_id - 所属医院ID，用于筛选特定医院的医生
 * @param {string} params.specialty - 专科，用于筛选特定专科的医生
 * @param {number} params.page - 页码，默认 1
 * @param {number} params.page_size - 每页数量，默认 10
 * @returns {Promise<Object>} 返回医生列表数据
 */
export async function getDoctors(params = {}) {
  const {
    view = 'list',
    hospital_id,
    specialty,
    page = 1,
    page_size = 10
  } = params;

  // 构建查询参数
  const queryParams = new URLSearchParams();
  queryParams.append('view', view);
  queryParams.append('page', page);
  queryParams.append('page_size', page_size);

  if (hospital_id) queryParams.append('hospital_id', hospital_id);
  if (specialty) queryParams.append('specialty', specialty);

  const requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };

  const res = await fetch(`${API_BASE}/doctors/?${queryParams.toString()}`, requestOptions);
  return handleResponse(res);
}

/**
 * 获取医生详情
 * @param {number} doctor_id - 医生ID
 * @returns {Promise<Object>} 返回医生详情数据
 */
export async function getDoctorDetail(doctor_id) {
  const requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };

  const res = await fetch(`${API_BASE}/doctors/${doctor_id}/`, requestOptions);
  return handleResponse(res);
}

export default {
  getDoctors,
  getDoctorDetail
};
