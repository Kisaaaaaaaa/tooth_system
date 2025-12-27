import React, { useEffect, useMemo, useState, useRef } from 'react';
import api from '../../api/auth';
import { applyDoctor, getDoctorMe } from '../../api/doctor';
import { uploadImage, resolveMediaUrl } from '../../api/utils';

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
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    // 兼容：计算型的 hasToken
    const hasToken = useMemo(() => !!(localStorage.getItem('access_token') || localStorage.getItem('authToken')), []);

    // 无需登录验证码面板，简化逻辑
    
    // 检查是否是被拒绝的医生重新申请
    useEffect(() => {
        const isReapply = localStorage.getItem('doctorReapply');
        const rejectReason = localStorage.getItem('doctorRejectReason');
        const savedPhone = localStorage.getItem('doctorReapplyPhone');
        
        if (isReapply === 'true') {
            // 清除标记
            localStorage.removeItem('doctorReapply');
            
            // 直接进入医生申请步骤
            setRole('doctor');
            setStep('doctorApply');
            
            // 显示拒绝原因提示
            if (rejectReason) {
                setError(`上次审核未通过：${rejectReason}。请重新填写申请资料。`);
                localStorage.removeItem('doctorRejectReason');
            }
            
            // 填充手机号（必填项）
            if (savedPhone) {
                setPhone(savedPhone);
                localStorage.removeItem('doctorReapplyPhone');
            }
            
            // 尝试获取医生的完整信息
            const loadDoctorData = async () => {
                try {
                    // 先从 localStorage 获取基本用户信息
                    const userStr = localStorage.getItem('user');
                    if (userStr) {
                        const user = JSON.parse(userStr);
                        console.log('加载用户数据:', user);
                        
                        // 基本信息
                        if (user.name) setName(user.name);
                        if (user.phone && !savedPhone) setPhone(user.phone);
                        
                        // 医生信息
                        if (user.title) setDoctorTitle(user.title);
                        if (user.specialty) setDoctorSpecialty(user.specialty);
                        if (user.avatar) setDoctorAvatar(user.avatar);
                        if (user.education) setDoctorEducation(user.education);
                        if (user.experience_years !== undefined) setDoctorExperience(String(user.experience_years));
                        if (user.introduction) setDoctorIntroduction(user.introduction);
                    }
                    
                    // 如果有 token，尝试从后端获取完整的医生信息
                    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
                    if (token) {
                        console.log('尝试从后端获取医生完整信息');
                        const doctorData = await getDoctorMe();
                        console.log('医生完整数据:', doctorData);
                        
                        if (doctorData) {
                            // 更新所有医生信息
                            if (doctorData.name) setName(doctorData.name);
                            if (doctorData.phone && !savedPhone) setPhone(doctorData.phone);
                            if (doctorData.title) setDoctorTitle(doctorData.title);
                            if (doctorData.specialty) setDoctorSpecialty(doctorData.specialty);
                            if (doctorData.avatar) setDoctorAvatar(doctorData.avatar);
                            if (doctorData.education) setDoctorEducation(doctorData.education);
                            if (doctorData.experience_years !== undefined) setDoctorExperience(String(doctorData.experience_years));
                            if (doctorData.introduction) setDoctorIntroduction(doctorData.introduction);
                            
                            console.log('已填充医生申请数据');
                        }
                    }
                } catch (e) {
                    console.error('加载医生信息失败:', e);
                }
            };
            
            loadDoctorData();
        }
    }, []);

    // 若已登录且选择医生身份，直接进入医生申请步骤，避免重复注册错误
    useEffect(() => {
        if (hasToken && role === 'doctor' && step === 'register') {
            setStep('doctorApply');
        }
    }, [hasToken, role, step]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validatePhone(phone)) {
            setError('请输入有效的电话号码（仅数字，11位）');
            return;
        }

        // 已登录且是医生注册，跳过注册直接进入医生申请
        if (role === 'doctor' && hasToken) {
            setStep('doctorApply');
            return;
        }

        const user = { role, name, phone };

        try {
            const res = await api.register({ role, name, phone, password });

            // 注册接口不返回 token，医生需先完成登录验证后再上传头像与提交资料

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
            // 所有错误都直接提示，不再自动跳转医生申请
            const rawMsg = err?.message || '';
            setError(rawMsg || '注册失败');
        }
    };

    // 移除内嵌登录相关逻辑（注册后已自动登录）

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            setError('请选择图片文件');
            return;
        }
        
        // 检查文件大小（限制5MB）
        if (file.size > 5 * 1024 * 1024) {
            setError('图片大小不能超过5MB');
            return;
        }
        
        setError('');
        setUploadingAvatar(true);
        try {
            // 无论是否登录，都直接上传到服务器获取 http/https URL
            // 创建 FormData 对象
            const formData = new FormData();
            formData.append('file', file);
            formData.append('update_avatar', 'false'); // 不更新用户头像，只获取URL
            
            console.log('开始上传图片，文件名:', file.name, '大小:', file.size, '类型:', file.type);
            const res = await uploadImage(formData);
            console.log('上传响应:', res);
            
            // 后端返回 { url: "..." }
            const uploadUrl = res?.url || res?.data?.url;
            if (uploadUrl) {
                // 验证 URL 格式和长度
                if (!/^https?:\/\//i.test(uploadUrl)) {
                    throw new Error('上传返回的 URL 格式无效，需要 http/https');
                }
                if (uploadUrl.length > 200) {
                    throw new Error('上传返回的 URL 长度超过 200 字符');
                }
                setDoctorAvatar(uploadUrl);
                console.log('头像设置成功(服务端URL):', uploadUrl);
            } else {
                console.error('上传返回格式错误，响应:', res);
                throw new Error('上传返回格式错误，缺少 url');
            }
        } catch (err) {
            console.error('上传头像失败，错误详情:', err);
            setError(err?.message || err?.toString() || '上传头像失败');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleDoctorApply = async (e) => {
        e.preventDefault();
        setError('');
        setApplySubmitting(true);
        try {
            // 验证头像 URL：必须是 http/https 且长度不超过 200
            const isHttpUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);
            
            const avatarValid = (() => {
                if (!doctorAvatar) return undefined;
                if (isHttpUrl(doctorAvatar) && doctorAvatar.length <= 200) {
                    return doctorAvatar;
                }
                return undefined;
            })();
            
            if (!avatarValid && doctorAvatar) {
                console.warn('头像地址无效或超长，已忽略提交（需 http/https 且长度 ≤200）');
            }
            
            const res = await applyDoctor({
                name,
                title: doctorTitle,
                specialty: doctorSpecialty,
                avatar: avatarValid,
                education: doctorEducation,
                experience: doctorExperience,
                introduction: doctorIntroduction,
                phone: phone,
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
            <div className={`w-full ${step === 'doctorApply' ? 'max-w-2xl' : 'max-w-md'} mx-4 mt-12 sm:mt-20 bg-white p-8 rounded-2xl shadow-lg`}>
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
                <div className="space-y-4">
                    {/* 登录验证面板已移除，申请页不再要求登录 */}
                    <form onSubmit={handleDoctorApply} className="space-y-4">
                        <div className="text-sm text-cyan-700 bg-cyan-50 p-3 rounded-lg border border-cyan-100">
                            请完善医生资料以提交审核
                        </div>
                        
                        {/* 头像上传区域 - 优化为更显眼的样式 */}
                        <div className={"flex flex-col items-center py-4 rounded-lg border-2 border-dashed bg-slate-50 border-slate-300"}>
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />
                            {doctorAvatar ? (
                                <div className="relative">
                                    <img src={resolveMediaUrl(doctorAvatar)} alt="头像预览" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-2 -right-2 bg-cyan-600 text-white px-3 py-1 rounded-full text-xs shadow-md hover:bg-cyan-700"
                                    >
                                        更换
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    className="flex flex-col items-center gap-2 text-slate-600 hover:text-cyan-600"
                                >
                                    <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center">
                                        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium">{uploadingAvatar ? '上传中...' : '点击上传头像或粘贴URL'}</span>
                                </button>
                            )}
                        </div>
                        {/* 头像URL手动输入（可选） */}
                        <div className="w-full">
                            <label className="block text-sm font-medium text-slate-700 mb-1">或粘贴图片URL</label>
                            <input 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                                value={doctorAvatar} 
                                onChange={e=>setDoctorAvatar(e.target.value)} 
                                placeholder="https://example.com/avatar.jpg"
                            />
                        </div>

                        {/* 使用两列布局优化空间 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">姓名 *</label>
                                <input 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                                    value={name} 
                                    onChange={e=>setName(e.target.value)} 
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">职称 *</label>
                                <input 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                                    value={doctorTitle} 
                                    onChange={e=>setDoctorTitle(e.target.value)} 
                                    placeholder="主任医师" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">专科 *</label>
                                <input 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                                    value={doctorSpecialty} 
                                    onChange={e=>setDoctorSpecialty(e.target.value)} 
                                    placeholder="口腔正畸" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">学历</label>
                                <input 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                                    value={doctorEducation} 
                                    onChange={e=>setDoctorEducation(e.target.value)} 
                                    placeholder="硕士" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">从业经验</label>
                            <input 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                                value={doctorExperience} 
                                onChange={e=>setDoctorExperience(e.target.value)} 
                                placeholder="从业10年，擅长口腔种植修复" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">个人简介</label>
                            <textarea 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none" 
                                rows={3} 
                                value={doctorIntroduction} 
                                onChange={e=>setDoctorIntroduction(e.target.value)} 
                                placeholder="简要介绍专业背景、擅长领域等"
                            ></textarea>
                        </div>

                        {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
                        
                        <button 
                            disabled={applySubmitting || uploadingAvatar} 
                            className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {applySubmitting ? '提交中...' : '提交申请'}
                        </button>
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
