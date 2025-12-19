// API wrapper for auth endpoints based on provided fetch examples.
// Each function returns parsed JSON when possible, or raw text otherwise.

const API_BASE = 'http://localhost:8000/api'; // root with /api prefix; change if backend is mounted under a different prefix
// 使用真实后端作为基础地址（以前指向本地 mock）
const MOCK_BASE = API_BASE;

// 通用头像上传（用户、医生均可使用）
export async function uploadAvatar(file, updateAvatar = true) {
  if (!file) throw new Error('缺少上传文件');

  const headers = authHeader();
  headers['Accept'] = 'application/json';

  const formData = new FormData();
  formData.append('file', file);
  if (updateAvatar) {
    formData.append('update_avatar', 'true');
  }

  const requestOptions = {
    method: 'POST',
    headers,
    body: formData,
    redirect: 'follow'
  };

  const res = await fetch(`${API_BASE}/upload/image/`, requestOptions);
  return handleResponse(res);
}

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
  try {
    const requestOptions = { method: 'GET', redirect: 'follow' };
    console.log('请求验证码:', `${MOCK_BASE}/auth/captcha/`);
    const res = await fetch(`${MOCK_BASE}/auth/captcha/`, requestOptions);

    console.log('验证码响应状态:', res.status);

    // 检查响应状态
    if (!res.ok) {
      console.warn('验证码请求失败，状态码:', res.status);
      return null; // 返回null表示请求失败，让调用方处理
    }

    const ct = res.headers.get('content-type') || '';
    console.log('验证码响应Content-Type:', ct);

    // try parse JSON if available
    if (ct.includes('application/json')) {
      const data = await res.json();
      console.log('验证码JSON响应:', data);
      return data;
    }
    // fallback to text (could be base64 image or plain id)
    const text = await res.text();
    console.log('验证码文本响应:', text?.substring(0, 50));
    // try to detect base64 image
    if (/^data:image\//.test(text) || /^[A-Za-z0-9+/=]+$/.test(text)) {
      return { image: text, raw: text };
    }
    return { raw: text };
  } catch (error) {
    console.error('验证码请求发生错误:', error);
    return null; // 返回null表示请求失败，让调用方处理
  }
}

export async function login({ phone, password, captcha_id, captcha }) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  myHeaders.append('Accept', 'application/json');

  // 构建请求体
  const bodyObj = { phone, password, captcha_id, captcha };

  // 详细日志：显示每个字段的值
  console.log('=== 登录请求详情 ===');
  console.log('phone:', phone, '(类型:', typeof phone, ')');
  console.log('password:', password, '(类型:', typeof password, ')');
  console.log('captcha:', captcha, '(类型:', typeof captcha, ')');
  console.log('captcha_id:', captcha_id, '(类型:', typeof captcha_id, ')');

  const body = JSON.stringify(bodyObj);
  console.log('完整请求体 JSON:', body);

  const requestOptions = { method: 'POST', headers: myHeaders, body, redirect: 'follow' };

  console.log('发送登录请求到:', `${MOCK_BASE}/auth/login/`);
  const res = await fetch(`${MOCK_BASE}/auth/login/`, requestOptions);
  return await handleResponse(res);
}

export async function register({ role, name, phone, password }) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  myHeaders.append('Accept', 'application/json');

  const body = JSON.stringify({ role, name, phone, password });
  const requestOptions = { method: 'POST', headers: myHeaders, body, redirect: 'follow' };

  const res = await fetch(`${MOCK_BASE}/auth/register/`, requestOptions);
  return await handleResponse(res);
}

export async function refresh() {
  const headers = authHeader();
  // 确保Content-Type也被正确设置
  if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const requestOptions = { method: 'POST', headers: headers, redirect: 'follow' };
  const res = await fetch(`${MOCK_BASE}/auth/refresh/`, requestOptions);
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
    const res = await fetch(`${MOCK_BASE}/auth/logout/`, requestOptions);

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
    localStorage.removeItem('role'); // 清除角色字段

    // 返回一个假装成功的消息，防止 Navbar.jsx 报错
    return { message: "Logged out successfully" };
  }
}
export async function me() {
  try {
    const myHeaders = new Headers();
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (token) {
      myHeaders.append('Authorization', `Bearer ${token}`);
      console.log('me() 使用 token:', token.substring(0, 20) + '...');
    } else {
      console.warn('me() 警告: 未找到 token');
    }
    const requestOptions = { method: 'GET', headers: myHeaders, redirect: 'follow' };
    const res = await fetch(`${MOCK_BASE}/auth/me/`, requestOptions);
    return await handleResponse(res);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    // 如果mock服务器无法响应，从localStorage获取用户信息
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (parseError) {
        console.error('解析用户信息失败:', parseError);
        return null;
      }
    }
    return null;
  }
}

export async function updateMe({ email, avatar }) {
  const myHeaders = new Headers();
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  if (token) {
    myHeaders.append('Authorization', `Bearer ${token}`);
    console.log('updateMe 使用 token:', token.substring(0, 20) + '...');
  } else {
    console.warn('updateMe 警告: 未找到 token');
  }
  myHeaders.append('Accept', 'application/json');

  const formData = new FormData();
  if (email) formData.append('email', email);
  // 仅在头像为文件或Blob时提交，避免把URL字符串再次当作头像上传
  if (avatar !== undefined && avatar !== null) {
    const isFile = typeof File !== 'undefined' && avatar instanceof File;
    const isBlob = typeof Blob !== 'undefined' && avatar instanceof Blob;
    if (isFile || isBlob) {
      formData.append('avatar', avatar);
    }
  }

  const requestOptions = { method: 'PUT', headers: myHeaders, body: formData, redirect: 'follow' };
  const res = await fetch(`${MOCK_BASE}/auth/me/`, requestOptions);
  return await handleResponse(res);
}

