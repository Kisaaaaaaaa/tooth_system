import React, { useEffect, useState } from 'react';
import adminApi from '../../api/admin';

const HospitalManagement = () => {
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 添加医院表单
  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    address: '',
    tags: ''
  });

  // 获取医院和医生列表
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 在真实场景中调用API
      // const hospitalsData = await adminApi.getHospitals();
      // const doctorsData = await adminApi.getDoctors();
      
      // 使用模拟数据
      const mockHospitals = [
        { id: 1, name: "未来牙科中心总院", address: "科技园区大道88号", tags: ["常去", "三甲"], image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400" },
        { id: 2, name: "社区口腔服务站", address: "幸福里小区东门", tags: ["最近", "社区"], image: "https://images.unsplash.com/photo-1588776814546-1ffcf4722e12?auto=format&fit=crop&q=80&w=400" },
        { id: 3, name: "高端种植牙专科", address: "金融中心B座", tags: ["专家"], image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=400" }
      ];
      
      const mockDoctors = [
        { id: 1, name: '张智齿', title: '主任医师', specialty: '复杂拔牙', hospitalId: 1, avatar: 'https://i.pravatar.cc/150?u=1' },
        { id: 2, name: '李正畸', title: '副主任医师', specialty: '隐形矫正', hospitalId: null, avatar: 'https://i.pravatar.cc/150?u=2' },
        { id: 3, name: '王洁牙', title: '主治医师', specialty: '牙周治疗', hospitalId: 2, avatar: 'https://i.pravatar.cc/150?u=3' },
        { id: 4, name: '赵种植', title: '教授', specialty: '全口种植', hospitalId: 3, avatar: 'https://i.pravatar.cc/150?u=4' },
        { id: 5, name: '刘儿童', title: '主治医师', specialty: '儿童牙科', hospitalId: null, avatar: 'https://i.pravatar.cc/150?u=5' }
      ];
      
      setHospitals(mockHospitals);
      setDoctors(mockDoctors);
    } catch (err) {
      setError('获取数据失败');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 添加医院
  const addHospital = async () => {
    if (!hospitalForm.name.trim()) {
      setError('请输入医院名称');
      return;
    }
    
    try {
      // 在真实场景中调用API
      // await adminApi.addHospital(hospitalForm);
      
      // 模拟API调用
      const newHospital = {
        id: Date.now(),
        name: hospitalForm.name.trim(),
        address: hospitalForm.address.trim(),
        tags: hospitalForm.tags.trim().split(',').map(tag => tag.trim()).filter(Boolean),
        image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400"
      };
      
      setHospitals(prev => [newHospital, ...prev]);
      setHospitalForm({ name: '', address: '', tags: '' });
      setError(null);
    } catch (err) {
      setError('添加医院失败');
      console.error('Error adding hospital:', err);
    }
  };

  // 分配医生到医院
  const assignDoctor = async (docId, hospitalId) => {
    try {
      // 在真实场景中调用API
      // await adminApi.assignDoctorToHospital(docId, hospitalId);
      
      // 模拟API调用
      setDoctors(prev => prev.map(d => d.id === docId ? { ...d, hospitalId: hospitalId ? Number(hospitalId) : null } : d));
    } catch (err) {
      setError('分配医生失败');
      console.error('Error assigning doctor:', err);
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
        <h3 className="text-lg font-medium mb-4 pb-2 border-b">医院管理</h3>
        
        {/* 添加医院表单 */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3">添加医院</h4>
          <div className="space-y-3">
            <div>
              <input 
                type="text" 
                placeholder="医院名称" 
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={hospitalForm.name} 
                onChange={e => setHospitalForm({ ...hospitalForm, name: e.target.value })}
              />
            </div>
            <div>
              <input 
                type="text" 
                placeholder="医院地址" 
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={hospitalForm.address} 
                onChange={e => setHospitalForm({ ...hospitalForm, address: e.target.value })}
              />
            </div>
            <div>
              <input 
                type="text" 
                placeholder="标签（用逗号分隔）" 
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={hospitalForm.tags} 
                onChange={e => setHospitalForm({ ...hospitalForm, tags: e.target.value })}
              />
            </div>
            <button 
              onClick={addHospital} 
              className="w-full py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              添加医院
            </button>
          </div>
        </div>

        {/* 医院列表 */}
        <div>
          <h4 className="text-sm font-medium mb-3">医院列表 ({hospitals.length})</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {hospitals.map(h => (
              <div key={h.id} className="p-3 border rounded-lg bg-slate-50 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <img 
                      src={h.image} 
                      alt={h.name} 
                      className="w-12 h-12 rounded object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="font-semibold">{h.name}</div>
                    <div className="text-sm text-slate-600 mt-1">{h.address}</div>
                    {h.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {h.tags.map((tag, index) => (
                          <span key={index} className="text-xs px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-medium mb-4 pb-2 border-b">医生分配管理</h3>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {doctors.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-lg mb-2">暂无医生</div>
              <div className="text-sm">请先通过医生审核</div>
            </div>
          ) : (
            doctors.map(d => (
              <div key={d.id} className="p-3 border rounded-lg bg-slate-50 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <img 
                      src={d.avatar} 
                      alt={d.name} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">{d.name}</div>
                      <div className="text-xs px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full">{d.title}</div>
                    </div>
                    <div className="text-sm text-slate-600 mt-1">专长：{d.specialty}</div>
                  </div>
                  <div className="ml-2">
                    <select 
                      value={d.hospitalId || ''} 
                      onChange={e => assignDoctor(d.id, e.target.value)}
                      className="border rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">未分配</option>
                      {hospitals.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalManagement;
