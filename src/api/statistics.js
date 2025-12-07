// API wrapper for statistics endpoints
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
 * 获取首页统计数据
 * @returns {Promise<Object>} 返回统计数据对象
 * {
 *   code: 200,
 *   message: "success",
 *   data: {
 *     cooperation_clinics: 2000,
 *     appointment_efficiency: 98,
 *     revenue_growth: 45,
 *     patient_satisfaction: 95,
 *     today_patients: 128,
 *     online_doctors: 12
 *   }
 * }
 */
export async function getHomeStatistics() {
    const requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };
    const res = await fetch(`${API_BASE}/statistics/home`, requestOptions);
    return handleResponse(res);
}

export default {
    getHomeStatistics,
};

