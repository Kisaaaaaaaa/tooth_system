import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, UserCog, Building2, Users, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const role = typeof localStorage !== 'undefined' ? (localStorage.getItem('role') || (() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const u = JSON.parse(raw);
      return u?.role ?? null;
    } catch {
      return null;
    }
  })()) : null;

  // 获取 is_admin 字段
  const isAdmin = typeof localStorage !== 'undefined' ? (() => {
    try {
      const isAdminStr = localStorage.getItem('is_admin');
      if (isAdminStr === 'true') return true;
      
      const raw = localStorage.getItem('user');
      if (!raw) return false;
      const u = JSON.parse(raw);
      return u?.is_admin === true || u?.is_admin === 'true';
    } catch {
      return false;
    }
  })() : false;

  // 允许 role === 'admin' 或 is_admin === true 的用户访问
  const hasAdminAccess = role === 'admin' || isAdmin;

  if (!hasAdminAccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">无权访问</h2>
          <p className="text-slate-600 mb-6">仅管理员可访问此页面</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
          >
            返回登录
          </button>
        </div>
      </div>
    );
  }

  const items = [
    { to: '/admin', label: '总览', icon: LayoutDashboard, exact: true },
    { to: '/admin/doctors', label: '医生审核', icon: UserCog },
    { to: '/admin/hospitals', label: '医院管理', icon: Building2 },
    { to: '/admin/users', label: '用户管理', icon: Users },
  ];

  const onLogout = () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('is_admin');
      window.dispatchEvent(new Event('localStorageUpdated'));
    } catch {}
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* 内容区 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-5">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
