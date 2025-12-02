// 后端接口占位文件：将来把真实后端 URL 填进下面的函数并处理响应
// 说明：当前为占位示例，未执行真实网络请求。

const API_BASE = '/api'; // 根据实际后端地址调整

export async function login({ phone, password }) {
  // 示例：
  // return fetch(`${API_BASE}/auth/login`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ phone, password })
  // }).then(r => r.json());
  throw new Error('login() 尚未实现，请在 src/api/auth.js 中填入后端地址');
}

export async function register({ role, name, phone, password }) {
  // 示例：
  // return fetch(`${API_BASE}/auth/register`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ role, name, phone, password })
  // }).then(r => r.json());
  throw new Error('register() 尚未实现，请在 src/api/auth.js 中填入后端地址');
}

// 如需短信验证码，之后可以添加：sendSmsCode({ phone })、verifySmsCode({ phone, code }) 等方法。

export default {
  login,
  register,
};