export async function changePassword({ old_password, new_password }) {
  const myHeaders = new Headers();
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  if (token) myHeaders.append('Authorization', `Bearer ${token}`);
  myHeaders.append('Content-Type', 'application/json');
  const body = JSON.stringify({ old_password, new_password });
  const requestOptions = { method: 'POST', headers: myHeaders, body, redirect: 'follow' };
  const res = await fetch(`${MOCK_BASE}/auth/change-password/`, requestOptions);
  return await handleResponse(res);
}

// === Profile helpers against mock endpoints ===
export async function sendEmailCode({ email }) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  if (token) myHeaders.append('Authorization', `Bearer ${token}`);
  const body = JSON.stringify({ email });
  const requestOptions = { method: 'POST', headers: myHeaders, body, redirect: 'follow' };
  const res = await fetch(`${MOCK_BASE}/auth/send-email-code/`, requestOptions);
  return await handleResponse(res);
}

export async function updateProfile({ name, avatar, email }) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  if (token) myHeaders.append('Authorization', `Bearer ${token}`);
  const body = JSON.stringify({ name, avatar, email });
  const requestOptions = { method: 'PATCH', headers: myHeaders, body, redirect: 'follow' };
  const res = await fetch(`${MOCK_BASE}/auth/me/`, requestOptions);
  return await handleResponse(res);
}

export async function changePasswordWithCode({ old_password, new_password, email, code }) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  myHeaders.append('Accept', 'application/json');
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  if (token) myHeaders.append('Authorization', `Bearer ${token}`);

  // 构建请求体：后端要求 old_password 字段存在且非空；若前端未提供，则使用占位符满足必填
  const effectiveOldPwd = (old_password !== undefined && old_password !== null && `${old_password}`.trim() !== '')
    ? old_password
    : 'placeholder_old_password';

  const payload = {
    old_password: effectiveOldPwd,
    new_password,
    email,
    code
  };

  console.log('[changePasswordWithCode] 原始参数:', { old_password: old_password ? '***' : '', new_password: new_password ? '***' : '', email, code });

  const body = JSON.stringify(payload);
  console.log('[changePasswordWithCode] 发送的JSON body:', body);

  const requestOptions = { method: 'POST', headers: myHeaders, body, redirect: 'follow' };
  console.log('[changePasswordWithCode] 请求到:', `${MOCK_BASE}/auth/change-password/`);

  const res = await fetch(`${MOCK_BASE}/auth/change-password/`, requestOptions);
  console.log('[changePasswordWithCode] 响应状态:', res.status);
  const result = await handleResponse(res);

  // 检查响应体中的业务错误码（后端可能返回HTTP 200但包含错误信息）
  if (result && typeof result === 'object' && result.code && result.code >= 400) {
    const errorMsg = (result.message && Array.isArray(result.message))
      ? result.message[0]
      : result.message || '修改密码失败';
    console.error('[changePasswordWithCode] 后端返回错误:', result.code, errorMsg);
    throw new Error(errorMsg);
  }

  return result;
}

export async function sendVerificationCode(email) {
  // 此函数用于发送邮箱验证码（修改邮箱或密码）
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  if (token) myHeaders.append('Authorization', `Bearer ${token}`);
  const body = JSON.stringify({ email });
  const requestOptions = { method: 'POST', headers: myHeaders, body, redirect: 'follow' };

  // 优先使用Mock API (本地开发快速获取)，失败时使用真实API
  try {
    console.log('使用Mock API发送验证码...');
    const res = await fetch(`${MOCK_BASE}/auth/send-email-code/`, requestOptions);
    return await handleResponse(res);
  } catch (e) {
    console.warn('Mock API失败，尝试真实API:', e);
    try {
      const res = await fetch(`${API_BASE}/auth/send-verification-code/`, requestOptions);
      return await handleResponse(res);
    } catch (e2) {
      console.error('两个API都失败:', e2);
      throw e2;
    }
  }
}

export async function verifyEmailAndUpdate(data) {
  // 此函数用于验证邮箱码并更新信息（邮箱或密码）
  // data 包含: email, code, password (可选)
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  if (token) myHeaders.append('Authorization', `Bearer ${token}`);
  const body = JSON.stringify(data);
  const requestOptions = { method: 'POST', headers: myHeaders, body, redirect: 'follow' };

  console.log('验证邮箱码请求:', {
    endpoint: `${MOCK_BASE}/auth/verify-email/`,
    data: data,
    hasToken: !!token
  });

  // 已被 changePasswordWithCode 取代，直接使用本地Mock
  console.log('使用Mock API验证邮箱码...');
  const res = await fetch(`${MOCK_BASE}/auth/verify-email/`, requestOptions);
  return await handleResponse(res);
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
  sendEmailCode,
  updateProfile,
  changePasswordWithCode,
  sendVerificationCode,
  verifyEmailAndUpdate,
  uploadAvatar,
};
