import React, { useState, useEffect } from 'react';
import { MapPin, ChevronRight, Phone, Navigation } from 'lucide-react';
import hospitalsApi from '../../api/hospitals';
import { MOCK_HOSPITALS } from '../../data/mockData';

// 医院概况页面
const HospitalsPage = ({ navigateTo }) => {
    const [filter, setFilter] = useState('all'); // all, near, frequent
    const [selectedDistrict, setSelectedDistrict] = useState('all'); // 区域筛选
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 获取医院数据
    useEffect(() => {
        const fetchHospitals = async () => {
            setLoading(true);
            setError(null);
            try {
                // 这里可以调用真实API，目前先使用mock数据
                // const response = await hospitalsApi.getHospitals({ filter });
                // setHospitals(response.data || []);

                // 使用mock数据，已经包含武汉各区信息
                setHospitals(MOCK_HOSPITALS);
            } catch (err) {
                setError('获取医院列表失败，请稍后重试');
                console.error('获取医院列表失败:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHospitals();
    }, [filter]);

    // 筛选医院 - 互斥筛选逻辑
    // 当选择区域筛选时，忽略"距离最近"和"我常去的"筛选
    // 当选择"距离最近"或"我常去的"时，忽略区域筛选
    const filteredHospitals = hospitals.filter(h => {
        // 区域筛选和特殊筛选（距离最近/我常去的）互斥
        if (selectedDistrict !== 'all') {
            // 优先应用区域筛选
            return h.district === selectedDistrict;
        } else {
            // 应用特殊筛选条件
            if (filter === 'near') return h.tags.includes('最近') || h.distance < 2;
            if (filter === 'frequent') return h.tags.includes('常去');
            return true;
        }
    });

    // 获取所有区域（用于筛选）
    const districts = ['all', ...Array.from(new Set(hospitals.map(h => h.district))).sort((a, b) => a.localeCompare(b, 'zh-CN'))];

    return (
        <div className="space-y-4 animate-fade-in">
            {/* 筛选条件区域 - 响应式布局 */}
            <div className="space-y-3">
                {/* 区域筛选 - 武汉各区（可横向滚动） */}
                <div className="relative">
                    <div className="flex gap-2 overflow-x-auto pb-1 max-w-full scrollbar-hide">
                        {districts.map(district => (
                            <button
                                key={district}
                                onClick={() => {
                                    setSelectedDistrict(district);
                                    // 选择区域筛选时，重置特殊筛选
                                    if (district !== 'all') {
                                        setFilter('all');
                                    }
                                }}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedDistrict === district ? 'bg-cyan-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                                    `}
                                style={{ minWidth: '60px' }}
                            >
                                {district === 'all' ? '全部' : district}
                            </button>
                        ))}
                    </div>
                    {/* 渐变遮罩，提示可滚动 */}
                    <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                </div>

                {/* 额外筛选条件 - 始终保持在区域筛选下方 */}
                <div className="flex gap-2 justify-start">
                    {['near', 'frequent'].map(f => (
                        <button
                            key={f}
                            onClick={() => {
                                setFilter(f);
                                // 选择特殊筛选时，重置区域筛选
                                setSelectedDistrict('all');
                            }}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === f ? 'bg-cyan-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {f === 'near' ? '距离最近' : '我常去的'}
                        </button>
                    ))}
                </div>
            </div>

            {/* 医院列表 - 一排三个 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHospitals.map(hospital => (
                    <div key={hospital.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 group hover:shadow-md transition">
                        <div className="h-48 bg-slate-200 relative">
                            <img src={hospital.image} alt={hospital.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{hospital.name}</h3>
                            </div>

                            {/* 医院电话 */}
                            <div className="text-slate-600 text-sm flex items-center gap-2">
                                <Phone size={16} className="text-slate-400" />
                                <span>{hospital.phone}</span>
                            </div>

                            {/* 医院地址 */}
                            <div className="text-slate-500 text-sm flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} />
                                    <span className="flex-1 truncate">{hospital.address}</span>
                                </div>
                                <button
                                    className="text-cyan-500 hover:text-cyan-600 transition-colors"
                                    title="查看地图位置"
                                >
                                    <Navigation size={16} />
                                </button>
                            </div>

                            {/* 查看详情按钮 */}
                            <button
                                className="mt-2 w-full py-2 bg-cyan-50 text-cyan-600 hover:bg-cyan-100 text-sm font-medium rounded-lg flex items-center justify-center gap-1 transition-colors"
                                onClick={() => navigateTo('hospitalDetail', { hospitalId: hospital.id })}
                            >
                                查看详情 <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HospitalsPage;

