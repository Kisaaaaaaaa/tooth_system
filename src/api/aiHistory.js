import { buildQuery } from './utils';

const API_ROOT = 'http://10.83.132.102:8000/api';

function getAuthHeaders() {
    const h = new Headers();
    const token = localStorage.getItem('authToken');
    if (token) h.append('Authorization', `Bearer ${token}`);
    return h;
}

async function handleResp(resp) {
    const ct = resp.headers.get('content-type') || '';
    let body;
    if (ct.includes('application/json')) {
        body = await resp.json();
    } else {
        body = await resp.text();
    }
    if (!resp.ok) {
        // 尝试解析错误信息，提取用户友好的提示
        let errorMessage = '';
        
        if (body.message) {
            try {
                const messageStr = body.message;
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
                errorMessage = body.message;
            }
        }
        
        // 如果没有提取到错误信息，使用默认的错误提示
        if (!errorMessage) {
            errorMessage = `${resp.status} ${resp.statusText}`;
        }
        
        const err = new Error(errorMessage);
        err.status = resp.status;
        err.body = body;
        throw err;
    }
    return body;
}

/**
 * 保存AI咨询历史记录
 * @param {Object} historyItem - 历史记录项
 * @param {string} historyItem.question - 用户提问
 * @param {string} historyItem.answer - AI回答
 * @param {Array} [historyItem.files] - 上传的文件列表
 * @param {string} [historyItem.context] - 上下文信息
 * @returns {Promise<Object>} 保存的历史记录
 */
export async function saveHistoryItem(historyItem) {
    const headers = getAuthHeaders();
    headers.append('Content-Type', 'application/json');
    
    const body = JSON.stringify(historyItem);
    const resp = await fetch(API_ROOT + '/ai/history', {
        method: 'POST',
        headers,
        body,
        redirect: 'follow'
    });
    
    return handleResp(resp);
}

/**
 * 获取AI咨询历史记录列表
 * @param {Object} [params] - 查询参数
 * @param {number} [params.page] - 页码
 * @param {number} [params.pageSize] - 每页条数
 * @returns {Promise<Array>} 历史记录列表
 */
export async function getHistoryList(params = {}) {
    const qs = buildQuery(params);
    const url = `/ai/history${qs}`;
    const headers = getAuthHeaders();
    
    const resp = await fetch(API_ROOT + url, {
        method: 'GET',
        headers,
        redirect: 'follow'
    });
    
    return handleResp(resp);
}

/**
 * 删除指定的AI咨询历史记录
 * @param {number} id - 历史记录ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteHistoryItem(id) {
    const headers = getAuthHeaders();
    const resp = await fetch(API_ROOT + `/ai/history/${id}`, {
        method: 'DELETE',
        headers,
        redirect: 'follow'
    });
    
    return handleResp(resp);
}

/**
 * 清空用户的所有AI咨询历史记录
 * @returns {Promise<Object>} 清空结果
 */
export async function clearHistoryList() {
    const headers = getAuthHeaders();
    const resp = await fetch(API_ROOT + '/ai/history', {
        method: 'DELETE',
        headers,
        redirect: 'follow'
    });
    
    return handleResp(resp);
}

const aiHistoryApi = {
    saveHistoryItem,
    getHistoryList,
    deleteHistoryItem,
    clearHistoryList
};

export default aiHistoryApi;