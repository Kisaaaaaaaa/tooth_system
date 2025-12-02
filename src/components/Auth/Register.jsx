import React, { useState } from 'react';
// 如果需要对接后端，请在 `src/api/auth.js` 中实现并导入 register 方法
// import { register as apiRegister } from '../../api/auth';

const Register = ({ navigateTo }) => {
    const [role, setRole] = useState('user'); // 默认展示普通用户
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const validatePhone = (p) => /^\d{11}$/.test(p.replace(/\s|-/g, ''));

    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validatePhone(phone)) {
            setError('请输入有效的电话号码（仅数字，11位）');
            return;
        }

        const user = { role, name, phone };

        if (role === 'doctor') {
            // 医生注册需要审核：前端标记为待审核状态，后端应提供审核流程。
            // 不要求上传凭证（按需求）。
            localStorage.setItem('pendingRegistration', JSON.stringify(user));
            setSubmitted(true);
            // 后续：调用后端接口 apiRegister({ ... }) 并设置状态为 pending
            return;
        }

        // 普通用户可直接注册并登录（前端模拟）
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.removeItem('guest');
        navigateTo('home');

        // 如果对接后端，示例：
        // try {
        //   await apiRegister({ role, name, phone, password });
        // } catch (err) {
        //   setError(err.message || '注册失败');
        // }
    };

    return (
        <div className="min-h-[60vh] flex items-start justify-center">
            <div className="w-full max-w-md mx-4 mt-12 sm:mt-20 bg-white p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 text-center">注册</h2>

                <div className="mb-4">
                <label className="block text-sm text-slate-600 mb-2">注册身份</label>
                <div className="flex items-center gap-4">
                    <label className={`px-3 py-1 rounded cursor-pointer ${role === 'doctor' ? 'bg-cyan-600 text-white' : 'bg-slate-100'}`}>
                        <input className="hidden" type="radio" name="role" value="doctor" checked={role === 'doctor'} onChange={() => setRole('doctor')} /> 医生
                    </label>
                    <label className={`px-3 py-1 rounded cursor-pointer ${role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-100'}`}>
                        <input className="hidden" type="radio" name="role" value="user" checked={role === 'user'} onChange={() => setRole('user')} /> 用户
                    </label>
                </div>
            </div>

            {submitted ? (
                <div className="p-4 bg-yellow-50 border border-yellow-100 rounded">
                    <h3 className="text-lg font-medium">注册申请已提交</h3>
                    <p className="mt-2 text-sm text-slate-600">您已提交医生注册申请，系统将在后台审核。审核通过后我们会通知您。医生不需要上传凭证。</p>
                    <div className="mt-4">
                        <button onClick={() => navigateTo('home')} className="px-4 py-2 bg-cyan-600 text-white rounded">返回首页</button>
                    </div>
                </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm text-slate-600">姓名</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border rounded"
                        placeholder="你的姓名"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm text-slate-600">电话</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border rounded"
                        placeholder="请输入电话号码，仅数字"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm text-slate-600">密码</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border rounded"
                        placeholder="请输入密码"
                        required
                    />
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <div>
                    <button className="w-full px-4 py-3 bg-cyan-600 text-white rounded-lg shadow-sm">注册</button>
                    <div className="text-center mt-3">
                        <button type="button" onClick={() => navigateTo('login')} className="text-sm text-cyan-600">已有账号？登录</button>
                    </div>
                </div>
            </form>
            )}
            </div>
        </div>
    );
};

export default Register;
