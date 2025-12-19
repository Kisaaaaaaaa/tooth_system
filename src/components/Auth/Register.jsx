import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/auth';
import { applyDoctor } from '../../api/doctor';

const Register = ({ navigateTo }) => {
    const [role, setRole] = useState('user'); // 默认展示普通用户
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const validatePhone = (p) => /^\d{11}$/.test(p.replace(/\s|-/g, ''));

    // 流程：register -> doctorApply -> done
    const [step, setStep] = useState('register');

    // 医生申请信息
    const [doctorTitle, setDoctorTitle] = useState('');
    const [doctorSpecialty, setDoctorSpecialty] = useState('');
    const [doctorAvatar, setDoctorAvatar] = useState('');
    const [doctorEducation, setDoctorEducation] = useState('');
    const [doctorExperience, setDoctorExperience] = useState('');
    const [doctorIntroduction, setDoctorIntroduction] = useState('');
    const [applySubmitting, setApplySubmitting] = useState(false);

    // 不需要登录：注册即下发 token，因此不再显示内嵌登录
    const hasToken = useMemo(() => !!(localStorage.getItem('access_token') || localStorage.getItem('authToken')), []);

    useEffect(() => {
        // doctorApply 步骤应已有 token（注册即登录）。无 token 时尝试保存注册返回的 token。
        // 前端在 handleSubmit 中已保存返回 token，这里仅保底。
        // 若仍无 token，允许直接提交，后端会返回 401，前端提示错误。
    }, [step]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validatePhone(phone)) {
            setError('请输入有效的电话号码（仅数字，11位）');
            return;
        }

        const user = { role, name, phone };

        try {
            const res = await api.register({ role, name, phone, password });

            // 如果后端在注册时返回 token，则保存
            const token = res?.token || res?.data?.token;
            const refreshToken = res?.refresh_token || res?.data?.refresh_token;
            if (token) {
                localStorage.setItem('authToken', token);
                localStorage.setItem('access_token', token);
            }
            if (refreshToken) {
                localStorage.setItem('refresh_token', refreshToken);
            }

            // 医生：进入申请资料步骤
            if (role === 'doctor') {
                // 进入第二步（医生申请）
                setStep('doctorApply');
                return;
            }

            // 普通用户：尝试获取当前用户信息并进入首页
            try {
                const me = await api.me();
                if (me) localStorage.setItem('user', JSON.stringify(me));
            } catch (e) { /* 忽略 */ }
            localStorage.removeItem('guest');
            navigateTo('');
        } catch (err) {
            const msg = (err && err.message) ? err.message : JSON.stringify(err);
            setError(msg || '注册失败');
        }
    };

    // 移除内嵌登录相关逻辑（注册后已自动登录）

    const handleDoctorApply = async (e) => {
        e.preventDefault();
        setError('');
        setApplySubmitting(true);
        try {
            const res = await applyDoctor({
                name,
                title: doctorTitle,
                specialty: doctorSpecialty,
                avatar: doctorAvatar,
                education: doctorEducation,
                experience: doctorExperience,
                introduction: doctorIntroduction,
            });
            // 成功后进入完成页
            setStep('done');
        } catch (e) {
            setError(e?.message || '提交医生申请失败');
        } finally {
            setApplySubmitting(false);
        }
    };

    return (
        <div className="min-h-[60vh] flex items-start justify-center">
            <div className="w-full max-w-md mx-4 mt-12 sm:mt-20 bg-white p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 text-center">{step === 'register' ? '注册' : (step === 'doctorApply' ? '医生申请' : '申请已提交')}</h2>

                {step === 'register' && (
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
                )}

            {step === 'register' && (
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

            {step === 'doctorApply' && (
                <div className="space-y-5">
                    <form onSubmit={handleDoctorApply} className="space-y-5">
                        <div className="text-sm text-slate-700">请完善医生资料以提交审核</div>
                        <div>
                            <label className="block text-sm text-slate-600">姓名</label>
                            <input className="w-full mt-1 px-3 py-2 border rounded" value={name} onChange={e=>setName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600">头像（URL）</label>
                            <input className="w-full mt-1 px-3 py-2 border rounded" value={doctorAvatar} onChange={e=>setDoctorAvatar(e.target.value)} placeholder="可粘贴上传后的图片URL" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600">职称</label>
                            <input className="w-full mt-1 px-3 py-2 border rounded" value={doctorTitle} onChange={e=>setDoctorTitle(e.target.value)} placeholder="如：主任医师、副主任医师" required />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600">专科</label>
                            <input className="w-full mt-1 px-3 py-2 border rounded" value={doctorSpecialty} onChange={e=>setDoctorSpecialty(e.target.value)} placeholder="如：口腔正畸、种植等" required />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600">学历</label>
                            <input className="w-full mt-1 px-3 py-2 border rounded" value={doctorEducation} onChange={e=>setDoctorEducation(e.target.value)} placeholder="如：硕士、博士等" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600">从业经验</label>
                            <input className="w-full mt-1 px-3 py-2 border rounded" value={doctorExperience} onChange={e=>setDoctorExperience(e.target.value)} placeholder="如：从业10年，擅长xxx" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600">个人简介</label>
                            <textarea className="w-full mt-1 px-3 py-2 border rounded" rows={4} value={doctorIntroduction} onChange={e=>setDoctorIntroduction(e.target.value)} placeholder="简要介绍专业背景、擅长领域等"></textarea>
                        </div>
                        {error && <div className="text-sm text-red-600">{error}</div>}
                        <button disabled={applySubmitting} className="w-full px-4 py-3 bg-cyan-600 text-white rounded-lg shadow-sm">{applySubmitting ? '提交中...' : '提交申请'}</button>
                    </form>
                </div>
            )}

            {step === 'done' && (
                <div className="p-4 bg-yellow-50 border border-yellow-100 rounded">
                    <h3 className="text-lg font-medium">注册申请已提交</h3>
                    <p className="mt-2 text-sm text-slate-600">您已提交医生注册申请，系统将在后台审核。审核通过后我们会通知您。</p>
                    <div className="mt-4 flex gap-2">
                        <button onClick={() => navigateTo('')} className="px-4 py-2 bg-cyan-600 text-white rounded">返回首页</button>
                        <button onClick={() => navigateTo('login')} className="px-4 py-2 bg-slate-200 rounded">去登录</button>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default Register;
