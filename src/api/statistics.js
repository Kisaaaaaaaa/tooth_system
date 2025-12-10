// API wrapper for statistics endpoints
// Each function returns parsed JSON when possible, or raw text otherwise.

const API_BASE = 'http://10.83.132.102:8000/api'; // root; change if backend is mounted under a prefix

function handleResponse(res) {
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    // try parse error message and include status for better debugging
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

