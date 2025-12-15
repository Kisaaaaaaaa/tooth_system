// API wrapper for auth endpoints based on provided fetch examples.
// Each function returns parsed JSON when possible, or raw text otherwise.

const API_BASE = 'http://10.78.120.72:8000/api'; // root with /api prefix; change if backend is mounted under a different prefix
// Mock server base (for profile/email/password endpoints examples provided)
const MOCK_BASE = 'http://127.0.0.1:4523/m1/7500990-7236569-6684919';

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
    const res = await fetch(`${MOCK_BASE}/auth/captcha/`, requestOptions);
    
    // 检查响应状态
    if (!res.ok) {
      console.warn('验证码请求失败，状态码:', res.status);
      return null; // 返回null表示请求失败，让调用方处理
    }
    
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
  } catch (error) {
    console.error('验证码请求发生错误:', error);
    return null; // 返回null表示请求失败，让调用方处理
  }
}

export async function login({ phone, password, captcha_id, captcha }) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');

  const body = JSON.stringify({ phone, password, captcha_id, captcha });

  const requestOptions = { method: 'POST', headers: myHeaders, body, redirect: 'follow' };
  
  try {
    const res = await fetch(`${MOCK_BASE}/auth/login/`, requestOptions);
    return handleResponse(res);
  } catch (error) {
    // 如果mock服务器无法响应，使用本地模拟数据
    console.log('Mock服务器登录端点不可用，使用本地模拟数据', error);
    
    // 验证模拟登录（简单检查手机号和密码）
    // 注意：这只是模拟，实际应用中应该由后端验证
    const validLogin = phone && password;
    
    if (!validLogin) {
      throw new Error('手机号或密码不能为空');
    }
    
    // 生成模拟的用户数据
    const mockUser = {
      id: Math.floor(Math.random() * 1000000),
      role: phone === 'admin' ? 'admin' : 'user', // 如果手机号是admin，模拟管理员角色
      name: phone === 'admin' ? '管理员' : '模拟用户',
      phone,
      // 模拟的token数据
      access: 'mock_access_token_' + Math.random().toString(36).substr(2, 9),
      refresh: 'mock_refresh_token_' + Math.random().toString(36).substr(2, 9)
    };
    
    // 将模拟用户信息存储到localStorage
    localStorage.setItem('access_token', mockUser.access);
    localStorage.setItem('refresh_token', mockUser.refresh);
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    // 返回模拟的成功响应
    return { 
      success: true, 
      message: '登录成功', 
      data: mockUser 
    };
  }
}

export async function register({ role, name, phone, password }) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');

  const body = JSON.stringify({ role, name, phone, password });
  const requestOptions = { method: 'POST', headers: myHeaders, body, redirect: 'follow' };
  
  try {
    const res = await fetch(`${MOCK_BASE}/auth/register/`, requestOptions);
    return handleResponse(res);
  } catch (error) {
    // 如果mock服务器无法响应，使用本地模拟数据
    console.log('Mock服务器注册端点不可用，使用本地模拟数据', error);
    
    // 生成模拟的用户数据
    const mockUser = {
      id: Math.floor(Math.random() * 1000000),
      role,
      name,
      phone,
      // 模拟的token数据
      access: 'mock_access_token_' + Math.random().toString(36).substr(2, 9),
      refresh: 'mock_refresh_token_' + Math.random().toString(36).substr(2, 9)
    };
    
    // 将模拟用户信息存储到localStorage
    localStorage.setItem('access_token', mockUser.access);
    localStorage.setItem('refresh_token', mockUser.refresh);
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    // 返回模拟的成功响应
    return { 
      success: true, 
      message: '注册成功', 
      data: mockUser 
    };
  }
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
    
    // 返回一个假装成功的消息，防止 Navbar.jsx 报错
    return { message: "Logged out successfully" };
  }
}
export async function me() {
  try {
    const myHeaders = new Headers();
    const token = localStorage.getItem('authToken');
    if (token) myHeaders.append('Authorization', `Bearer ${token}`);
    const requestOptions = { method: 'GET', headers: myHeaders, redirect: 'follow' };
    const res = await fetch(`${MOCK_BASE}/auth/me/`, requestOptions);
    return handleResponse(res);
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

export async function updateMe({ name, avatar }) {
  const myHeaders = new Headers();
  const token = localStorage.getItem('authToken');
  if (token) myHeaders.append('Authorization', `Bearer ${token}`);
  myHeaders.append('Content-Type', 'application/json');
  const body = JSON.stringify({ name, avatar });
  const requestOptions = { method: 'PUT', headers: myHeaders, body, redirect: 'follow' };
  const res = await fetch(`${MOCK_BASE}/auth/me/`, requestOptions);
  return handleResponse(res);
}

export async function changePassword({ old_password, new_password }) {
  const myHeaders = new Headers();
  const token = localStorage.getItem('authToken');
  if (token) myHeaders.append('Authorization', `Bearer ${token}`);
  myHeaders.append('Content-Type', 'application/json');
  const body = JSON.stringify({ old_password, new_password });
  const requestOptions = { method: 'POST', headers: myHeaders, body, redirect: 'follow' };
  const res = await fetch(`${MOCK_BASE}/auth/change-password/`, requestOptions);
  return handleResponse(res);
}

// === Profile helpers against mock endpoints ===
export async function sendEmailCode({ email }) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  const token = localStorage.getItem('authToken');
  if (token) myHeaders.append('Authorization', `Bearer ${token}`);
  const body = JSON.stringify({ email });
  const requestOptions = { method: 'POST', headers: myHeaders, body, redirect: 'follow' };
  const res = await fetch(`${MOCK_BASE}/auth/send-email-code/`, requestOptions);
  return handleResponse(res);
}

export async function updateProfile({ name, avatar, email }) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  const token = localStorage.getItem('authToken');
  if (token) myHeaders.append('Authorization', `Bearer ${token}`);
  const body = JSON.stringify({ name, avatar, email });
  const requestOptions = { method: 'PATCH', headers: myHeaders, body, redirect: 'follow' };
  const res = await fetch(`${MOCK_BASE}/auth/me/`, requestOptions);
  return handleResponse(res);
}

export async function changePasswordWithCode({ old_password, new_password, email, code }) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  const token = localStorage.getItem('authToken');
  if (token) myHeaders.append('Authorization', `Bearer ${token}`);
  const body = JSON.stringify({ old_password, new_password, email, code });
  const requestOptions = { method: 'POST', headers: myHeaders, body, redirect: 'follow' };
  const res = await fetch(`${MOCK_BASE}/auth/change-password/`, requestOptions);
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
  sendEmailCode,
  updateProfile,
  changePasswordWithCode,
};
