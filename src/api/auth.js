// API wrapper for auth endpoints based on provided fetch examples.
// Each function returns parsed JSON when possible, or raw text otherwise.

const API_BASE = 'http://10.83.132.102:8000/api'; // root with /api prefix; change if backend is mounted under a different prefix

function handleResponse(res) {
  const ct = res.headers.get('content-type') || '';
  console.log('API响应状态:', res.status);
  console.log('API响应内容类型:', ct);
  
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
  
  // 处理成功响应
  if (ct.includes('application/json')) {
    return res.json().then(data => {
      console.log('API成功响应JSON数据:', data);
      return data;
    });
  }
  
  return res.text().then(text => {
    console.log('API成功响应文本数据:', text);
    return text;
  });
}

function authHeader() {
  // 优先尝试获取 'access_token' (之前建议的标准命名)，如果没有再尝试 'authToken'
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  
  if (token) {
    console.log('authHeader 获取 Token 成功'); // 调试日志
    return { 'Authorization': `Bearer ${token}` };
  } else {
    console.warn('authHeader 警告: 未在 localStorage 中找到 Token (access_token 或 authToken)');
    return {};
  }
}

export async function getCaptcha() {
  const requestOptions = { method: 'GET', redirect: 'follow' };
  const res = await fetch(`${API_BASE}/auth/captcha/`, requestOptions);
  const ct = res.headers.get('content-type') || '';
  // try parse JSON if available
  if (ct.includes('application/json')) {
    return res.json();
  }
  // fallback to text (could be base64 image or plain id)
  const text = await res.text();
  // try to detect base64 image
  if (/^data:image\//.test(text) || /^[A-Za-z0-9+/=]+$/.test(text)) {
    return { image: text, raw: text };
  }
  return { raw: text };
}

export async function login({ phone, password, captcha_id, captcha }) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');

  const body = JSON.stringify({ phone, password, captcha_id, captcha });

  const requestOptions = { method: 'POST', headers: myHeaders, body, redirect: 'follow' };
  const res = await fetch(`${API_BASE}/auth/login/`, requestOptions);
  return handleResponse(res);
}

export async function register({ role, name, phone, password }) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');

  const body = JSON.stringify({ role, name, phone, password });
  const requestOptions = { method: 'POST', headers: myHeaders, body, redirect: 'follow' };
  const res = await fetch(`${API_BASE}/auth/register/`, requestOptions);
  return handleResponse(res);
}

export async function refresh() {
  const headers = authHeader();
  // 确保Content-Type也被正确设置
  if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const requestOptions = { method: 'POST', headers: headers, redirect: 'follow' };
  const res = await fetch(`${API_BASE}/auth/refresh/`, requestOptions);
  return handleResponse(res);
}

export async function logout() {
  console.log('=== 开始执行登出函数 ===');
  
  // 1. 使用已定义的authHeader()函数获取认证头
  const headers = authHeader();
  // 确保Content-Type也被正确设置
  if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // 2. 准备请求体 (关键修改：后端通常需要 refresh token 才能注销)
  // 假设你在登录时也存了 refresh_token (如果没有存，发个空对象后端也会报错，但没关系，下面会兜底)
  const refreshToken = localStorage.getItem('refresh_token');
  const body = JSON.stringify({
    refresh: refreshToken 
  });

  const requestOptions = { 
    method: 'POST', 
    headers: headers,
    body: body, // 把 refresh token 发过去
    redirect: 'follow' 
  };
  
  try {
    console.log('尝试请求后端注销...');
    console.log('请求头:', headers);
    const res = await fetch(`${API_BASE}/auth/logout/`, requestOptions);
    
    // 如果后端返回 400/401/500，我们只记录日志，不阻拦用户退出
    if (!res.ok) {
      console.warn('后端注销返回错误，但这不影响前端退出。状态码:', res.status);
    }
  } catch (error) {
    // 比如断网了，或者后端挂了
    console.error('登出请求网络异常，忽略错误，强制退出:', error);
  } finally {
    // === 核心逻辑：无论上面发生了什么，这里必须执行 ===
    console.log('执行本地强制清除...');
    localStorage.removeItem('access_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user'); // 如果你还存了用户信息，顺便删了
    
    // 返回一个假装成功的消息，防止 Navbar.jsx 报错
    return { message: "Logged out successfully" };
  }
}
export async function me() {
  const myHeaders = new Headers();
  const token = localStorage.getItem('authToken');
  if (token) myHeaders.append('Authorization', `Bearer ${token}`);
  const requestOptions = { method: 'GET', headers: myHeaders, redirect: 'follow' };
  const res = await fetch(`${API_BASE}/auth/me/`, requestOptions);
  return handleResponse(res);
}

export async function updateMe({ name, avatar }) {
  const myHeaders = new Headers();
  const token = localStorage.getItem('authToken');
  if (token) myHeaders.append('Authorization', `Bearer ${token}`);
  myHeaders.append('Content-Type', 'application/json');
  const body = JSON.stringify({ name, avatar });
  const requestOptions = { method: 'PUT', headers: myHeaders, body, redirect: 'follow' };
  const res = await fetch(`${API_BASE}/auth/me/`, requestOptions);
  return handleResponse(res);
}

export async function changePassword({ old_password, new_password }) {
  const myHeaders = new Headers();
  const token = localStorage.getItem('authToken');
  if (token) myHeaders.append('Authorization', `Bearer ${token}`);
  myHeaders.append('Content-Type', 'application/json');
  const body = JSON.stringify({ old_password, new_password });
  const requestOptions = { method: 'POST', headers: myHeaders, body, redirect: 'follow' };
  const res = await fetch(`${API_BASE}/auth/change-password/`, requestOptions);
  return handleResponse(res);
}

export default {
  getCaptcha,
  login,
  register,
  refresh,
  logout,
  me,
  updateMe,
  changePassword,
};
