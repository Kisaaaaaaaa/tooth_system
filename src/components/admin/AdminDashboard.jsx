import React, { useState } from 'react';
import DoctorReview from './DoctorReview';
import HospitalManagement from './HospitalManagement';
import UserManagement from './UserManagement';

const tabs = [
  { id: 'doctors', label: '医生审核' },
  { id: 'hospitals', label: '医院管理' },
  { id: 'users', label: '用户管理' },
];

const AdminDashboard = () => {
  const [active, setActive] = useState('doctors');

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">管理员面板</h2>
          <div className="text-sm text-slate-500">管理医生注册、医院与用户</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex gap-2 border-b pb-3 mb-4">
            {tabs.map(t => (
              <button
                key={t.id}
                className={`px-3 py-2 rounded ${active === t.id ? 'bg-cyan-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => setActive(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div>
            {active === 'doctors' && <DoctorReview />}
            {active === 'hospitals' && <HospitalManagement />}
            {active === 'users' && <UserManagement />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
