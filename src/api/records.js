import { buildQuery } from './utils';

const API_ROOT = 'http://10.83.132.102:8000/api';

function getAuthHeaders() {
    const h = new Headers();
    const token = localStorage.getItem('authToken');
    if (token) h.append('Authorization', `Bearer ${token}`);
    return h;
}

function handleResp(resp) {
    const ct = resp.headers.get('content-type') || '';
    if (!resp.ok) {
        if (ct.includes('application/json')) {
            return resp.json().then(j => {
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
                }
                
                // 如果没有提取到错误信息，使用默认的错误提示
                if (!errorMessage) {
                    errorMessage = `${resp.status} ${resp.statusText}`;
                }
                
                const error = new Error(errorMessage);
                error.status = resp.status;
                error.body = j;
                throw error;
            });
        }
        return resp.text().then(t => {
            const error = new Error(t || `${resp.status} ${resp.statusText}`);
            error.status = resp.status;
            throw error;
        });
    }
    if (ct.includes('application/json')) return resp.json();
    return resp.text();
}

export async function listRecords(params = {}) {
    const qs = buildQuery(params);
    const url = `/records${qs}`;
    const headers = getAuthHeaders();
    const opts = { method: 'GET', headers, redirect: 'follow' };
    const resp = await fetch(API_ROOT + url, opts);
    return handleResp(resp);
}

export async function getRecord(id) {
    const headers = getAuthHeaders();
    const resp = await fetch(API_ROOT + `/records/${id}`, { method: 'GET', headers, redirect: 'follow' });
    return handleResp(resp);
}

export async function rateRecord(id, { rating, comment }) {
    const headers = getAuthHeaders();
    headers.append('Content-Type', 'application/json');
    const body = JSON.stringify({ rating, comment });
    const resp = await fetch(API_ROOT + `/records/${id}/rating`, { method: 'POST', headers, body, redirect: 'follow' });
    return handleResp(resp);
}

const recordsApi = { listRecords, getRecord, rateRecord };
export default recordsApi;
