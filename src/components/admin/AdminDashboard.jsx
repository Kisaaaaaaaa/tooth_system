import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCog, Building2, Users } from 'lucide-react';

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

const AdminDashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">管理员总览</h2>
        <p className="text-slate-500 text-sm mt-1">快速进入各管理模块</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card icon={UserCog} title="医生审核" desc="审核医生资质与入驻信息" onClick={() => navigate('/admin/doctors')} />
        <Card icon={Building2} title="医院管理" desc="维护医院信息与状态" onClick={() => navigate('/admin/hospitals')} />
        <Card icon={Users} title="用户管理" desc="管理患者和医生账户" onClick={() => navigate('/admin/users')} />
      </div>

      <div className="text-xs text-slate-400">提示：后续可在此处添加数据概览与待办提醒。</div>
    </div>
  );
};

export default AdminDashboard;
