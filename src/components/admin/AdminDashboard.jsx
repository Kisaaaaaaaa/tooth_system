import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCog, Building2, Users, TrendingUp, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import adminApi from '../../api/admin';

const Card = ({ icon: Icon, title, desc, to, onClick }) => (
  <button
    onClick={onClick}
    className="text-left p-5 rounded-xl border border-slate-200 hover:border-cyan-200 hover:shadow-sm transition bg-white"
  >
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 rounded-lg bg-cyan-50 text-cyan-700"><Icon size={18} /></div>
      <div className="font-semibold">{title}</div>
    </div>
    <div className="text-sm text-slate-500">{desc}</div>
  </button>
);

const StatCard = ({ icon: Icon, title, value, trend, color = 'cyan' }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-lg bg-${color}-50 text-${color}-600`}>
        <Icon size={20} />
      </div>
      {trend && (
        <span className={`text-xs px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600'}`}>
          {trend > 0 ? `+${trend}` : trend}
        </span>
      )}
    </div>
    <div className="text-2xl font-bold text-slate-900">{value}</div>
    <div className="text-sm text-slate-500 mt-1">{title}</div>
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingDoctors: 0,
    totalDoctors: 0,
    totalHospitals: 0,
    totalUsers: 0,
    loading: true
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [pendingRes, approvedRes, hospitalsRes, usersRes] = await Promise.all([
        adminApi.getDoctorAudits({ status: 'pending', page: 1, page_size: 1 }).catch(() => ({ count: 0 })),
        adminApi.getDoctorAudits({ status: 'approved', page: 1, page_size: 1 }).catch(() => ({ count: 0 })),
        adminApi.getHospitals({ page: 1, page_size: 1 }).catch(() => ({ count: 0 })),
        adminApi.getUsers({ page: 1, page_size: 1, role: 'user' }).catch(() => ({ count: 0 }))
      ]);

      setStats({
        pendingDoctors: pendingRes?.count || 0,
        totalDoctors: approvedRes?.count || 0,
        totalHospitals: hospitalsRes?.count || 0,
        totalUsers: usersRes?.count || 0,
        loading: false
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">管理员总览</h2>
        <p className="text-slate-500 text-sm mt-1">系统运营概况与快捷入口</p>
      </div>

      {/* 统计数据卡片 */}
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-3">数据概览</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={AlertCircle} 
            title="待审核医生" 
            value={stats.loading ? '-' : stats.pendingDoctors}
            color="rose"
          />
          <StatCard 
            icon={CheckCircle} 
            title="已通过医生" 
            value={stats.loading ? '-' : stats.totalDoctors}
            color="green"
          />
          <StatCard 
            icon={Building2} 
            title="合作医院" 
            value={stats.loading ? '-' : stats.totalHospitals}
            color="blue"
          />
          <StatCard 
            icon={Users} 
            title="注册用户" 
            value={stats.loading ? '-' : stats.totalUsers}
            color="purple"
          />
        </div>
      </div>

      {/* 管理模块 */}
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-3">管理模块</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card icon={UserCog} title="医生审核" desc="审核医生资质与入驻信息" onClick={() => navigate('/admin/doctors')} />
          <Card icon={Building2} title="医院管理" desc="维护医院信息与状态" onClick={() => navigate('/admin/hospitals')} />
          <Card icon={Users} title="用户管理" desc="管理患者和医生账户" onClick={() => navigate('/admin/users')} />
        </div>
      </div>

      {/* 待办事项提醒 */}
      {stats.pendingDoctors > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600 flex-shrink-0">
              <Calendar size={18} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">待办提醒</h3>
              <p className="text-sm text-amber-700">
                当前有 <span className="font-bold">{stats.pendingDoctors}</span> 位医生等待审核，
                <button 
                  onClick={() => navigate('/admin/doctors')}
                  className="text-amber-800 underline hover:text-amber-900 ml-1"
                >
                  立即处理
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
