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

export async function inquiry({ question, context = {} }) {
    return inquiryWithFiles({ question, context, files: undefined });
}

export async function inquiryWithFiles({ question, context = {}, files } = {}) {
    const tokenHeaders = getAuthHeaders();
    // If files provided, use FormData
    if (files && files.length) {
        const form = new FormData();
        form.append('question', question || '请分析上传的病例');
        form.append('context', JSON.stringify(context || {}));
        // append each file; backend should accept 'files' as array
        Array.from(files).forEach((f) => form.append('files', f));

        const headers = tokenHeaders; // do NOT set Content-Type, browser will set boundary
        const resp = await fetch(API_ROOT + '/ai/inquiry', { method: 'POST', headers, body: form, redirect: 'follow' });
        return handleResp(resp);
    }

    // no files: JSON body
    const headers = tokenHeaders;
    headers.append('Content-Type', 'application/json');
    const body = JSON.stringify({ question, context });
    const resp = await fetch(API_ROOT + '/ai/inquiry', { method: 'POST', headers, body, redirect: 'follow' });
    return handleResp(resp);
}

const ai = { inquiry, inquiryWithFiles };
export default ai;
