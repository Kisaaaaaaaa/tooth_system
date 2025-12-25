import { buildQuery } from './utils';

// 使用后端 API 地址
const API_ROOT = import.meta?.env?.VITE_API_BASE || 'http://localhost:8000/api';

function getAuthHeaders() {
    const h = new Headers();
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (token) {
        h.append('Authorization', `Bearer ${token}`);
        console.log('aiHistory.js getAuthHeaders 使用 token:', token.substring(0, 20) + '...');
    } else {
        console.warn('aiHistory.js getAuthHeaders 警告: 未找到 token');
    }
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
    const normalized = {
        ...(params || {}),
    };
    // 兼容旧参数名 pageSize
    if (normalized.pageSize !== undefined && normalized.page_size === undefined) {
        normalized.page_size = normalized.pageSize;
        delete normalized.pageSize;
    }
    const qs = buildQuery(normalized);
    const url = `/ai/history/${qs}`;
    const headers = getAuthHeaders();

    const resp = await fetch(API_ROOT + url, {
        method: 'GET',
        headers,
        redirect: 'follow'
    });

    const body = await handleResp(resp);
    // 标准后端结构：{ code, message, data: { results, ... } }
    if (body && typeof body === 'object' && body.data) return body.data;
    return body;
}

/**
 * 将后端 /ai/history/ 的「逐条消息」results，按时间窗口分组为“会话”。
 * 说明：当前接口没有 session_id 字段时，使用启发式分组：相邻两条消息间隔 > gapMinutes 视为新会话。
 * @param {Array<{id:number, role:string, content:string, created_at:string}>} results
 * @param {{gapMinutes?:number}} opts
 * @returns {Array<{id:string, ts:number, preview:string, messages:Array<{role:string,text:string}>, raw:Array}>}
 */
export function groupHistoryMessages(results = [], opts = {}) {
    const gapMinutes = Number(opts.gapMinutes ?? 20);
    const gapMs = gapMinutes * 60 * 1000;

    const items = Array.isArray(results) ? results.slice() : [];
    // 保险：按 created_at 升序，确保分组稳定
    items.sort((a, b) => {
        const ta = Date.parse(a?.created_at || '') || 0;
        const tb = Date.parse(b?.created_at || '') || 0;
        return ta - tb;
    });

    const sessions = [];
    let cur = null;

    for (const it of items) {
        const ts = Date.parse(it?.created_at || '') || 0;
        if (!cur) {
            cur = { raw: [], firstTs: ts, lastTs: ts };
        } else if (ts && cur.lastTs && ts - cur.lastTs > gapMs) {
            sessions.push(cur);
            cur = { raw: [], firstTs: ts, lastTs: ts };
        }
        cur.raw.push(it);
        if (ts) {
            cur.lastTs = ts;
            if (!cur.firstTs) cur.firstTs = ts;
        }
    }
    if (cur) sessions.push(cur);

    // 转换为前端 HistorySidebar 期望结构（preview/messages/ts）
    const mapped = sessions.map((s, idx) => {
        const raw = s.raw || [];
        const messages = raw.map((m) => ({
            role: m?.role === 'assistant' ? 'assistant' : 'user',
            text: m?.content ?? '',
        }));
        const firstUser = raw.find((m) => m?.role === 'user');
        const preview = (firstUser?.content || raw[0]?.content || '(无内容)').slice(0, 60);
        const idPart = raw[0]?.id ?? idx;
        const ts = s.lastTs || s.firstTs || Date.now();
        return {
            id: `history-${idPart}-${ts}`,
            ts,
            preview,
            messages,
            raw,
            // 便于搜索结果定位：默认取该会话第一条消息 id
            messageId: raw[0]?.id,
        };
    });

    // 侧边栏一般展示“最近在上面”
    mapped.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    return mapped;
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

/**
 * 搜索聊天记录
 * GET /ai/search/?keyword=...&page=...&page_size=...
 * @param {{keyword: string, page?: number, page_size?: number, pageSize?: number}} params
 * @returns {Promise<{keyword:string,count:number,page:number,page_size:number,results:Array,has_more:boolean,total_pages:number}>}
 */
export async function searchHistory(params = {}) {
    const keyword = (params?.keyword ?? '').toString().trim();
    if (!keyword) {
        const err = new Error('keyword 不能为空');
        err.status = 400;
        throw err;
    }

    const normalized = {
        ...(params || {}),
        keyword,
    };
    if (normalized.pageSize !== undefined && normalized.page_size === undefined) {
        normalized.page_size = normalized.pageSize;
        delete normalized.pageSize;
    }

    const qs = buildQuery(normalized);
    const url = `/ai/search/${qs}`;
    const headers = getAuthHeaders();
    headers.append('Accept', 'application/json');

    const resp = await fetch(API_ROOT + url, {
        method: 'GET',
        headers,
        redirect: 'follow'
    });

    const body = await handleResp(resp);
    if (body && typeof body === 'object' && body.data) return body.data;
    return body;
}

/**
 * 搜索结果定位：获取某条消息在全量对话中的位置与上下文
 * GET /ai/message/<message_id>/location/
 * @param {number|string} messageId
 * @returns {Promise<{message_id:number,position:number,total_messages:number,page:number,page_size:number,context:Array, message:Object}>}
 */
export async function getMessageLocation(messageId) {
    const id = Number(messageId);
    if (!Number.isFinite(id) || id <= 0) {
        const err = new Error('message_id 不合法');
        err.status = 400;
        throw err;
    }

    const headers = getAuthHeaders();
    headers.append('Accept', 'application/json');

    const resp = await fetch(API_ROOT + `/ai/message/${id}/location/`, {
        method: 'GET',
        headers,
        redirect: 'follow'
    });

    const body = await handleResp(resp);
    if (body && typeof body === 'object' && body.data) return body.data;
    return body;
}

const aiHistoryApi = {
    saveHistoryItem,
    getHistoryList,
    groupHistoryMessages,
    deleteHistoryItem,
    clearHistoryList,
    searchHistory,
    getMessageLocation
};

export default aiHistoryApi;