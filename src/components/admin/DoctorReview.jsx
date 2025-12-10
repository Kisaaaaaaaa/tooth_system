import React, { useEffect, useState } from 'react';
import adminApi from '../../api/admin';

const DoctorReview = () => {
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取待审核和已通过的医生列表
  const fetchDoctorData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 在真实场景中调用API
      // const pendingData = await adminApi.getPendingDoctors();
      // const approvedData = await adminApi.getApprovedDoctors();
      
      // 使用模拟数据
      const mockPending = [
        { id: 1, name: '张智齿', title: '主任医师', specialty: '复杂拔牙', appliedAt: Date.now() - 86400000, status: 'pending', avatar: 'https://i.pravatar.cc/150?u=1' },
        { id: 2, name: '李正畸', title: '副主任医师', specialty: '隐形矫正', appliedAt: Date.now() - 172800000, status: 'pending', avatar: 'https://i.pravatar.cc/150?u=2' },
        { id: 3, name: '王洁牙', title: '主治医师', specialty: '牙周治疗', appliedAt: Date.now() - 259200000, status: 'pending', avatar: 'https://i.pravatar.cc/150?u=3' }
      ];
      
      const mockApproved = [
        { id: 4, name: '赵种植', title: '教授', specialty: '全口种植', approvedAt: Date.now() - 345600000, status: 'approved', avatar: 'https://i.pravatar.cc/150?u=4' },
        { id: 5, name: '刘儿童', title: '主治医师', specialty: '儿童牙科', approvedAt: Date.now() - 432000000, status: 'approved', avatar: 'https://i.pravatar.cc/150?u=5' }
      ];
      
      setPending(mockPending);
      setApproved(mockApproved);
    } catch (err) {
      setError('获取医生数据失败');
      console.error('Error fetching doctor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, []);

  // 批准医生
  const approve = async (id) => {
    try {
      // 在真实场景中调用API
      // await adminApi.approveDoctor(id);
      
      // 模拟API调用
      const doc = pending.find(d => d.id === id);
      if (doc) {
        doc.status = 'approved';
        doc.approvedAt = Date.now();
        setApproved(prev => [doc, ...prev]);
        setPending(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      setError('批准医生失败');
      console.error('Error approving doctor:', err);
    }
  };

  // 拒绝医生
  const reject = async (id) => {
    try {
      // 在真实场景中调用API
      // await adminApi.rejectDoctor(id);
      
      // 模拟API调用
      setPending(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError('拒绝医生失败');
      console.error('Error rejecting doctor:', err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {error && (
        <div className="md:col-span-2 p-3 bg-rose-50 border border-rose-200 rounded text-rose-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-medium mb-4 pb-2 border-b">待审核医生 ({pending.length})</h3>
        <div className="space-y-3">
          {pending.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-lg mb-2">暂无待审核的医生</div>
              <div className="text-sm">医生注册申请将显示在此处</div>
            </div>
          ) : (
            pending.map(d => (
              <div key={d.id} className="p-3 border rounded-lg bg-slate-50 flex items-start gap-3 hover:shadow-sm transition-shadow">
                <div className="flex-shrink-0">
                  <img 
                    src={d.avatar} 
                    alt={d.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-lg">{d.name}</div>
                    <div className="text-xs px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full">{d.title}</div>
                  </div>
                  <div className="text-sm text-slate-600 mt-1">专长：{d.specialty}</div>
                  <div className="text-xs text-slate-400 mt-2">
                    申请于：{new Date(d.appliedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-2">
                  <button 
                    onClick={() => approve(d.id)} 
                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-700 transition-colors"
                  >
                    通过
                  </button>
                  <button 
                    onClick={() => reject(d.id)} 
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-100 transition-colors"
                  >
                    拒绝
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-medium mb-4 pb-2 border-b">已通过医生 ({approved.length})</h3>
        <div className="space-y-3">
          {approved.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-lg mb-2">暂无已通过的医生</div>
              <div className="text-sm">已通过审核的医生将显示在此处</div>
            </div>
          ) : (
            approved.map(d => (
              <div key={d.id} className="p-3 border rounded-lg bg-slate-50 flex items-start gap-3 hover:shadow-sm transition-shadow">
                <div className="flex-shrink-0">
                  <img 
                    src={d.avatar} 
                    alt={d.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-lg">{d.name}</div>
                    <div className="text-xs px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full">{d.title}</div>
                  </div>
                  <div className="text-sm text-slate-600 mt-1">专长：{d.specialty}</div>
                  <div className="text-xs text-slate-400 mt-2">
                    通过于：{new Date(d.approvedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="ml-2 text-xs text-slate-400">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">已通过</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorReview;
