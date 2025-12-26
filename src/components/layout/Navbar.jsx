import React, { useEffect, useState } from 'react';
import api from '../../api/auth';
import { resolveMediaUrl } from '../../api/utils';
import { getDoctorAudits } from '../../api/admin';
import { Smile, HelpCircle } from 'lucide-react';
import GuideModal from '../common/GuideModal';

// 顶部导航栏组件
const Navbar = ({ currentPage, navigateTo }) => {
    // 用户端菜单
    const userPageLabels = {
        'home': '首页',
        'model3d': '3D模型',
        'hospitals': '医院',
        'doctors': '医生',
        'consultation': '问诊',
        'appointment': '预约记录',
        'records': '病历',
        'aiInquiry': 'AI问询'
    };

    // 医生端菜单
    const doctorPageLabels = {
        'doctorMySchedule': '我的排班',
        'doctorAppointments': '预约管理',
        'doctorRecords': '病例管理',
        'doctorConsultation': '在线问诊',
        'doctorProfile': '个人信息'
    };

    // 管理员医生额外菜单
    const adminDoctorPageLabels = {
        'doctorSchedule': '排班管理'
    };

    // 管理员菜单（顶部导航快捷入口）
    const adminPageLabels = {
        'admin': '总览',
        'admin/doctors': '医生审核',
        'admin/hospitals': '医院管理',
        'admin/users': '用户管理'
    };

    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [pendingDoctorsCount, setPendingDoctorsCount] = useState(0);
    const [showGuide, setShowGuide] = useState(false);

    // 检查登录状态
    const checkLoginStatus = () => {
        // 确保localStorage在浏览器环境中可用
        if (typeof localStorage === 'undefined') {
            console.log('[Navbar] localStorage不可用');
            setUser(null);
            setRole(null);
            return;
        }

        // 同时检查access_token和authToken
        const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
        const rawUser = localStorage.getItem('user');
        const userRole = localStorage.getItem('role');

        console.log('[Navbar] 检查登录状态:', { token: !!token, user: !!rawUser, role: userRole, rawUser });

        if (rawUser) {
            try {
                let parsedUser = JSON.parse(rawUser);
                console.log('[Navbar] 解析后的用户信息:', parsedUser);

                // 如果解析出的对象包含 token 字段且有嵌套的 user 对象，则提取真正的 user 对象
                if (parsedUser.token && parsedUser.user && typeof parsedUser.user === 'object') {
                    console.log('[Navbar] 检测到嵌套的user对象，提取真正的user');
                    parsedUser = parsedUser.user;
                }

                // 优先使用后端返回的 role，其次才是 localStorage 中保存的 role
                const finalRole = parsedUser.role || userRole || 'user';
                console.log('[Navbar] 最终设置的role:', finalRole, '(来自parsedUser.role:', parsedUser.role, ')');
                setUser(parsedUser);
                setRole(finalRole);
            } catch (e) {
                console.error('[Navbar] 解析用户信息失败:', e);
                setUser(null);
                setRole(null);
                localStorage.removeItem('user');
            }
        } else {
            console.log('[Navbar] 未找到用户信息，设置为未登录');
            setUser(null);
            setRole(null);
        }
    };

    // 获取待审核医生数量
    const fetchPendingDoctorsCount = async () => {
        if (role !== 'admin') return;

        try {
            const result = await getDoctorAudits({ status: 'pending', page: 1, page_size: 1 });
            if (result && typeof result.count === 'number') {
                setPendingDoctorsCount(result.count);
                console.log('[Navbar] 待审核医生数量:', result.count);
            }
        } catch (error) {
            console.error('[Navbar] 获取待审核医生数量失败:', error);
        }
    };

    useEffect(() => {
        // 组件挂载时检查登录状态
        console.log('[Navbar] 组件挂载，首次检查登录状态');
        checkLoginStatus();
        // 首次访问自动弹出新手指南（仅一次）
        try {
            const seen = localStorage.getItem('onboarding_seen_v1');
            if (!seen) {
                setTimeout(() => setShowGuide(true), 300);
            }
        } catch (e) {
            // ignore storage errors
        }

        const onStorage = (e) => {
            console.log('[Navbar] 检测到 storage/localStorageUpdated 事件:', e.type, e.key);
            // 自定义事件没有 key 属性，所以需要特别处理
            if (!e || !e.key || e.key === 'user' || e.key === 'authToken' || e.key === 'access_token' || e.key === 'role' || e.type === 'localStorageUpdated') {
                console.log('[Navbar] 触发 checkLoginStatus');
                checkLoginStatus();
            }
        };

        // 监听 localStorage 的 storage 事件（跨窗口）和自定义事件（同窗口）
        window.addEventListener('storage', onStorage);
        window.addEventListener('localStorageUpdated', onStorage);

        // 也监听窗口聚焦事件，确保状态同步
        const onFocus = () => {
            checkLoginStatus();
        };
        window.addEventListener('focus', onFocus);

        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('localStorageUpdated', onStorage);
            window.removeEventListener('focus', onFocus);
        };
    }, []);

    // 当角色变为管理员时，获取待审核医生数量
    useEffect(() => {
        if (role === 'admin') {
            fetchPendingDoctorsCount();

            // 每30秒刷新一次待审核数量
            const interval = setInterval(fetchPendingDoctorsCount, 30000);

            // 监听医生审核更新事件
            const handleAuditUpdate = () => {
                console.log('[Navbar] 检测到医生审核更新，刷新待审核数量');
                fetchPendingDoctorsCount();
            };
            window.addEventListener('doctorAuditUpdated', handleAuditUpdate);

            return () => {
                clearInterval(interval);
                window.removeEventListener('doctorAuditUpdated', handleAuditUpdate);
            };
        }
    }, [role]);

    const handleLogout = async () => {
        console.log('=== Navbar登出函数开始执行 ===');
        console.log('登出前localStorage状态:', {
            authToken: localStorage.getItem('authToken'),
            user: localStorage.getItem('user')
        });

        try {
            console.log('调用api.logout()');
            await api.logout();
            console.log('api.logout()调用完成');
        } catch (e) {
            console.error('api.logout()调用失败:', e);
            // ignore server error, still clear client state
        }

        console.log('重置用户状态');
        setUser(null);
        setRole(null);
        localStorage.removeItem('role');

        console.log('跳转到首页');
        navigateTo('');
        console.log('=== Navbar登出函数执行结束 ===');
    };

    return (
        <>
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('')}>
                    <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
                        <Smile size={20} />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-800">牙科预约管理系统</span>
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <div className="hidden md:flex gap-6 text-sm font-medium text-slate-500 items-center">
                        {role === 'admin'
                            ? Object.entries(adminPageLabels).map(([page, label]) => (
                                <button
                                    key={page}
                                    onClick={() => navigateTo(page)}
                                    className={`hover:text-cyan-600 transition relative ${currentPage === page ? 'text-cyan-600 font-bold' : ''}`}
                                >
                                    {label}
                                    {/* 医生审核页面显示待审核数量红点 */}
                                    {page === 'admin/doctors' && pendingDoctorsCount > 0 && (
                                        <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-bold shadow-md">
                                            {pendingDoctorsCount > 99 ? '99+' : pendingDoctorsCount}
                                        </span>
                                    )}
                                </button>
                            ))
                            : role === 'doctor'
                                ? (
                                    <>
                                        {Object.entries(doctorPageLabels).map(([page, label]) => (
                                            <button
                                                key={page}
                                                onClick={() => navigateTo(page)}
                                                className={`hover:text-cyan-600 transition ${currentPage === page ? 'text-cyan-600 font-bold' : ''}`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                        {/* 管理员医生额外显示排班管理 */}
                                        {user?.is_admin && Object.entries(adminDoctorPageLabels).map(([page, label]) => (
                                            <button
                                                key={page}
                                                onClick={() => navigateTo(page)}
                                                className={`hover:text-cyan-600 transition ${currentPage === page ? 'text-cyan-600 font-bold' : ''}`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </>
                                )
                                : ['home', 'model3d', 'hospitals', 'doctors', 'consultation', 'appointment', 'records', 'aiInquiry'].map(page => (
                                    <button
                                        key={page}
                                        onClick={() => navigateTo(page)}
                                        className={`hover:text-cyan-600 transition ${currentPage === page ? 'text-cyan-600 font-bold' : ''}`}
                                    >
                                        {userPageLabels[page]}
                                    </button>
                                ))
                        }
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* 按钮在所有屏幕显示，登录状态以 authToken 或 user 判断 */}
                    <div className="flex items-center gap-3">
                        {/* 使用指南入口 */}
                        <button
                            onClick={() => setShowGuide(true)}
                            className="hidden md:inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded border border-slate-200 hover:bg-slate-50 transition text-slate-700"
                            title="使用指南"
                        >
                            <HelpCircle size={16} /> 使用指南
                        </button>


                        { /* 修复登录状态判断，确保能正确检测到登录状态 */}
                        {user ? (
                            <>
                                <button onClick={handleLogout} className="text-sm px-3 py-1 rounded border border-slate-200 hover:bg-slate-50 transition">登出</button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigateTo('login')}
                                    className="text-sm px-3 py-1 rounded hover:bg-slate-100 transition"
                                >
                                    登录
                                </button>

                                <button
                                    onClick={() => navigateTo('register')}
                                    className="text-sm px-3 py-1 rounded bg-cyan-600 text-white hover:bg-cyan-700 transition"
                                >
                                    注册
                                </button>
                            </>
                        )}
                    </div>

                    <div
                        onClick={() => {
                            if (user) {
                                if (role === 'admin') {
                                    navigateTo('admin'); // 管理员点击头像直接跳转到管理面板
                                } else if (role === 'doctor') {
                                    navigateTo('doctorDashboard'); // 医生点击头像直接跳转到首页
                                } else {
                                    navigateTo('profile');
                                }
                            } else {
                                navigateTo('login');
                            }
                        }}
                        className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300 cursor-pointer"
                        title={user ? (user.name || (user.user && user.user.name) || user.phone || (user.user && user.user.phone)) : '登录'}
                    >
                        <img
                            src={
                                user && (user.avatar || (user.user && user.user.avatar))
                                    ? resolveMediaUrl(user.avatar || (user.user && user.user.avatar))
                                    : '/images/avatar-fallback.svg'
                            }
                            alt={user ? (user.name || (user.user && user.user.name) || user.phone || (user.user && user.user.phone)) : '默认头像'}
                            className="object-cover w-full h-full"
                            onError={(e) => { e.currentTarget.src = '/images/avatar-fallback.svg'; }}
                        />
                    </div>
                </div>
            </div>
        </nav>
        {/* 新手指南弹窗 */}
        <GuideModal
            open={showGuide}
            onClose={() => setShowGuide(false)}
            role={role || 'user'}
            onNavigate={(page) => {
                setShowGuide(false);
                navigateTo(page);
            }}
        />
        </>
    );
};

export default Navbar;

