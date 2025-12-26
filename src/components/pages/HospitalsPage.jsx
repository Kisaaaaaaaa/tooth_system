import React, { useState, useEffect } from 'react';
import { MapPin, ChevronRight, Phone, Navigation } from 'lucide-react';
import hospitalsApi from '../../api/hospitals';
import { MOCK_HOSPITALS } from '../../data/mockData';
import RoutePlannerModal from '../navigation/RoutePlannerModal';
import { getAMapLocation } from '../../api/amapLocation';

// 医院概况页面
const HospitalsPage = ({ navigateTo }) => {
    const [filter, setFilter] = useState('all'); // all, near, frequent
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [geolocationError, setGeolocationError] = useState(null);
    const [locationAccuracy, setLocationAccuracy] = useState(null);

    // 路线规划弹窗状态
    const [routeModalOpen, setRouteModalOpen] = useState(false);
    const [routeHospital, setRouteHospital] = useState(null);
    const [routeLoading, setRouteLoading] = useState(false);
    const [routeError, setRouteError] = useState(null);
    const [routeResult, setRouteResult] = useState(null);

    const fetchGeolocationOnce = () => {
        return getAMapLocation()
            .then((loc) => {
                setLatitude(loc.latitude);
                setLongitude(loc.longitude);
                setLocationAccuracy(loc.accuracy ?? null);
                setGeolocationError(null);
                return { latitude: loc.latitude, longitude: loc.longitude };
            })
            .catch((err) => {
                console.error('获取地理位置失败:', err);
                const msg = err?.message || '无法获取您的位置，请检查是否允许定位权限';
                setGeolocationError(msg);
                return Promise.reject(new Error(msg));
            });
    };

    const openRoutePlanner = async (hospital) => {
        setRouteHospital(hospital);
        setRouteModalOpen(true);
        setRouteLoading(true);
        setRouteError(null);
        setRouteResult(null);

        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
            if (!token) {
                throw new Error('未检测到登录信息，请先登录后再进行路线规划');
            }

            // 优先复用已获取的定位；没有则临时获取一次
            let loc = null;
            if (latitude != null && longitude != null) {
                loc = { latitude, longitude };
            } else {
                try {
                    loc = await fetchGeolocationOnce();
                } catch {
                    // 定位失败也继续：body 可为空，后端可按默认处理；前端仍可打开高德导航兜底
                    loc = null;
                }
            }

            const res = await hospitalsApi.postHospitalRoute(hospital.id, loc || {});
            // 约定：后端通用返回结构 { code, message, data }
            setRouteResult(res?.data ?? res);
        } catch (e) {
            console.error('路线规划请求失败:', e);
            setRouteError(e?.message || '路线规划请求失败');
        } finally {
            setRouteLoading(false);
        }
    };

    // 当选择"距离最近"筛选时，获取用户地理位置
    useEffect(() => {
        if (filter === 'near') {
            fetchGeolocationOnce();
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

    // 搜索框关键字
    const [searchKeyword, setSearchKeyword] = useState('');

    // 筛选医院（加名称搜索）
    const filteredHospitals = hospitals.filter(h => {
        // 名称搜索优先
        if (searchKeyword.trim() && h.name) {
            if (!h.name.toLowerCase().includes(searchKeyword.trim().toLowerCase())) return false;
        }
        if (filter === 'near') return true;
        if (filter === 'frequent') return true;
        return true;
    });



    return (
        <div className="space-y-4 animate-fade-in">
            {/* 路线规划弹窗 */}
            <RoutePlannerModal
                open={routeModalOpen}
                onClose={() => setRouteModalOpen(false)}
                hospital={routeHospital}
                userLocation={latitude != null && longitude != null ? { latitude, longitude, accuracy: locationAccuracy } : null}
                routeResult={routeResult}
                loading={routeLoading}
                error={routeError}
                onRetry={() => routeHospital && openRoutePlanner(routeHospital)}
            />

            {/* 顶部区域：筛选+搜索框 */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 pt-4">
                {/* 左侧筛选条件 */}
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

                {/* 右上角搜索框 */}
                <div className="flex justify-end md:justify-end">
                    <input
                        type="text"
                        placeholder="搜索医院名称"
                        value={searchKeyword}
                        onChange={e => setSearchKeyword(e.target.value)}
                        className="w-56 pl-10 pr-4 py-2 rounded-xl text-sm border-2 border-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 bg-white shadow-sm"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'18\' height=\'18\' viewBox=\'0 0 18 18\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'8.5\' cy=\'8.5\' r=\'7.5\' stroke=\'%239CA3AF\' stroke-width=\'2\'/%3E%3Cpath d=\'M16 16L13 13\' stroke=\'%239CA3AF\' stroke-width=\'2\' stroke-linecap=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: '10px center' }}
                    />
                </div>
            </div>

            {geolocationError && (
                <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    {geolocationError}
                </div>
            )}

            {/* 医院列表 - 一排三个 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHospitals.map(hospital => (
                    <div key={hospital.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 group hover:shadow-md transition">
                        <div className="h-48 bg-slate-200 relative">
                            <img src={hospital.image} alt={hospital.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            <div>
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="font-bold text-lg text-slate-800 truncate">{hospital.name}</h3>
                                    <button
                                        className="text-cyan-500 hover:text-cyan-600 transition-colors flex-shrink-0"
                                        title="查看地图位置"
                                        onClick={() => openRoutePlanner(hospital)}
                                    >
                                        <Navigation size={16} />
                                    </button>
                                </div>
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

