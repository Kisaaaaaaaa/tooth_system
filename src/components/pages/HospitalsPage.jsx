import React, { useState, useEffect } from 'react';
import { MapPin, ChevronRight, Phone, Navigation } from 'lucide-react';
import hospitalsApi from '../../api/hospitals';
import { MOCK_HOSPITALS } from '../../data/mockData';

// 医院概况页面
const HospitalsPage = ({ navigateTo }) => {
    const [filter, setFilter] = useState('all'); // all, near, frequent
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [geolocationError, setGeolocationError] = useState(null);

    // 获取用户地理位置
    const fetchGeolocation = () => {
        if (!navigator.geolocation) {
            setGeolocationError('您的浏览器不支持地理位置服务');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude);
                setLongitude(position.coords.longitude);
                setGeolocationError(null);
            },
            (error) => {
                console.error('获取地理位置失败:', error);
                setGeolocationError('无法获取您的位置，请检查是否允许访问位置信息');
            }
        );
    };

    // 当选择"距离最近"筛选时，获取用户地理位置
    useEffect(() => {
        if (filter === 'near') {
            fetchGeolocation();
        }
    }, [filter]);

    // 获取医院数据
    useEffect(() => {
        const fetchHospitals = async () => {
            setLoading(true);
            setError(null);
            try {
                // 构建API请求参数
                const apiParams = {
                    filter,
                    latitude: filter === 'near' ? latitude : undefined,
                    longitude: filter === 'near' ? longitude : undefined
                };

                // 调用真实API获取医院数据
                const response = await hospitalsApi.getHospitals(apiParams);
                // 确保数据结构正确，根据APIFox文档，医院列表在response.data.results中
                setHospitals(response.data?.results || []);
            } catch (err) {
                // API调用失败时回退到mock数据
                setError('获取医院列表失败，已使用本地数据');
                console.error('获取医院列表失败:', err);
                setHospitals(MOCK_HOSPITALS);
            } finally {
                setLoading(false);
            }
        };

        fetchHospitals();
    }, [filter, latitude, longitude]);

    // 筛选医院
    const filteredHospitals = hospitals.filter(h => {
        if (filter === 'near') {
            // 距离最近筛选：后端返回的数据中没有distance字段，但有latitude和longitude
            // 只要数据存在就显示，后端会处理距离排序
            return true;
        }

        if (filter === 'frequent') {
            // 常去的筛选：使用visit_count字段
            // 对于mock数据，即使没有visit_count字段也显示，后端会正确排序
            return true;
        }

        return true;
    });



    return (
        <div className="space-y-4 animate-fade-in">
            {/* 筛选条件区域 - 响应式布局 */}
            <div className="space-y-3 pt-4">
                {/* 筛选条件 */}
                <div className="flex gap-2 justify-start">
                    {['all', 'near', 'frequent'].map(f => (
                        <button
                            key={f}
                            onClick={() => {
                                setFilter(f);
                            }}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === f ? 'bg-cyan-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {f === 'all' ? '全部' : f === 'near' ? '距离最近' : '大家常去'}
                        </button>
                    ))}
                </div>

                {/* 地理位置错误提示 */}
                {(error || geolocationError) && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                        {error}
                        {geolocationError && <>{error ? ' ' : ''}{geolocationError}</>}
                    </div>
                )}
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

