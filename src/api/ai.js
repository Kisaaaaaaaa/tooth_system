const API_ROOT = '';

function getAuthHeaders() {
    const h = new Headers();
    const token = localStorage.getItem('authToken');
    if (token) h.append('Authorization', `Bearer ${token}`);
    return h;
}

async function handleResp(resp) {
    const text = await resp.text();
    let body = text;
    try { body = JSON.parse(text); } catch (e) { /* keep raw text */ }
    if (!resp.ok) {
        const err = new Error('HTTP error');
        err.status = resp.status;
        err.body = body;
        throw err;
    }
    return body;
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
