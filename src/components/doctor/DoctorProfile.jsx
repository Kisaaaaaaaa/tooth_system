import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Mail, Wifi, WifiOff } from 'lucide-react';
import doctorApi from '../../api/doctor';
import api from '../../api/auth';

const DoctorProfile = () => {
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showEmailVerification, setShowEmailVerification] = useState(false);
    const [verificationStep, setVerificationStep] = useState(1); // 1: 输入邮箱, 2: 验证码
    
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        specialty: '',
        avatar: '',
        introduction: '',
        education: '',
        experience: '',
        email: '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [verificationData, setVerificationData] = useState({
        email: '',
        code: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [phone, setPhone] = useState('');
    const [countdown, setCountdown] = useState(0); // 验证码倒计时
    const [verifying, setVerifying] = useState(false); // 验证中的加载状态
    const [changePassword, setChangePassword] = useState(false); // 是否启用修改密码
    const [togglingOnline, setTogglingOnline] = useState(false); // 切换在线状态中

    useEffect(() => {
        fetchDoctorProfile();
    }, []);

    // 验证码倒计时
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [countdown]);

    // 邮箱格式验证
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const fetchDoctorProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            const [doctorRes, userRes] = await Promise.all([
                doctorApi.getDoctorMe(),
                api.me().catch(err => {
                    console.warn('获取用户基本信息失败:', err);
                    return null;
                })
            ]);

            const doctorData = doctorRes && (doctorRes.data || doctorRes);
            const userData = userRes && (userRes.data || userRes);
            const mergedDoctor = {
                ...(doctorData || {}),
                name: (doctorData && doctorData.name) || userData?.name || '',
                email: (doctorData && doctorData.email) || userData?.email || '',
                avatar: (doctorData && doctorData.avatar) || userData?.avatar || ''
            };
            console.log('[DoctorProfile] 医生数据:', mergedDoctor);

            if (userData?.phone) {
                setPhone(userData.phone);
            } else {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    try {
                        const parsed = JSON.parse(userStr);
                        if (parsed.user && parsed.user.phone) {
                            setPhone(parsed.user.phone);
                        } else if (parsed.phone) {
                            setPhone(parsed.phone);
                        }
                    } catch (e) {
                        console.warn('解析用户信息失败:', e);
                    }
                }
            }

            setDoctor(mergedDoctor);
            setFormData({
                name: mergedDoctor.name || '',
                title: mergedDoctor.title || '',
                specialty: mergedDoctor.specialty || '',
                avatar: mergedDoctor.avatar || '',
                introduction: mergedDoctor.introduction || '',
                education: mergedDoctor.education || '',
                experience: mergedDoctor.experience || '',
                email: mergedDoctor.email || '',
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (err) {
            console.error('获取医生信息失败:', err);
            setError('获取医生信息失败');
            
            // 使用模拟数据
            const mockDoctor = {
                id: 5,
                name: '是梓豪',
                title: '靠近百般遍及只但是更加地址',
                specialty: 'reprehenderit amet Ut',
                avatar: 'https://avatars.githubusercontent.com/u/50889056',
                score: 99,
                reviews: 54,
                introduction: 'deserunt',
                education: 'in adipisicing',
                experience: 'aliqua dolore',
                is_online: true,
                is_super_doctor: false
            };
            setDoctor(mockDoctor);
            setFormData({
                name: mockDoctor.name || '',
                title: mockDoctor.title || '',
                specialty: mockDoctor.specialty || '',
                avatar: mockDoctor.avatar || '',
                introduction: mockDoctor.introduction || '',
                education: mockDoctor.education || '',
                experience: mockDoctor.experience || '',
                email: '',
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setPhone('13800138000');
        } finally {
            setLoading(false);
        }
    };

    // 将最新的用户基础信息同步到 localStorage 并通知全局（Navbar等会监听此事件刷新）
    const syncLocalUser = (partial) => {
        try {
            const raw = localStorage.getItem('user');
            if (!raw) return;
            let parsed = null;
            try { parsed = JSON.parse(raw); } catch {}
            if (!parsed) return;

            // 如果是 { token, user: {...} } 这种嵌套结构，优先更新 user 内部
            if (parsed.user && typeof parsed.user === 'object') {
                parsed.user = { ...parsed.user, ...partial };
            } else {
                parsed = { ...parsed, ...partial };
            }
            localStorage.setItem('user', JSON.stringify(parsed));
            // 通知同窗口组件刷新
            window.dispatchEvent(new Event('localStorageUpdated'));
        } catch (e) {
            console.warn('同步本地用户信息失败:', e);
        }
    };

    const handleToggleOnline = async () => {
        if (togglingOnline) return;
        
        const newStatus = !doctor?.is_online;
        setTogglingOnline(true);
        setError(null);
        
        try {
            const res = await doctorApi.setDoctorOnlineStatus(newStatus);
            // 更新本地状态
            setDoctor(prev => ({ ...prev, is_online: newStatus }));
            console.log('在线状态已更新为:', newStatus);
        } catch (err) {
            console.error('切换在线状态失败:', err);
            setError(err.message || '切换在线状态失败');
        } finally {
            setTogglingOnline(false);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            setError('请选择图片文件');
            return;
        }
        // 验证文件大小（限制在5MB以内）
        if (file.size > 5 * 1024 * 1024) {
            setError('图片大小不能超过5MB');
            return;
        }

        try {
            setError(null);
            // 先设置本地预览
            const previewUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, avatar: previewUrl }));

            // 上传到后端
            const res = await api.uploadAvatar(file, true);
            const url = res?.data?.url || res?.url || res?.data?.path || res?.path || res?.data?.image_url || res?.image_url;
            if (url) {
                setFormData(prev => ({ ...prev, avatar: url }));
            } else {
                setError('上传成功但未返回头像地址');
            }
        } catch (err) {
            console.error('头像上传失败:', err);
            setError(err.message || '头像上传失败');
        }
    };

    const handleVerificationChange = (e) => {
        const { name, value } = e.target;
        setVerificationData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSendVerificationCode = async () => {
        const errors = [];
        const email = (formData.email || '').trim();
        if (!email) {
            errors.push('请输入邮箱地址');
        } else if (!validateEmail(email)) {
            errors.push('请输入有效的邮箱地址（如：example@domain.com）');
        }
        
        if (errors.length > 0) {
            alert(errors.join('\n'));
            setError(errors[0]);
            return;
        }
        
        try {
            setError(null);
            // 调用发送验证码接口
            const response = await api.sendVerificationCode(email);
            console.log('发送验证码响应:', response);
            // 如果Mock API返回了验证码，可以在开发环境中调试
            if (response && response.code) {
                console.log('调试信息 - 验证码:', response.code);
            }
            setError(null);
            setVerificationStep(2);
            setVerificationData(prev => ({ ...prev, email }));
            setCountdown(60); // 开始60秒倒计时
            // 显示成功提示
            alert('验证码已发送到您的邮箱\n请在60秒内输入验证码');
        } catch (err) {
            console.error('发送验证码失败:', err);
            const errorMsg = '发送验证码失败，请检查邮箱是否正确';
            alert(errorMsg);
            setError(errorMsg);
        }
    };

    const handleVerifyAndUpdate = async () => {
        const errors = [];
        const email = (verificationData.email || '').trim();
        const newPwd = (verificationData.newPassword || '').trim();
        const confirmPwd = (verificationData.confirmPassword || '').trim();
        const code = (verificationData.code || '').trim();
        const oldPwd = (formData.oldPassword || '').trim();

        console.log('[医生端] 密码修改验证:', { email, newPwd: '***', confirmPwd: '***', code, oldPwd: oldPwd ? '***' : '' });

        if (!email) {
            errors.push('请输入邮箱地址');
        } else if (!validateEmail(email)) {
            errors.push('请输入有效的邮箱地址');
        }

        if (!newPwd) {
            errors.push('请返回重新填写新密码');
        }

        if (!confirmPwd) {
            errors.push('请返回重新确认新密码');
        }

        if (newPwd && confirmPwd && newPwd !== confirmPwd) {
            errors.push('两次输入的密码不一致');
        }

        if (!code || code.length === 0) {
            errors.push('请输入验证码');
        }

        if (!oldPwd) {
            errors.push('请输入旧密码');
        }

        if (errors.length > 0) {
            console.warn('[医生端] 验证失败:', errors);
            alert(errors.join('\n'));
            setError(errors[0]);
            return;
        }

        try {
            setError(null);
            setVerifying(true);
            
            console.log('[医生端] 开始发送密码修改请求...');
            const payload = { old_password: oldPwd, new_password: newPwd, email: email, code: code };
            console.log('[医生端] 请求体:', { ...payload, new_password: '***' });
            await api.changePasswordWithCode(payload);
            
            console.log('[医生端] 验证成功，正在更新医生信息...');
            await fetchDoctorProfile();
            setShowEmailVerification(false);
            setVerificationStep(1);
            setVerificationData({
                email: '',
                code: '',
                newPassword: '',
                confirmPassword: ''
            });
            setFormData(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }));
            setCountdown(0);
            setVerifying(false);
            console.log('[医生端] 密码修改完成');
            alert('✓ 密码修改成功，请妥善保管您的新密码');
            setTimeout(() => {
                navigate('/doctorDashboard');
            }, 1500);
        } catch (err) {
            setVerifying(false);
            console.error('[医生端] 密码修改失败:', err);
            const errorMsg = err.message || '验证失败，请检查验证码是否正确';
            console.error('[医生端] 错误详情:', errorMsg);
            alert('验证失败：\n\n' + errorMsg);
            setError(errorMsg);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setError(null);
            const errors = [];
            const newPwd = (formData.newPassword || '').trim();
            const confirmPwd = (formData.confirmPassword || '').trim();
            const oldPwd = (formData.oldPassword || '').trim();
            const hasPasswordChange = !!changePassword; // 仅在打开修改密码时才校验
            const emailForVerify = (formData.email || doctor?.email || '').trim();
            
            if (!formData.name || formData.name.trim() === '') {
                errors.push('姓名不能为空');
            }
            
            if (!formData.title || formData.title.trim() === '') {
                errors.push('职称不能为空');
            }
            
            if (!formData.specialty || formData.specialty.trim() === '') {
                errors.push('专业方向不能为空');
            }

            if (formData.email && !validateEmail((formData.email || '').trim())) {
                errors.push('请输入有效的邮箱地址（如：example@domain.com）');
            }

            if (hasPasswordChange) {
                if (!newPwd || !confirmPwd) {
                    errors.push('请输入并确认新密码');
                } else if (newPwd !== confirmPwd) {
                    errors.push('两次输入的密码不一致');
                }
                if (!oldPwd) {
                    errors.push('请输入旧密码');
                }
                if (!emailForVerify) {
                    errors.push('修改密码需要先填写邮箱');
                }
                const code = (verificationData.code || '').trim();
                if (!code) {
                    errors.push('请输入验证码');
                }
            }

            if (errors.length > 0) {
                alert('信息输入有误：\n\n' + errors.join('\n'));
                setError(errors[0]);
                return;
            }

            // 用户基础信息接口仅修改邮箱/头像（和密码），不修改姓名
            const userPayload = {
                email: (formData.email || '').trim() || undefined,
                avatar: (() => {
                    const av = formData.avatar;
                    // 仅当为文件/Blob时传给 auth.me；URL 字符串不传
                    if (av && ( (typeof File !== 'undefined' && av instanceof File) || (typeof Blob !== 'undefined' && av instanceof Blob) )) {
                        return av;
                    }
                    return undefined;
                })()
            };

            // 医生端接口负责医生特定信息和姓名
            const doctorPayload = {
                name: formData.name,
                title: formData.title,
                specialty: formData.specialty,
                introduction: formData.introduction,
                education: formData.education,
                experience: formData.experience
            };

            if (formData.avatar) {
                doctorPayload.avatar = formData.avatar;
            }

            const [userResult, doctorResult] = await Promise.allSettled([
                api.updateMe(userPayload),
                doctorApi.updateDoctorProfile(doctorPayload)
            ]);

            if (userResult.status === 'rejected' || doctorResult.status === 'rejected') {
                const errorMsgs = [];
                if (userResult.status === 'rejected') {
                    errorMsgs.push(`用户信息更新失败: ${userResult.reason?.message || userResult.reason}`);
                }
                if (doctorResult.status === 'rejected') {
                    errorMsgs.push(`医生信息更新失败: ${doctorResult.reason?.message || doctorResult.reason}`);
                }
                throw new Error(errorMsgs.join('；'));
            }

            const userUpdated = userResult.value;
            const doctorUpdated = doctorResult.value;
            const nextDoctor = {
                ...(doctorUpdated?.data || doctorUpdated || {}),
                name: userPayload.name,
                email: userPayload.email || doctor?.email,
                avatar: userPayload.avatar || (doctorUpdated?.data || doctorUpdated)?.avatar || doctor?.avatar
            };

            if (userUpdated && (userUpdated.phone || (userUpdated.data && userUpdated.data.phone))) {
                const userPhone = userUpdated.phone || userUpdated.data.phone;
                setPhone(userPhone);
            }

            setDoctor(prev => ({ ...prev, ...nextDoctor }));

            // 同步本地用户资料（用于 Navbar 等处实时刷新）
            const syncPayload = {
                // 显示层面希望立即生效的字段
                name: doctorPayload.name,
                email: userPayload.email || (userUpdated?.data?.email || userUpdated?.email),
                avatar: nextDoctor.avatar
            };
            syncLocalUser(syncPayload);

            if (hasPasswordChange) {
                // 同页完成密码修改
                console.log('[医生端] 准备修改密码，参数:', {
                    old_password: oldPwd ? '***' : '',
                    new_password: newPwd ? '***' : '',
                    email: emailForVerify,
                    code: (verificationData.code || '').trim()
                });
                setVerifying(true);
                const pwdResult = await api.changePasswordWithCode({
                    old_password: oldPwd,
                    new_password: newPwd,
                    email: emailForVerify,
                    code: (verificationData.code || '').trim()
                });
                console.log('[医生端] 密码修改响应:', pwdResult);
                setVerifying(false);
                // 密码修改成功后清空密码与验证码
                setVerificationData(prev => ({ ...prev, code: '', newPassword: '', confirmPassword: '' }));
                setFormData(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }));
                setCountdown(0);
            }

            setIsEditing(false);
            setFormData(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }));
            alert(hasPasswordChange ? '信息与密码已更新成功' : '信息更新成功');
        } catch (err) {
            console.error('更新医生信息失败:', err);
            const errorMsg = err.message || '更新信息失败';
            alert('更新失败：' + errorMsg);
            setError(errorMsg);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-600">加载中...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 py-6 animate-fade-in">
            {/* 顶部操作栏 */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">个人信息</h1>
                {!isEditing && (
                    <div className="flex gap-3">
                        <button
                            onClick={handleToggleOnline}
                            disabled={togglingOnline}
                            className={`px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-2 ${
                                doctor?.is_online 
                                    ? 'bg-orange-600 text-white hover:bg-orange-700' 
                                    : 'bg-green-600 text-white hover:bg-green-700'
                            } ${togglingOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {togglingOnline ? (
                                <span>切换中...</span>
                            ) : doctor?.is_online ? (
                                <>
                                    <WifiOff size={18} />
                                    <span>设为离线</span>
                                </>
                            ) : (
                                <>
                                    <Wifi size={18} />
                                    <span>设为在线</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            编辑信息
                        </button>
                    </div>
                )}
            </div>

            {/* 错误提示 */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    {error}
                </div>
            )}

            {/* 显示模式 */}
            {!isEditing && (
                <div className="space-y-6">
                    {/* 头部卡片 */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                        <div className="flex items-start gap-6">
                            <img
                                src={doctor?.avatar || '/images/avatar-fallback.svg'}
                                alt={doctor?.name}
                                className="w-32 h-32 rounded-xl object-cover shadow-lg"
                            />

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-3xl font-bold text-slate-800">{doctor?.name}</h2>
                                    {doctor?.is_super_doctor && (
                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-bold rounded-full">
                                            超级医生
                                        </span>
                                    )}
                                    {doctor?.is_online && (
                                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-bold rounded-full">
                                            在线
                                        </span>
                                    )}
                                </div>
                                
                                <p className="text-lg text-cyan-600 font-medium mb-4">{doctor?.title}</p>
                                
                                {/* 评分和评价 */}
                                <div className="flex gap-6 mb-4">
                                    <div>
                                        <p className="text-sm text-slate-600">评分</p>
                                        <p className="text-2xl font-bold text-amber-500">{doctor?.score || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600">评价数</p>
                                        <p className="text-2xl font-bold text-slate-800">{doctor?.reviews || 0}</p>
                                    </div>
                                </div>

                                <p className="text-slate-600">{doctor?.specialty}</p>
                            </div>
                        </div>
                    </div>

                    {/* 详细信息卡片 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4">基本信息</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-slate-600">医生ID</p>
                                    <p className="text-slate-800 font-medium">{doctor?.id || '未设置'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">职称</p>
                                    <p className="text-slate-800 font-medium">{doctor?.title || '未设置'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">专业方向</p>
                                    <p className="text-slate-800 font-medium">{doctor?.specialty || '未设置'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4">联系方式</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-slate-600">电话</p>
                                    <p className="text-slate-800 font-medium">{phone || '未设置'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">邮箱</p>
                                    <p className="text-slate-800 font-medium">{doctor?.email || '未设置'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">在线状态</p>
                                    <p className={`font-medium ${doctor?.is_online ? 'text-green-600' : 'text-slate-600'}`}>
                                        {doctor?.is_online ? '在线' : '离线'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 学历信息 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4">学历信息</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-slate-600">学历</p>
                                    <p className="text-slate-800 font-medium">{doctor?.education || '未设置'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">从业经历</p>
                                    <p className="text-slate-800 font-medium">{doctor?.experience || '未设置'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4">其他信息</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-slate-600">创建时间</p>
                                    <p className="text-slate-800 font-medium">
                                        {doctor?.created_at ? new Date(doctor.created_at).toLocaleDateString('zh-CN') : '未设置'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">最后更新</p>
                                    <p className="text-slate-800 font-medium">
                                        {doctor?.updated_at ? new Date(doctor.updated_at).toLocaleDateString('zh-CN') : '未设置'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 个人简介 */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-3">个人简介</h3>
                        <p className="text-slate-600 leading-relaxed">
                            {doctor?.introduction || '暂无个人简介'}
                        </p>
                    </div>
                </div>
            )}

            {/* 编辑模式 */}
            {isEditing && (
                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">编辑个人信息</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">姓名</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleFormChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">职称</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleFormChange}
                                    placeholder="如：主任医师、副主任医师"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">专业方向</label>
                                <input
                                    type="text"
                                    name="specialty"
                                    value={formData.specialty}
                                    onChange={handleFormChange}
                                    placeholder="如：口腔修复、正畸"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">学历</label>
                                <input
                                    type="text"
                                    name="education"
                                    value={formData.education}
                                    onChange={handleFormChange}
                                    placeholder="如：本科、硕士、博士"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">从业经历</label>
                                <input
                                    type="text"
                                    name="experience"
                                    value={formData.experience}
                                    onChange={handleFormChange}
                                    placeholder="如：从业经历"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">头像</label>
                            <div className="space-y-3">
                                <div className="flex items-center gap-4">
                                    {formData.avatar && (
                                        <img 
                                            src={formData.avatar} 
                                            alt="预览" 
                                            className="w-20 h-20 rounded-lg object-cover border border-slate-300"
                                        />
                                    )}
                                    <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                                        <span className="text-sm font-medium text-slate-600">选择本地图片上传</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                <p className="text-xs text-slate-500">支持 JPG、PNG 等格式，大小不超过 5MB</p>
                            </div>
                        </div>

                        {/* 邮箱输入已移动至“安全设置”区域与密码一起展示，便于查看 */}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">个人简介</label>
                            <textarea
                                name="introduction"
                                value={formData.introduction}
                                onChange={handleFormChange}
                                placeholder="请输入个人简介"
                                rows="5"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="border-t border-slate-200 pt-4">
                            <h3 className="font-bold text-slate-800 mb-4">安全设置</h3>
                            <div className="flex items-center gap-3 mb-3">
                                <input
                                    id="toggle-change-password"
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={changePassword}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setChangePassword(checked);
                                        if (!checked) {
                                            setFormData(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }));
                                            setVerificationData(prev => ({ ...prev, code: '', newPassword: '', confirmPassword: '' }));
                                            setCountdown(0);
                                        }
                                    }}
                                />
                                <label htmlFor="toggle-change-password" className="text-slate-700 select-none">修改密码</label>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">邮箱地址</label>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleFormChange}
                                        placeholder="请输入邮箱地址"
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!formData.email || !formData.email.trim()) {
                                                alert('请先输入邮箱地址');
                                                return;
                                            }
                                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                            if (!emailRegex.test(formData.email.trim())) {
                                                alert('请输入有效的邮箱地址');
                                                return;
                                            }
                                            try {
                                                // 使用与保存信息修改相同的接口逻辑
                                                const userPayload = { email: formData.email.trim() };
                                                const [userResult] = await Promise.allSettled([
                                                    api.updateMe(userPayload)
                                                ]);
                                                
                                                if (userResult.status === 'rejected') {
                                                    throw new Error(userResult.reason?.message || userResult.reason || '保存失败');
                                                }
                                                
                                                // 更新本地doctor数据
                                                setDoctor(prev => ({ ...prev, email: formData.email.trim() }));
                                                
                                                // 同步到全局状态，让导航栏等其他组件也能实时更新
                                                syncLocalUser({ email: formData.email.trim() });
                                                
                                                alert('✓ 邮箱保存成功！现在可以修改密码了');
                                            } catch (err) {
                                                console.error('保存邮箱失败:', err);
                                                alert('保存邮箱失败：' + (err.message || '未知错误'));
                                            }
                                        }}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition whitespace-nowrap"
                                    >
                                        保存邮箱
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    <strong className="text-orange-600">⚠️ 重要：</strong>修改密码前请先点击"保存邮箱"按钮保存邮箱地址，否则无法接收验证码
                                </p>
                            </div>

                            {/* 密码修改区域 - 仅在勾选"修改密码"时显示 */}
                            {changePassword && (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">旧密码</label>
                                        <input
                                            type="password"
                                            name="oldPassword"
                                            value={formData.oldPassword}
                                            onChange={handleFormChange}
                                            placeholder="请输入当前密码"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* 验证码区域 */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                                            <span>邮箱验证码</span>
                                            {countdown > 0 && <span className="text-red-600 font-bold">{countdown}秒</span>}
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                name="code"
                                                value={verificationData.code}
                                                onChange={(e)=> setVerificationData(prev => ({...prev, code: e.target.value}))}
                                                placeholder="请输入验证码"
                                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSendVerificationCode}
                                                disabled={countdown>0}
                                                className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                            >
                                                {countdown>0 ? '重新发送' : '发送验证码'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">新密码</label>
                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={formData.newPassword}
                                                onChange={handleFormChange}
                                                placeholder="请输入新密码"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">确认密码</label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleFormChange}
                                                placeholder="确认新密码"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded">
                                            <strong>重要提示：</strong>修改密码需要进行邮箱验证以保护您的账户安全
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({
                                        name: doctor?.name || '',
                                        title: doctor?.title || '',
                                        specialty: doctor?.specialty || '',
                                        avatar: doctor?.avatar || '',
                                        introduction: doctor?.introduction || '',
                                        education: doctor?.education || '',
                                        experience: doctor?.experience || '',
                                        email: doctor?.email || '',
                                        newPassword: '',
                                        confirmPassword: ''
                                    });
                                }}
                                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                            >
                                <X size={18} />
                                取消
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                <Save size={18} />
                                保存修改
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 邮箱验证模式已合并到安全设置内 */}
        </div>
    );
};

export default DoctorProfile;
