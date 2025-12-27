export function buildQuery(params = {}) {
  const keys = Object.keys(params).filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '');
  if (!keys.length) return '';
  const qs = keys.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  return qs ? `?${qs}` : '';
}

export function resolveMediaUrl(url) {
  if (!url) return url;
  try {
    // 如果已经是完整的 http/https URL，直接返回，避免错误重写主机名
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    let apiBase;
    try {
      apiBase = import.meta?.env?.VITE_API_BASE;
    } catch (e) {
      apiBase = undefined;
    }
    const fallbackOrigin = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : '';
    const apiOrigin = (() => {
      try { return apiBase ? new URL(apiBase).origin : fallbackOrigin; } catch { return fallbackOrigin; }
    })();

    // 相对路径 /media 或 /static
    if (url.startsWith('/media') || url.startsWith('/static')) {
      return `${apiOrigin}${url}`;
    }

    const u = new URL(url, apiOrigin);
    const needRewrite = (u.hostname === '127.0.0.1' || u.hostname === 'localhost');
    if (needRewrite) {
      const target = new URL(apiOrigin);
      u.protocol = target.protocol;
      u.host = target.host;
      return u.toString();
    }
    return u.toString();
  } catch {
    return url;
  }
}

// 上传图片
export async function uploadImage(formData) {
  // 统一 API 根路径：与其他 api 模块保持一致，末尾自带 /api
  let API_ROOT;
  try {
    API_ROOT = import.meta?.env?.VITE_API_BASE || 'http://localhost:8000/api';
  } catch (e) {
    API_ROOT = 'http://localhost:8000/api';
  }

  const token = localStorage.getItem('authToken') || localStorage.getItem('access_token');
  
  // 创建 Headers 对象（按照指定格式）
  const myHeaders = new Headers();
  myHeaders.append("Accept", "application/json");
  if (token) {
    myHeaders.append("Authorization", `Bearer ${token}`);
  }

  // 正确的后端路径是 /api/upload/image/
  const uploadUrl = `${API_ROOT}/upload/image/`;
  console.log('上传URL:', uploadUrl);
  console.log('Token:', token ? '存在' : '不存在');

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: myHeaders,
    body: formData,
  });

  console.log('响应状态:', response.status, response.statusText);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('上传失败，错误响应:', error);
    throw new Error(error.message || error.detail || `上传失败: ${response.status}`);
  }

  const result = await response.json();
  console.log('上传成功，完整响应:', result);
  
  // 处理后端返回的格式 { code, message, data: { url } }
  if (result.code && result.code !== 200) {
    console.error('业务错误，code:', result.code, 'message:', result.message);
    throw new Error(result.message || '上传失败');
  }

  // 统一返回 { url } 结构，保持与用户端一致
  const data = result.data || result;

  // 尝试从多种结构里提取 url
  const pickUrl = (item) => item?.url || item?.path || item?.image || item?.file || (typeof item === 'string' ? item : null);

  let rawUrl = pickUrl(data);

  // 如果返回数组，取第一项的 url
  if (!rawUrl && Array.isArray(data) && data.length) {
    rawUrl = pickUrl(data[0]);
  }

  // 如果 message 字符串里包含 http 链接，也尝试提取
  if (!rawUrl && typeof result.message === 'string') {
    const match = result.message.match(/https?:[^'"\s]+/i);
    rawUrl = match ? match[0] : null;
  }

  if (!rawUrl) {
    console.error('上传返回未找到 url 字段，data:', data);
    throw new Error('上传返回格式错误，缺少 url');
  }

  // 规范为完整可访问的 URL，保持与用户端一致
  const normalizedUrl = resolveMediaUrl(rawUrl);
  return { url: normalizedUrl };
}

export default { buildQuery, resolveMediaUrl, uploadImage };

// 检查用户是否有管理员权限（包括 is_admin 为 true 的医生）
export function hasAdminAccess() {
  if (typeof localStorage === 'undefined') {
    return false;
  }
  
  try {
    const role = localStorage.getItem('role');
    const isAdminStr = localStorage.getItem('is_admin');
    
    // 如果 role 是 admin，直接返回 true
    if (role === 'admin') {
      return true;
    }
    
    // 如果 is_admin 标记为 'true'，也返回 true
    if (isAdminStr === 'true') {
      return true;
    }
    
    // 检查 user 对象中的 is_admin 字段
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.is_admin === true || user?.is_admin === 'true') {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('检查管理员权限时出错:', error);
    return false;
  }
}

// 获取当前用户的管理员状态
export function getAdminStatus() {
  if (typeof localStorage === 'undefined') {
    return { isAdmin: false, role: null };
  }
  
  try {
    const role = localStorage.getItem('role');
    const isAdminStr = localStorage.getItem('is_admin');
    const userStr = localStorage.getItem('user');
    
    let isAdmin = false;
    if (role === 'admin' || isAdminStr === 'true') {
      isAdmin = true;
    } else if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.is_admin === true || user?.is_admin === 'true') {
        isAdmin = true;
      }
    }
    
    return { isAdmin, role, isAdminDoctor: isAdminStr === 'true' || (userStr && JSON.parse(userStr)?.is_admin) };
  } catch (error) {
    console.error('获取管理员状态时出错:', error);
    return { isAdmin: false, role: null, isAdminDoctor: false };
  }
}
