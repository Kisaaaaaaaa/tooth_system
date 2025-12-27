import React, { useEffect, useState } from 'react';
import { X, Phone, Mail, Briefcase, Award, MapPin } from 'lucide-react';
import adminApi from '../../api/admin';
import doctorApi from '../../api/doctors';
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
  const [hospitalsMap, setHospitalsMap] = useState({});
  const [detailModal, setDetailModal] = useState(null); // { id, doctor }
  const [detailLoading, setDetailLoading] = useState(false);

  // 获取待审核和已通过的医生列表
  const fetchDoctorData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 先获取医院列表用于ID到名称的映射
      const hospitalsResponse = await adminApi.getHospitals({ page_size: 500 });
      const hospitalsList = hospitalsResponse?.results || hospitalsResponse?.data?.results || [];
      const hospitalsMapping = {};
      hospitalsList.forEach(h => {
        if (h.id) hospitalsMapping[h.id] = h.name;
      });
      setHospitalsMap(hospitalsMapping);

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
        // 多种方式获取医院名称
        const hospitalName = doctor.hospital?.name 
          || doctor.hospital_name 
          || (doctor.hospital_id && hospitalsMapping[doctor.hospital_id])
          || null;
        
        return {
          id: doctor.id,
          name: doctor.name || '未命名医生',
          title: doctor.title || '医师',
          specialty: doctor.specialty || '全科',
          appliedAt: doctor.applied_at ? new Date(doctor.applied_at).getTime() : Date.now(),
          status: doctor.audit_status || 'pending',
          avatar: doctor.avatar || '/images/avatar-fallback.svg',
          phone: doctor.user?.phone || '',
          hospital: hospitalName,
          hospital_id: doctor.hospital_id,
          is_admin: doctor.is_admin || false
        };
      }).filter(item => item !== null);
      
      // 处理已通过医生数据
      const mappedApproved = (approvedList || []).map(doctor => {
        if (!doctor || typeof doctor !== 'object') {
          console.warn('无效的医生数据:', doctor);
          return null;
        }
        // 多种方式获取医院名称
        const hospitalName = doctor.hospital?.name 
          || doctor.hospital_name 
          || (doctor.hospital_id && hospitalsMapping[doctor.hospital_id])
          || null;
        
        return {
          id: doctor.id,
          name: doctor.name || '未命名医生',
          title: doctor.title || '医师',
          specialty: doctor.specialty || '全科',
          approvedAt: doctor.audited_at ? new Date(doctor.audited_at).getTime() : Date.now(),
          status: doctor.audit_status || 'approved',
          avatar: doctor.avatar || '/images/avatar-fallback.svg',
          phone: doctor.user?.phone || '',
          hospital: hospitalName,
          hospital_id: doctor.hospital_id,
          is_admin: doctor.is_admin || false
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

  // 设置医生为医院管理员
  const setAsAdmin = async (id) => {
    setError(null);
    setSuccess(null);
    setOperating(id);
    try {
      console.log('开始设置医生为管理员:', id);
      const result = await adminApi.setDoctorAsAdmin(id);
      console.log('设置结果:', result);
      
      setSuccess(`医生已设置为医院管理员`);
      
      // 重新获取数据
      await fetchDoctorData();
    } catch (err) {
      const errMsg = err.message || '设置医院管理员失败';
      setError(errMsg);
      console.error('Error setting doctor as admin:', err);
    } finally {
      setOperating(null);
    }
  };

  // 获取医生详细信息
  const fetchDoctorDetail = async (id) => {
    setDetailLoading(true);
    try {
      const result = await doctorApi.getDoctorDetail(id);
      console.log('医生详细信息:', result);
      const doctorData = result?.data || result;
      setDetailModal({ id, doctor: doctorData });
    } catch (err) {
      console.error('Error fetching doctor detail:', err);
      setError('获取医生详细信息失败');
    } finally {
      setDetailLoading(false);
    }
  };

  // 打开医生详细信息弹窗
  const openDoctorDetail = (doctorId) => {
    fetchDoctorDetail(doctorId);
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
              <div key={d.id} className="p-3 border rounded-lg bg-slate-50 flex items-start gap-3 hover:shadow-md transition-all cursor-pointer hover:border-cyan-300" onClick={() => openDoctorDetail(d.id)}>
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
                  <div className="text-xs text-slate-500 mt-1">
                    医院：{d.hospital ? (
                      <span className="font-medium text-cyan-700">{d.hospital}</span>
                    ) : (
                      <span className="text-amber-600">未分配</span>
                    )}
                  </div>
                  {d.phone && <div className="text-xs text-slate-500">电话：{d.phone}</div>}
                  <div className="text-xs text-slate-400 mt-2">
                    申请于：{new Date(d.appliedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      approve(d.id);
                    }} 
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
                    onClick={(e) => {
                      e.stopPropagation();
                      openRejectModal(d.id, d.name);
                    }} 
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
              <div key={d.id} className="p-3 border rounded-lg bg-slate-50 flex items-start gap-3 hover:shadow-md transition-all cursor-pointer hover:border-cyan-300" onClick={() => openDoctorDetail(d.id)}>
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
                    {d.is_admin && (
                      <div className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">管理员</div>
                    )}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">专长：{d.specialty}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    医院：{d.hospital ? (
                      <span className="font-medium text-cyan-700">{d.hospital}</span>
                    ) : (
                      <span className="text-amber-600">未分配</span>
                    )}
                  </div>
                  {d.phone && <div className="text-xs text-slate-500">电话：{d.phone}</div>}
                  <div className="text-xs text-slate-400 mt-2">
                    通过于：{new Date(d.approvedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs text-center">已通过</span>
                  {!d.is_admin && d.hospital_id && (
                    <button
                      onClick={() => setAsAdmin(d.id)}
                      disabled={operating === d.id}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        operating === d.id
                          ? 'bg-purple-400 text-white cursor-not-allowed opacity-75'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {operating === d.id ? '处理中...' : '设为管理员'}
                    </button>
                  )}
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

      {/* 医生详细信息弹窗 */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* 头部 */}
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold">医生详细信息</h3>
              <button
                onClick={() => setDetailModal(null)}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            {/* 内容 */}
            {detailLoading ? (
              <div className="p-8 text-center text-slate-400">
                <div className="text-lg mb-2">加载中...</div>
              </div>
            ) : detailModal.doctor ? (
              <div className="p-6 space-y-6">
                {/* 基本信息卡片 */}
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-6 flex gap-4">
                  <img
                    src={resolveMediaUrl(detailModal.doctor.avatar)}
                    alt={detailModal.doctor.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    onError={(e) => { e.currentTarget.src = '/images/avatar-fallback.svg'; }}
                  />
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-2xl font-bold text-slate-800">{detailModal.doctor.name}</h4>
                      {detailModal.doctor.is_admin && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">管理员</span>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm text-slate-600 mb-2">
                      <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded">{detailModal.doctor.title || '医师'}</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{detailModal.doctor.specialty || '全科'}</span>
                    </div>
                    {detailModal.doctor.hospital_name && (
                      <div className="text-sm text-slate-600 flex items-center gap-1">
                        <MapPin size={14} className="flex-shrink-0" />
                        {detailModal.doctor.hospital_name}
                      </div>
                    )}
                  </div>
                </div>

                {/* 联系信息 */}
                <div className="space-y-3">
                  <h5 className="font-semibold text-slate-800">联系信息</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {detailModal.doctor.user?.phone && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <Phone size={18} className="text-cyan-600 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-slate-500">电话</div>
                          <div className="text-sm font-medium text-slate-800">{detailModal.doctor.user.phone}</div>
                        </div>
                      </div>
                    )}
                    {detailModal.doctor.user?.email && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <Mail size={18} className="text-cyan-600 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-slate-500">邮箱</div>
                          <div className="text-sm font-medium text-slate-800">{detailModal.doctor.user.email}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 职业信息 */}
                <div className="space-y-3">
                  <h5 className="font-semibold text-slate-800">职业信息</h5>
                  <div className="space-y-3">
                    {detailModal.doctor.title && (
                      <div className="flex items-start gap-3">
                        <Award size={18} className="text-cyan-600 flex-shrink-0 mt-1" />
                        <div>
                          <div className="text-sm text-slate-600">职称</div>
                          <div className="font-medium text-slate-800">{detailModal.doctor.title}</div>
                        </div>
                      </div>
                    )}
                    {detailModal.doctor.specialty && (
                      <div className="flex items-start gap-3">
                        <Briefcase size={18} className="text-cyan-600 flex-shrink-0 mt-1" />
                        <div>
                          <div className="text-sm text-slate-600">专长</div>
                          <div className="font-medium text-slate-800">{detailModal.doctor.specialty}</div>
                        </div>
                      </div>
                    )}
                    {detailModal.doctor.introduction && (
                      <div className="flex items-start gap-3">
                        <div>
                          <div className="text-sm text-slate-600">简介</div>
                          <div className="font-medium text-slate-800">{detailModal.doctor.introduction}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 资质信息 */}
                {(detailModal.doctor.license_number || detailModal.doctor.qualification || detailModal.doctor.experience_years) && (
                  <div className="space-y-3 border-t pt-4">
                    <h5 className="font-semibold text-slate-800">资质信息</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {detailModal.doctor.license_number && (
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-xs text-slate-500">执业证号</div>
                          <div className="text-sm font-medium text-slate-800">{detailModal.doctor.license_number}</div>
                        </div>
                      )}
                      {detailModal.doctor.qualification && (
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-xs text-slate-500">学历</div>
                          <div className="text-sm font-medium text-slate-800">{detailModal.doctor.qualification}</div>
                        </div>
                      )}
                      {detailModal.doctor.experience_years && (
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-xs text-slate-500">从业年限</div>
                          <div className="text-sm font-medium text-slate-800">{detailModal.doctor.experience_years}年</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <div className="text-lg">无法加载医生信息</div>
              </div>
            )}

            {/* 关闭按钮 */}
            <div className="border-t p-6 bg-slate-50 flex justify-end">
              <button
                onClick={() => setDetailModal(null)}
                className="px-6 py-2 rounded-lg bg-slate-300 text-slate-700 hover:bg-slate-400 transition"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorReview;
