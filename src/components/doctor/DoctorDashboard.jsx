import React, { useState, useEffect } from 'react';
import { Users, Calendar, FileText, Power, LogOut } from 'lucide-react';
import doctorApi from '../../api/doctor';

const DoctorDashboard = ({ navigateTo }) => {
    const [doctor, setDoctor] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        appointments_count: 0,
        records_count: 0,
        online_status: false
    });

    // 获取医生信息
    useEffect(() => {
        fetchDoctorInfo();
    }, []);

    const fetchDoctorInfo = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await doctorApi.getDoctorMe();
            if (res && (res.data || res.name)) {
                const doctorData = res.data || res;
                setDoctor(doctorData);
                setIsOnline(doctorData.is_online || false);
            }
        } catch (err) {
            console.error('获取医生信息失败:', err);
            setError('获取医生信息失败');
            // 使用模拟数据
            setDoctor({
                id: 1,
                name: '王医生',
                title: '主任医师',
                specialty: '口腔修复',
                department: '修复科',
                is_online: false,
                avatar: 'https://i.pravatar.cc/150?u=doctor1'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleOnlineStatus = async () => {
        try {
            const newStatus = !isOnline;
            await doctorApi.setDoctorOnlineStatus(newStatus);
            setIsOnline(newStatus);
            setDoctor(prev => ({
                ...prev,
                is_online: newStatus
            }));
        } catch (err) {
            console.error('设置在线状态失败:', err);
            setError('设置在线状态失败');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        navigateTo('login');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="mt-4 text-slate-600">加载中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 py-6 animate-fade-in">
            {/* 医生信息卡片 */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <img
                            src={doctor?.avatar || 'https://i.pravatar.cc/150?u=doctor'}
                            alt={doctor?.name}
                            className="w-16 h-16 rounded-full object-cover"
                        />
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">{doctor?.name || '医生'}</h1>
                            <p className="text-slate-600">{doctor?.title || '医生'}</p>
                            <p className="text-sm text-slate-500">{doctor?.specialty || '牙科'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggleOnlineStatus}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                            isOnline
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        <Power size={18} />
                        {isOnline ? '在线' : '离线'}
                    </button>
                </div>
                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>

            {/* 快速操作区 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 预约管理 */}
                <button
                    onClick={() => navigateTo('doctorAppointments')}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border border-slate-100 text-left"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Calendar className="text-blue-600" size={24} />
                        </div>
                        <h3 className="font-bold text-slate-800">预约管理</h3>
                    </div>
                    <p className="text-sm text-slate-600">查看和管理患者预约</p>
                    <div className="mt-3 text-2xl font-bold text-blue-600">{stats.appointments_count}</div>
                </button>

                {/* 病例管理 */}
                <button
                    onClick={() => navigateTo('doctorRecords')}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border border-slate-100 text-left"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <FileText className="text-purple-600" size={24} />
                        </div>
                        <h3 className="font-bold text-slate-800">病例管理</h3>
                    </div>
                    <p className="text-sm text-slate-600">创建和编辑病例记录</p>
                    <div className="mt-3 text-2xl font-bold text-purple-600">{stats.records_count}</div>
                </button>

                {/* 个人信息 */}
                <button
                    onClick={() => navigateTo('doctorProfile')}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border border-slate-100 text-left"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Users className="text-green-600" size={24} />
                        </div>
                        <h3 className="font-bold text-slate-800">个人信息</h3>
                    </div>
                    <p className="text-sm text-slate-600">查看和编辑个人资料</p>
                </button>
            </div>

            {/* 统计信息 */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-6">工作统计</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">0</div>
                        <p className="text-sm text-slate-600 mt-2">今日预约</p>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">0</div>
                        <p className="text-sm text-slate-600 mt-2">本周病例</p>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">0</div>
                        <p className="text-sm text-slate-600 mt-2">患者数量</p>
                    </div>
                </div>
            </div>

            {/* 登出按钮 */}
            <div className="flex justify-end">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                >
                    <LogOut size={18} />
                    登出
                </button>
            </div>
        </div>
    );
};

export default DoctorDashboard;
