// API wrapper for auth endpoints based on provided fetch examples.
// Each function returns parsed JSON when possible, or raw text otherwise.

const API_BASE = ''; // root; change if backend is mounted under a prefix

function handleResponse(res) {
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    // try parse error message and include status for better debugging
    if (ct.includes('application/json')) {
      return res.json().then(j => {
        const body = typeof j === 'string' ? j : JSON.stringify(j);
        throw new Error(`${res.status} ${res.statusText}: ${body}`);
      });
    }
    return res.text().then(t => { throw new Error(`${res.status} ${res.statusText}: ${t || ''}`); });
  }
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

function authHeader() {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function getCaptcha() {
  const requestOptions = { method: 'GET', redirect: 'follow' };
  const res = await fetch(`${API_BASE}/auth/captcha`, requestOptions);
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
  const res = await fetch(`${API_BASE}/auth/login`, requestOptions);
  return handleResponse(res);
}

export async function register({ role, name, phone, password }) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');

  const body = JSON.stringify({ role, name, phone, password });
  const requestOptions = { method: 'POST', headers: myHeaders, body, redirect: 'follow' };
  const res = await fetch(`${API_BASE}/auth/register`, requestOptions);
  return handleResponse(res);
}

export async function refresh() {
  const myHeaders = new Headers();
  const token = localStorage.getItem('authToken');
  if (token) myHeaders.append('Authorization', `Bearer ${token}`);
  const requestOptions = { method: 'POST', headers: myHeaders, redirect: 'follow' };
  const res = await fetch(`${API_BASE}/auth/refresh`, requestOptions);
  return handleResponse(res);
}

export async function logout() {
  const myHeaders = new Headers();
  const token = localStorage.getItem('authToken');
  if (token) myHeaders.append('Authorization', `Bearer ${token}`);
  const requestOptions = { method: 'POST', headers: myHeaders, redirect: 'follow' };
  const res = await fetch(`${API_BASE}/auth/logout`, requestOptions);
  return handleResponse(res);
}

export async function me() {
  const myHeaders = new Headers();
  const token = localStorage.getItem('authToken');
  if (token) myHeaders.append('Authorization', `Bearer ${token}`);
  const requestOptions = { method: 'GET', headers: myHeaders, redirect: 'follow' };
  const res = await fetch(`${API_BASE}/auth/me`, requestOptions);
  return handleResponse(res);
}

export async function updateMe({ name, avatar }) {
  const myHeaders = new Headers();
  const token = localStorage.getItem('authToken');
  if (token) myHeaders.append('Authorization', `Bearer ${token}`);
  myHeaders.append('Content-Type', 'application/json');
  const body = JSON.stringify({ name, avatar });
  const requestOptions = { method: 'PUT', headers: myHeaders, body, redirect: 'follow' };
  const res = await fetch(`${API_BASE}/auth/me`, requestOptions);
  return handleResponse(res);
}

export async function changePassword({ old_password, new_password }) {
  const myHeaders = new Headers();
  const token = localStorage.getItem('authToken');
  if (token) myHeaders.append('Authorization', `Bearer ${token}`);
  myHeaders.append('Content-Type', 'application/json');
  const body = JSON.stringify({ old_password, new_password });
  const requestOptions = { method: 'POST', headers: myHeaders, body, redirect: 'follow' };
  const res = await fetch(`${API_BASE}/auth/change-password`, requestOptions);
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
