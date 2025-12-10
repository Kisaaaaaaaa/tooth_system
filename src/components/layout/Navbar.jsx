import React, { useEffect, useState } from 'react';
import api from '../../api/auth';

// 顶部导航栏组件
const Navbar = ({ currentPage, navigateTo }) => {
    const pageLabels = {
        'home': '首页',
        'model3d': '3D模型',
        'hospitals': '医院',
        'doctors': '医生',
        'consultation': '问诊',
        'appointment': '预约',
        'records': '病历',
        'aiInquiry': 'AI问询'
    };

    const [user, setUser] = useState(null);

    // 检查登录状态
    const checkLoginStatus = () => {
        // 确保localStorage在浏览器环境中可用
        if (typeof localStorage === 'undefined') {
            console.log('localStorage不可用');
            setUser(null);
            return;
        }
        
        // 同时检查access_token和authToken
        const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
        const rawUser = localStorage.getItem('user');
        
        console.log('检查登录状态:', { token: !!token, user: !!rawUser });
        
        if (rawUser) {
            try { 
                const parsedUser = JSON.parse(rawUser);
                console.log('解析后的用户信息:', parsedUser);
                setUser(parsedUser); 
            } catch (e) {
                console.error('解析用户信息失败:', e);
                setUser(null);
                localStorage.removeItem('user');
            }
        } else {
            setUser(null);
        }
    };

    useEffect(() => {
        // 组件挂载时检查登录状态
        checkLoginStatus();

        const onStorage = (e) => {
            if (e.key === 'user' || e.key === 'authToken' || e.key === 'access_token') {
                checkLoginStatus();
            }
        };
        
        // 监听localStorage变化
        window.addEventListener('storage', onStorage);
        
        // 也监听窗口聚焦事件，确保状态同步
        const onFocus = () => {
            checkLoginStatus();
        };
        window.addEventListener('focus', onFocus);
        
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('focus', onFocus);
        };
    }, []);

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
        
        console.log('跳转到首页');
        navigateTo('home');
        console.log('=== Navbar登出函数执行结束 ===');
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('home')}>
                    <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/30">
                        D
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-800">未来诊所</span>
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <div className="hidden md:flex gap-6 text-sm font-medium text-slate-500 items-center">
                        {['home', 'model3d', 'hospitals', 'doctors', 'consultation', 'appointment', 'records', 'aiInquiry'].map(page => (
                            <button
                                key={page}
                                onClick={() => navigateTo(page)}
                                className={`hover:text-cyan-600 transition ${currentPage === page ? 'text-cyan-600 font-bold' : ''}`}
                            >
                                {pageLabels[page]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* 按钮在所有屏幕显示，登录状态以 authToken 或 user 判断 */}
                    <div className="flex items-center gap-3">
                        {/* 管理员入口（始终显示，方便查看界面） */}
                        <button onClick={() => navigateTo('admin')} className="text-sm px-3 py-1 rounded bg-slate-100 hover:bg-slate-50">管理员</button>
                        
                        { /* 修复登录状态判断，确保能正确检测到登录状态 */ }
                        { typeof localStorage !== 'undefined' && (localStorage.getItem('access_token') || localStorage.getItem('authToken')) ? (
                            <>
                                <span className="text-sm text-slate-700">{user ? (user.name || user.phone) : '已登录'}</span>
                                <button onClick={handleLogout} className="text-sm px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition">登出</button>
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

                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                        <img
                            src={user && user.avatar ? user.avatar : 'https://i.pravatar.cc/150?u=user'}
                            alt={user && (user.name || user.phone) ? (user.name || user.phone) : 'User'}
                            className="object-cover w-full h-full"
                        />
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

