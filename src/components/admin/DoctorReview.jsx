import React, { useEffect, useState } from 'react';
import adminApi from '../../api/admin';
import { resolveMediaUrl } from '../../api/utils';

const DoctorReview = () => {
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [operating, setOperating] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // { id, doctorName }
  const [rejectReason, setRejectReason] = useState('');

  // 获取待审核和已通过的医生列表
  const fetchDoctorData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 调用真实API获取数据
      const pendingResponse = await adminApi.getDoctorAudits({ status: 'pending', page: 1, page_size: 100 });
      const approvedResponse = await adminApi.getDoctorAudits({ status: 'approved', page: 1, page_size: 100 });
      
      console.log('待审核响应:', pendingResponse);
      console.log('已通过响应:', approvedResponse);
      
      // 提取 results 数组
      const pendingList = pendingResponse?.results || [];
      const approvedList = approvedResponse?.results || [];
      
      console.log('待审核医生列表:', pendingList);
      console.log('已通过医生列表:', approvedList);
      
      // 确保都是数组
      if (!Array.isArray(pendingList)) {
        console.error('待审核列表不是数组:', typeof pendingList, pendingList);
        throw new Error('待审核列表数据格式错误');
      }
      if (!Array.isArray(approvedList)) {
        console.error('已通过列表不是数组:', typeof approvedList, approvedList);
        throw new Error('已通过列表数据格式错误');
      }
      
      // 处理待审核医生数据
      const mappedPending = (pendingList || []).map(doctor => {
        if (!doctor || typeof doctor !== 'object') {
          console.warn('无效的医生数据:', doctor);
          return null;
        }
        return {
          id: doctor.id,
          name: doctor.name || '未命名医生',
          title: doctor.title || '医师',
          specialty: doctor.specialty || '全科',
          appliedAt: doctor.applied_at ? new Date(doctor.applied_at).getTime() : Date.now(),
          status: doctor.audit_status || 'pending',
          avatar: doctor.avatar || '/images/avatar-fallback.svg',
          phone: doctor.user?.phone || '',
          hospital: doctor.hospital?.name || '未分配医院'
        };
      }).filter(item => item !== null);
      
      // 处理已通过医生数据
      const mappedApproved = (approvedList || []).map(doctor => {
        if (!doctor || typeof doctor !== 'object') {
          console.warn('无效的医生数据:', doctor);
          return null;
        }
        return {
          id: doctor.id,
          name: doctor.name || '未命名医生',
          title: doctor.title || '医师',
          specialty: doctor.specialty || '全科',
          approvedAt: doctor.audited_at ? new Date(doctor.audited_at).getTime() : Date.now(),
          status: doctor.audit_status || 'approved',
          avatar: doctor.avatar || '/images/avatar-fallback.svg',
          phone: doctor.user?.phone || '',
          hospital: doctor.hospital?.name || '未分配医院'
        };
      }).filter(item => item !== null);
      
      console.log('映射后的待审核医生:', mappedPending);
      console.log('映射后的已通过医生:', mappedApproved);
      
      setPending(mappedPending);
      setApproved(mappedApproved);
    } catch (err) {
      setError(err.message || '获取医生数据失败');
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
    setError(null);
    setSuccess(null);
    setOperating(id);
    try {
      console.log('开始批准医生:', id);
      const result = await adminApi.approveDoctor(id);
      console.log('批准结果:', result);
      
      setSuccess(`医生已批准通过`);
      
      // 重新获取数据
      await fetchDoctorData();
      
      // 触发自定义事件，通知导航栏更新待审核数量
      window.dispatchEvent(new CustomEvent('doctorAuditUpdated'));
    } catch (err) {
      const errMsg = err.message || '批准医生失败';
      setError(errMsg);
      console.error('Error approving doctor:', err);
    } finally {
      setOperating(null);
    }
  };

  // 拒绝医生（打开模态框）
  const openRejectModal = (id, doctorName) => {
    setRejectModal({ id, doctorName });
    setRejectReason('');
  };

  // 确认拒绝医生
  const confirmReject = async () => {
    if (!rejectModal) return;
    
    setError(null);
    setSuccess(null);
    setOperating(rejectModal.id);
    try {
      console.log('开始拒绝医生:', rejectModal.id, '原因:', rejectReason);
      const result = await adminApi.rejectDoctor(rejectModal.id, rejectReason || '不符合要求');
      console.log('拒绝结果:', result);
      
      setSuccess(`医生已被拒绝`);
      setRejectModal(null);
      setRejectReason('');
      
      // 重新获取数据
      await fetchDoctorData();
      
      // 触发自定义事件，通知导航栏更新待审核数量
      window.dispatchEvent(new CustomEvent('doctorAuditUpdated'));
    } catch (err) {
      const errMsg = err.message || '拒绝医生失败';
      setError(errMsg);
      console.error('Error rejecting doctor:', err);
    } finally {
      setOperating(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {error && (
        <div className="md:col-span-2 p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">✕</button>
        </div>
      )}
      
      {success && (
        <div className="md:col-span-2 p-3 bg-green-50 border border-green-200 rounded text-green-700 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">✕</button>
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
                    src={resolveMediaUrl(d.avatar)} 
                    alt={d.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    onError={(e) => { e.currentTarget.src = '/images/avatar-fallback.svg'; }}
                  />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-lg">{d.name}</div>
                    <div className="text-xs px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full">{d.title}</div>
                  </div>
                  <div className="text-sm text-slate-600 mt-1">专长：{d.specialty}</div>
                  {d.hospital && <div className="text-xs text-slate-500 mt-1">医院：{d.hospital}</div>}
                  {d.phone && <div className="text-xs text-slate-500">电话：{d.phone}</div>}
                  <div className="text-xs text-slate-400 mt-2">
                    申请于：{new Date(d.appliedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-2">
                  <button 
                    onClick={() => approve(d.id)} 
                    disabled={operating === d.id}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      operating === d.id 
                        ? 'bg-cyan-400 text-white cursor-not-allowed opacity-75' 
                        : 'bg-cyan-600 text-white hover:bg-cyan-700'
                    }`}
                  >
                    {operating === d.id ? '处理中...' : '通过'}
                  </button>
                  <button 
                    onClick={() => openRejectModal(d.id, d.name)} 
                    disabled={operating === d.id}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      operating === d.id 
                        ? 'border border-slate-300 text-slate-400 cursor-not-allowed opacity-75' 
                        : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {operating === d.id ? '处理中...' : '拒绝'}
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
                    src={resolveMediaUrl(d.avatar)} 
                    alt={d.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    onError={(e) => { e.currentTarget.src = '/images/avatar-fallback.svg'; }}
                  />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-lg">{d.name}</div>
                    <div className="text-xs px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full">{d.title}</div>
                  </div>
                  <div className="text-sm text-slate-600 mt-1">专长：{d.specialty}</div>
                  {d.hospital && <div className="text-xs text-slate-500 mt-1">医院：{d.hospital}</div>}
                  {d.phone && <div className="text-xs text-slate-500">电话：{d.phone}</div>}
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

      {/* 拒绝医生模态框 */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">拒绝医生申请</h3>
            <p className="text-slate-600 text-sm mb-4">医生：{rejectModal.doctorName}</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">拒绝原因</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入拒绝原因（选填，默认：不符合要求）"
                maxLength={200}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                rows={4}
              />
              <div className="text-xs text-slate-500 mt-1">{rejectReason.length}/200</div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
              >
                取消
              </button>
              <button
                onClick={confirmReject}
                disabled={operating === rejectModal.id}
                className="flex-1 px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition disabled:bg-rose-400"
              >
                {operating === rejectModal.id ? '处理中...' : '确认拒绝'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorReview;
