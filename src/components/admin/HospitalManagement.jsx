import React, { useEffect, useState } from 'react';
import adminApi from '../../api/admin';
import { MapPin, Phone, Clock, FileText, Image, X, Map, Building2, UserPlus } from 'lucide-react';
import MapSelector from './MapSelector';

const HospitalManagement = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  // 视图切换：form 或 list
  const [view, setView] = useState('form');
  
  // 添加医院表单
  const [showAddForm, setShowAddForm] = useState(false);
  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    image: '',
    description: '',
    business_hours: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  // 分配医生功能
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [approvedDoctors, setApprovedDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // 筛选功能
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHospitals, setFilteredHospitals] = useState([]);

  // 获取医院列表
  const fetchHospitals = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getHospitals({ page, page_size: 10 });
      setHospitals(data.results || []);
      setTotalCount(data.count || 0);
      setCurrentPage(page);
    } catch (err) {
      setError('获取医院列表失败，请重试');
      console.error('Error fetching hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals(1);
  }, []);

  // 筛选医院列表
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredHospitals(hospitals);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = hospitals.filter(hospital => 
      hospital.name?.toLowerCase().includes(term) ||
      hospital.address?.toLowerCase().includes(term) ||
      hospital.phone?.toLowerCase().includes(term) ||
      hospital.description?.toLowerCase().includes(term)
    );
    setFilteredHospitals(filtered);
  }, [hospitals, searchTerm]);

  // 获取已通过审核的医生列表
  const fetchApprovedDoctors = async () => {
    try {
      const data = await adminApi.getApprovedDoctors();
      console.log('[HospitalManagement] 已通过审核的医生:', data);
      // 确保返回的是数组
      const doctorList = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
      setApprovedDoctors(doctorList);
    } catch (err) {
      console.error('获取医生列表失败:', err);
      setApprovedDoctors([]);
    }
  };

  // 打开分配医生模态框
  const openAssignModal = (hospital) => {
    setSelectedHospital(hospital);
    setSelectedDoctorId('');
    setShowAssignModal(true);
    fetchApprovedDoctors();
  };

  // 分配医生到医院
  const handleAssignDoctor = async () => {
    if (!selectedDoctorId || !selectedHospital) {
      setError('请选择医生');
      return;
    }

    setIsAssigning(true);
    setError(null);
    setSuccess(null);

    try {
      await adminApi.assignDoctorToHospital(parseInt(selectedDoctorId), selectedHospital.id);
      setSuccess(`成功为 ${selectedHospital.name} 分配医生`);
      setShowAssignModal(false);
      setSelectedHospital(null);
      setSelectedDoctorId('');
    } catch (err) {
      setError(err.message || '分配医生失败');
      console.error('分配医生失败:', err);
    } finally {
      setIsAssigning(false);
    }
  };

  // 验证表单
  const validateForm = () => {
    if (!hospitalForm.name.trim()) {
      setError('请输入医院名称');
      return false;
    }
    if (!hospitalForm.address.trim()) {
      setError('请输入医院地址');
      return false;
    }
    if (!hospitalForm.phone.trim()) {
      setError('请输入联系电话');
      return false;
    }
    if (!hospitalForm.business_hours.trim()) {
      setError('请输入营业时间');
      return false;
    }
    if (hospitalForm.latitude && isNaN(parseFloat(hospitalForm.latitude))) {
      setError('纬度必须是数字');
      return false;
    }
    if (hospitalForm.longitude && isNaN(parseFloat(hospitalForm.longitude))) {
      setError('经度必须是数字');
      return false;
    }
    return true;
  };

  // 添加医院
  const handleAddHospital = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const hospitalData = {
        name: hospitalForm.name.trim(),
        address: hospitalForm.address.trim(),
        latitude: hospitalForm.latitude ? parseFloat(hospitalForm.latitude) : 0,
        longitude: hospitalForm.longitude ? parseFloat(hospitalForm.longitude) : 0,
        image: hospitalForm.image.trim(),
        description: hospitalForm.description.trim(),
        business_hours: hospitalForm.business_hours.trim(),
        phone: hospitalForm.phone.trim()
      };
      
      await adminApi.addHospital(hospitalData);
      
      setSuccess('医院添加成功！');
      setHospitalForm({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        image: '',
        description: '',
        business_hours: '',
        phone: ''
      });
      setShowAddForm(false);
      
      // 刷新列表
      await fetchHospitals(1);
    } catch (err) {
      setError('添加医院失败，请检查输入或稍后重试');
      console.error('Error adding hospital:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 重置表单
  const handleResetForm = () => {
    setHospitalForm({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      image: '',
      description: '',
      business_hours: '',
      phone: ''
    });
    setError(null);
  };

  // 处理地图选择的坐标和医院信息
  const handleMapSelect = (location) => {
    // 如果高德地图提供了医院信息，自动填充
    const poiData = location.poiData || {};
    
    // 提取第一张照片的URL
    const firstPhotoUrl = poiData.photos && poiData.photos.length > 0 
      ? poiData.photos[0].url 
      : '';
    
    // 组合城市 + 区域 + 详细地址，避免重复前缀
    const cityPart = poiData.city || poiData.province || '';
    const districtPart = poiData.district || '';
    const baseAddr = poiData.address || '';
    const prefix = `${cityPart}${districtPart}`;
    let composedAddress = baseAddr;
    if (prefix) {
      if (baseAddr.startsWith(prefix)) {
        composedAddress = baseAddr;
      } else if (cityPart && baseAddr.startsWith(cityPart) && districtPart) {
        composedAddress = `${cityPart}${districtPart}${baseAddr.slice(cityPart.length)}`;
      } else {
        composedAddress = `${prefix}${baseAddr}`;
      }
    }
    
    const updatedForm = {
      ...hospitalForm,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      // 自动填充从高德地图提取的信息，但允许用户已有的数据优先保留
      name: hospitalForm.name || poiData.name || '',
      address: hospitalForm.address || composedAddress || '',
      phone: hospitalForm.phone || poiData.phone || '',
      image: hospitalForm.image || firstPhotoUrl || '',
    };
    
    setHospitalForm(updatedForm);
    setSuccess('坐标已更新，医院信息已自动填充，您可以继续编辑');
  };

  if (loading && hospitals.length === 0) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  const totalPages = Math.ceil(totalCount / 10);

  return (
    <div className="max-w-5xl mx-auto">
      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-800">
            <X size={20} />
          </button>
        </div>
      )}

      {/* 成功提示 */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-700 hover:text-green-800">
            <X size={20} />
          </button>
        </div>
      )}

      {/* 顶部视图切换 */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setView('form')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${view==='form' ? 'bg-cyan-600 text-white' : 'border hover:bg-slate-50'}`}
        >新增医院</button>
        <button
          onClick={() => setView('list')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${view==='list' ? 'bg-cyan-600 text-white' : 'border hover:bg-slate-50'}`}
        >查看医院列表</button>
      </div>

      {/* 表单视图 */}
      {view === 'form' && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center mb-4 pb-2 border-b">
            <h3 className="text-lg font-medium">添加医院</h3>
          </div>
          {!showAddForm ? (
            <button 
              onClick={() => setShowAddForm(true)}
              className="w-full py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
            >
              + 新增医院
            </button>
          ) : (
            <form onSubmit={handleAddHospital} className="space-y-3">
                {/* 地图选择按钮 - 移到最上面 */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowMapModal(true)}
                    className="w-full py-2 px-3 border-2 border-dashed border-cyan-300 rounded-lg hover:bg-cyan-50 transition-colors flex items-center justify-center gap-2 text-sm text-cyan-700 font-medium"
                  >
                    <Map size={16} />
                    在地图上选择位置
                  </button>
                  {(hospitalForm.latitude || hospitalForm.longitude) && (
                    <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      ✓ 坐标已选择
                    </div>
                  )}
                </div>

                {/* 必填项 */}
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">医院名称 *</label>
                  <input 
                    type="text" 
                    placeholder="如：未来牙科中心总院"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={hospitalForm.name} 
                    onChange={e => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">医院地址 *</label>
                  <input 
                    type="text" 
                    placeholder="如：科技园区大道88号"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={hospitalForm.address} 
                    onChange={e => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">联系电话 *</label>
                  <input 
                    type="tel" 
                    placeholder="如：010-12345678"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={hospitalForm.phone} 
                    onChange={e => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">营业时间 *</label>
                  <input 
                    type="text" 
                    placeholder="如：9:00-18:00"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={hospitalForm.business_hours} 
                    onChange={e => setHospitalForm({ ...hospitalForm, business_hours: e.target.value })}
                  />
                </div>

                {/* 可选项 */}
                <div className="border-t pt-3 mt-3">
                  <div className="text-xs text-slate-500 font-medium mb-2">可选信息</div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">医院图片</label>
                    {/* 本地上传 */}
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploading(true);
                          setError(null);
                          try {
                            const res = await adminApi.uploadHospitalImage(file);
                            const url = res?.url || res?.data?.url || '';
                            if (!url) throw new Error('上传失败');
                            setHospitalForm({ ...hospitalForm, image: url });
                            setSuccess('图片上传成功');
                          } catch (err) {
                            console.error('图片上传失败:', err);
                            setError(err.message || '图片上传失败');
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                        className="text-sm"
                      />
                      {isUploading && <span className="text-xs text-slate-500">上传中...</span>}
                    </div>
                    {/* 预览或手动URL输入 */}
                    <div className="mt-2 flex items-center gap-3">
                      {hospitalForm.image && (
                        <img src={hospitalForm.image} alt="预览" className="w-24 h-24 object-cover rounded border" onError={(e)=>e.currentTarget.style.display='none'} />
                      )}
                      <input 
                        type="url" 
                        placeholder="也可手动粘贴图片URL https://..."
                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        value={hospitalForm.image} 
                        onChange={e => setHospitalForm({ ...hospitalForm, image: e.target.value })}
                      />
                      {hospitalForm.image && (
                        <button type="button" className="text-slate-500 hover:text-rose-600 text-sm" onClick={()=>setHospitalForm({ ...hospitalForm, image: '' })}>清除</button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1 mt-2">医院简介</label>
                    <textarea 
                      placeholder="医院的简要描述"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                      rows="2"
                      value={hospitalForm.description} 
                      onChange={e => setHospitalForm({ ...hospitalForm, description: e.target.value })}
                    />
                  </div>

                  <div className="mt-3">
                    <label className="text-xs font-medium text-slate-600 block mb-2">位置坐标</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">纬度</label>
                        <input 
                          type="number" 
                          step="0.000001"
                          placeholder="39.9042"
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50"
                          value={hospitalForm.latitude} 
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">经度</label>
                        <input 
                          type="number" 
                          step="0.000001"
                          placeholder="116.4074"
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50"
                          value={hospitalForm.longitude} 
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 按钮 */}
                <div className="flex gap-2 pt-3 border-t">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '提交中...' : '提交'}
                  </button>
                  <button 
                    type="button"
                    onClick={handleResetForm}
                    disabled={isSubmitting}
                    className="flex-1 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    重置
                  </button>
                </div>
            </form>
          )}
        </div>
      )}

      {/* 列表视图 */}
      {view === 'list' && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <h3 className="text-lg font-medium">医院列表 <span className="text-slate-400 text-sm">({totalCount})</span></h3>
            <button onClick={() => setView('form')} className="text-sm text-cyan-700 hover:text-cyan-800">+ 新增医院</button>
          </div>

          {/* 筛选搜索框 */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索医院名称、地址、电话或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="text-xs text-slate-500 mt-2">
                找到 {filteredHospitals.length} 个匹配结果
              </div>
            )}
          </div>
          
            {loading ? (
              <div className="flex justify-center items-center h-64">加载中...</div>
            ) : filteredHospitals.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Building2 size={48} className="mx-auto mb-2 opacity-50" />
                {searchTerm ? (
                  <>
                    <div className="text-lg">未找到匹配的医院</div>
                    <div className="text-sm">请尝试其他搜索关键词</div>
                  </>
                ) : (
                  <>
                    <div className="text-lg">暂无医院数据</div>
                    <div className="text-sm">请添加医院信息</div>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredHospitals.map(h => (
                  <div key={h.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow bg-white">
                    <div className="flex gap-3">
                      {/* 图片 */}
                      {h.image && (
                        <div className="flex-shrink-0">
                          <img 
                            src={h.image} 
                            alt={h.name}
                            onError={(e) => e.target.style.display = 'none'}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        </div>
                      )}

                      {/* 内容 */}
                      <div className="flex-grow">
                        <h4 className="font-semibold text-base mb-1">{h.name}</h4>
                        
                        <div className="space-y-1 text-sm text-slate-600">
                          <div className="flex items-start gap-2">
                            <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                            <span>{h.address}</span>
                          </div>
                          {h.phone && (
                            <div className="flex items-center gap-2">
                              <Phone size={16} />
                              <span>{h.phone}</span>
                            </div>
                          )}
                          {h.business_hours && (
                            <div className="flex items-center gap-2">
                              <Clock size={16} />
                              <span>{h.business_hours}</span>
                            </div>
                          )}
                          {h.description && (
                            <div className="flex items-start gap-2 mt-1">
                              <FileText size={16} className="mt-0.5 flex-shrink-0" />
                              <span>{h.description}</span>
                            </div>
                          )}
                        </div>

                        {/* 坐标显示 */}
                        {h.latitude && h.longitude && (
                          <div className="mt-2 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block">
                            坐标：{h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 分配医生按钮 */}
                    <div className="mt-3 pt-3 border-t">
                      <button
                        onClick={() => openAssignModal(h)}
                        className="w-full py-2 px-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <UserPlus size={16} />
                        分配医生
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <button 
                  onClick={() => fetchHospitals(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  上一页
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => fetchHospitals(page)}
                    disabled={loading}
                    className={`px-3 py-1 rounded text-sm ${
                      page === currentPage 
                        ? 'bg-cyan-600 text-white' 
                        : 'border hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={() => fetchHospitals(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  下一页
                </button>
              </div>
            )}
          </div>
      )}

      {/* 地图选择器模态框 */}
      <MapSelector
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onSelectLocation={handleMapSelect}
        initialLat={hospitalForm.latitude}
        initialLng={hospitalForm.longitude}
      />

      {/* 分配医生模态框 */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium">为医院分配医生</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* 医院信息 */}
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-sm text-slate-600 mb-1">医院名称</div>
                <div className="font-medium">{selectedHospital?.name}</div>
              </div>

              {/* 选择医生 */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  选择医生 *
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">请选择医生</option>
                  {approvedDoctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name || doctor.user?.name || `医生${doctor.id}`} 
                      {doctor.specialty && ` - ${doctor.specialty}`}
                    </option>
                  ))}
                </select>
                {approvedDoctors.length === 0 && (
                  <div className="text-xs text-slate-500 mt-1">
                    暂无已审核通过的医生
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t flex gap-2">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm font-medium"
                disabled={isAssigning}
              >
                取消
              </button>
              <button
                onClick={handleAssignDoctor}
                disabled={!selectedDoctorId || isAssigning}
                className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isAssigning ? '分配中...' : '确认分配'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalManagement;
