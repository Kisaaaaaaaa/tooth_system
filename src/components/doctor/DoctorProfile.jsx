import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Mail } from 'lucide-react';
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
            
            // 获取当前登录医生的完整信息
            const meRes = await doctorApi.getDoctorMe();
            const doctorData = meRes && (meRes.data || meRes);
            console.log('[DoctorProfile] 医生数据:', doctorData);
            
            if (doctorData && doctorData.name) {
                setDoctor(doctorData);
                
                // 获取电话号码（从localStorage中的user信息）
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    try {
                        let userData = JSON.parse(userStr);
                        if (userData.user && userData.user.phone) {
                            setPhone(userData.user.phone);
                        } else if (userData.phone) {
                            setPhone(userData.phone);
                        }
                    } catch (e) {
                        console.warn('解析用户信息失败:', e);
                    }
                }
                
                // 初始化表单数据
                setFormData({
                    name: doctorData.name || '',
                    title: doctorData.title || '',
                    specialty: doctorData.specialty || '',
                    avatar: doctorData.avatar || '',
                    introduction: doctorData.introduction || '',
                    education: doctorData.education || '',
                    experience: doctorData.experience || '',
                    email: doctorData.email || '',
                    newPassword: '',
                    confirmPassword: ''
                });
            }
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
                newPassword: '',
                confirmPassword: ''
            });
            setPhone('13800138000');
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAvatarUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
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

            // 使用FileReader将图片转换为Data URL
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result;
                setFormData(prev => ({
                    ...prev,
                    avatar: dataUrl
                }));
                setError(null);
            };
            reader.onerror = () => {
                setError('文件读取失败');
            };
            reader.readAsDataURL(file);
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
        
        if (!verificationData.email) {
            errors.push('请输入邮箱地址');
        } else if (!validateEmail(verificationData.email)) {
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
            const response = await api.sendVerificationCode(verificationData.email);
            console.log('发送验证码响应:', response);
            // 如果Mock API返回了验证码，可以在开发环境中调试
            if (response && response.code) {
                console.log('调试信息 - 验证码:', response.code);
            }
            setError(null);
            setVerificationStep(2);
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
        
        if (!verificationData.code) {
            errors.push('请输入验证码');
        } else if (verificationData.code.trim().length === 0) {
            errors.push('验证码不能为空');
        }

        if (verificationData.newPassword && verificationData.newPassword !== verificationData.confirmPassword) {
            errors.push('两次输入的密码不一致');
        }

        if (errors.length > 0) {
            alert(errors.join('\n'));
            setError(errors[0]);
            return;
        }

        try {
            setError(null);
            setVerifying(true); // 显示验证中状态
            
            console.log('开始验证密码修改...');
            // 复用用户那边的 changePasswordWithCode 接口
            await api.changePasswordWithCode({
                old_password: '', // 医生不需要旧密码，用验证码代替
                new_password: verificationData.newPassword,
                email: verificationData.email,
                code: verificationData.code
            });
            
            console.log('验证成功，正在更新医生信息...');
            // 更新成功后，重新获取医生信息
            await fetchDoctorProfile();
            setShowEmailVerification(false);
            setVerificationStep(1);
            setVerificationData({
                email: '',
                code: '',
                newPassword: '',
                confirmPassword: ''
            });
            setCountdown(0); // 重置倒计时
            setVerifying(false);
            alert('✓ 密码修改成功，请妥善保管您的新密码');
            // 自动跳转到医生首页
            setTimeout(() => {
                navigate('/doctorDashboard');
            }, 1500);
        } catch (err) {
            setVerifying(false);
            console.error('验证和更新失败:', err.message);
            const errorMsg = err.message || '验证失败，请检查验证码是否正确';
            alert('验证失败：\n\n' + errorMsg);
            setError(errorMsg);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setError(null);
            const errors = [];
            
            // 验证必填字段
            if (!formData.name || formData.name.trim() === '') {
                errors.push('姓名不能为空');
            }
            
            if (!formData.title || formData.title.trim() === '') {
                errors.push('职称不能为空');
            }
            
            if (!formData.specialty || formData.specialty.trim() === '') {
                errors.push('专业方向不能为空');
            }

            // 如果有新邮箱，验证格式
            if (formData.email && formData.email !== (doctor?.email || '')) {
                if (!validateEmail(formData.email)) {
                    errors.push('请输入有效的邮箱地址（如：example@domain.com）');
                }
            }

            // 验证密码
            if (formData.newPassword || formData.confirmPassword) {
                if (formData.newPassword !== formData.confirmPassword) {
                    errors.push('两次输入的密码不一致');
                }
                if (formData.newPassword && formData.newPassword.length < 6) {
                    errors.push('密码长度不能少于6位');
                }
                if (formData.newPassword && !/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(formData.newPassword)) {
                    errors.push('密码包含不允许的字符');
                }
            }

            // 如果有错误，弹窗提示
            if (errors.length > 0) {
                alert('信息输入有误：\n\n' + errors.join('\n'));
                setError(errors[0]);
                return;
            }

            // 准备更新数据
            const updateData = {
                name: formData.name,
                title: formData.title,
                specialty: formData.specialty,
                introduction: formData.introduction,
                education: formData.education,
                experience: formData.experience
            };

            // 如果有头像链接更新
            if (formData.avatar) {
                updateData.avatar = formData.avatar;
            }

            // 如果有新邮箱，直接保存（不需要验证）
            if (formData.email && formData.email !== (doctor?.email || '')) {
                updateData.email = formData.email;
            }

            // 只有修改密码才需要邮箱验证
            if (formData.newPassword) {
                // 需要邮箱验证才能修改密码
                setVerificationData({
                    email: formData.email || doctor?.email || '',
                    code: '',
                    newPassword: formData.newPassword || '',
                    confirmPassword: formData.confirmPassword || ''
                });
                setShowEmailVerification(true);
                setVerificationStep(1);
                setCountdown(0); // 重置倒计时
                return;
            }

            // 直接保存其他信息
            const response = await doctorApi.updateDoctorProfile(updateData);
            console.log('医生信息更新响应:', response);

            // 如果API返回了完整数据，使用API数据；否则使用本地数据
            if (response && response.data) {
                setDoctor(response.data);
            } else if (response) {
                setDoctor(response);
            } else {
                setDoctor(prev => ({ ...prev, ...updateData }));
            }

            setIsEditing(false);
            alert('信息更新成功');
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
                {!isEditing && !showEmailVerification && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        编辑信息
                    </button>
                )}
            </div>

            {/* 错误提示 */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    {error}
                </div>
            )}

            {/* 显示模式 */}
            {!isEditing && !showEmailVerification && (
                <div className="space-y-6">
                    {/* 头部卡片 */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                        <div className="flex items-start gap-6">
                            <img
                                src={doctor?.avatar || 'https://i.pravatar.cc/150?u=doctor'}
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
            {isEditing && !showEmailVerification && (
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

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">邮箱地址</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleFormChange}
                                placeholder="请输入邮箱地址"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">邮箱地址将直接保存，格式：example@domain.com</p>
                        </div>

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
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">新密码</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleFormChange}
                                        placeholder="留空表示不修改密码"
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

            {/* 邮箱验证模式 */}
            {showEmailVerification && (
                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Mail size={24} className="text-cyan-600" />
                        邮箱验证
                    </h2>
                    <p className="text-slate-600 mb-6">
                        为了保护您的账户安全，修改密码需要进行验证。我们会向您的邮箱发送验证码。
                    </p>

                    {verificationStep === 1 && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                <p className="text-sm text-blue-900">
                                    您要修改密码，请输入邮箱地址以接收验证码。
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">邮箱地址</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={verificationData.email}
                                    onChange={handleVerificationChange}
                                    placeholder="请输入邮箱地址"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {verificationData.newPassword && (
                                <>
                                    <div className="border-t border-slate-200 pt-4">
                                        <p className="text-sm font-medium text-slate-700 mb-3">新密码信息</p>
                                        <div>
                                            <label className="block text-xs text-slate-600 mb-1">新密码</label>
                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={verificationData.newPassword}
                                                readOnly
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => {
                                        setShowEmailVerification(false);
                                        setIsEditing(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                                >
                                    <X size={18} />
                                    取消
                                </button>
                                <button
                                    onClick={handleSendVerificationCode}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    <Mail size={18} />
                                    发送验证码
                                </button>
                            </div>
                        </div>
                    )}

                    {verificationStep === 2 && (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                                <p className="text-sm text-green-900">
                                    验证码已发送到 <span className="font-bold">{verificationData.email}</span>，请检查您的邮箱并输入验证码。
                                </p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                                    <span>验证码</span>
                                    {countdown > 0 && <span className="text-red-600 font-bold">{countdown}秒</span>}
                                </label>
                                <input
                                    type="text"
                                    name="code"
                                    value={verificationData.code}
                                    onChange={handleVerificationChange}
                                    placeholder="请输入验证码（6位数字或字母）"
                                    maxLength="6"
                                    className="w-full px-3 py-2 text-center text-lg tracking-widest border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <p className="text-xs text-slate-500">如未收到验证码，请检查垃圾邮件或点击"返回"重新发送</p>

                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setVerificationStep(1)}
                                    disabled={verifying}
                                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    返回
                                </button>
                                <button
                                    onClick={handleVerifyAndUpdate}
                                    disabled={verifying}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save size={18} />
                                    {verifying ? '验证中...' : '验证并保存'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DoctorProfile;
