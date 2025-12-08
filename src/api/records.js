import { buildQuery } from './utils';

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
