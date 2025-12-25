// 通用上传接口封装
// - POST /upload/file/
// - multipart/form-data: file + purpose

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:8000/api';

function getToken() {
    return localStorage.getItem('access_token') || localStorage.getItem('authToken');
}

async function handleResponse(res) {
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const body = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => '');

    if (!res.ok) {
        const msg = (body && (body.message || body.detail)) || `上传失败: ${res.status}`;
        const err = new Error(msg);
        err.status = res.status;
        err.body = body;
        throw err;
    }

    // 兼容后端 {code,message,data} 或直接 {url,...}
    if (body && typeof body === 'object' && 'code' in body) {
        if (body.code !== 200) {
            const err = new Error(body.message || '上传失败');
            err.status = 200;
            err.body = body;
            throw err;
        }
        return body.data ?? body;
    }

    return body;
}

/**
 * 上传文件（通用：图片/PDF/文档等）
 * @param {File} file
 * @param {{purpose?: 'hospitals'|'doctors'|'users'|'records'|'others'|'avatars'}} opts
 * @returns {Promise<{url:string, filename?:string, ext?:string, size?:number, purpose?:string}>}
 */
export async function uploadFile(file, opts = {}) {
    if (!file) throw new Error('未选择文件');

    const token = getToken();
    if (!token) throw new Error('未登录，无法上传文件');

    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Authorization', `Bearer ${token}`);

    const formData = new FormData();
    formData.append('file', file);
    if (opts?.purpose) formData.append('purpose', String(opts.purpose));

    const res = await fetch(`${API_BASE}/upload/file/`, {
        method: 'POST',
        headers,
        body: formData,
    });

    return handleResponse(res);
}

export default {
    uploadFile,
};
