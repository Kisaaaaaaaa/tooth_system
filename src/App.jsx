import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import HomePage from './components/pages/HomePage';
import HospitalsPage from './components/pages/HospitalsPage';
import HospitalDetailPage from './components/pages/HospitalDetailPage';
import DoctorsPage from './components/pages/DoctorsPage';
import DoctorDetailPage from './components/pages/DoctorDetailPage';
import ConsultationPage from './components/pages/ConsultationPage';
import AppointmentsPage from './components/pages/AppointmentsPage';
import RecordsPage from './components/pages/RecordsPage';
import AiInquiryPage from './components/pages/AiInquiryPage';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLayout from './components/admin/AdminLayout';
import DoctorReview from './components/admin/DoctorReview';
import HospitalManagement from './components/admin/HospitalManagement';
import UserManagement from './components/admin/UserManagement';
import ThreeDModelPage from './components/pages/ThreeDModelPage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import UserProfile from './components/pages/UserProfile';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import DoctorAppointments from './components/doctor/DoctorAppointments';
import DoctorRecords from './components/doctor/DoctorRecords';
import DoctorConsultation from './components/doctor/DoctorConsultation';
import DoctorMySchedule from './components/doctor/DoctorMySchedule';
import DoctorProfile from './components/doctor/DoctorProfile';
import DoctorSchedule from './components/doctor/DoctorSchedule';
import './styles/global.css';

// 路由包装组件，用于传递导航函数
const AppWithRouter = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginTip, setLoginTip] = useState('');
    const REQUIRE_CONSULTATION_AUTH = true; // 预留开关，后续可开启问诊登录校验

    // 获取当前页面名称
    const getCurrentPage = () => {
        const path = location.pathname;
        if (path === '/') return 'home';
        return path.substring(1);
    };

    // 简单登录检测
    const isAuthed = () => {
        return !!(localStorage.getItem('access_token') || localStorage.getItem('authToken'));
    }
    // 检查用户角色
    const checkUserRole = () => {
        try {
            const rawUser = localStorage.getItem('user');
            const userRole = localStorage.getItem('role');
            if (rawUser) {
                const user = JSON.parse(rawUser);
                return user.role || userRole || null;
            }
            return userRole || null;
        } catch (e) {
            return localStorage.getItem('role') || null;
        }
    };

    // Router Logic
    const navigateTo = (page, params = {}) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 跳医院详情时直接带上参数到路由，避免刷新丢状态
        if (page === 'hospitalDetail' && params.hospitalId) {
            navigate(`/hospitalDetail/${params.hospitalId}`);
            return;
        }

        // 如果page为空字符串，直接导航到根路径'/'
        navigate(page ? `/${page}` : '/');
    };

    const startConsultation = (doctor) => {
        const targetDoctor = doctor || selectedDoctor;
        const doctorId = targetDoctor?.id;

        if (REQUIRE_CONSULTATION_AUTH && !isAuthed()) {
            setLoginTip('登录后才能进行在线咨询');
            setShowLoginModal(true);
            return;
        }

        setSelectedDoctor(targetDoctor || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const search = doctorId ? `?doctorId=${doctorId}` : '';
        navigate(`/consultation${search}`, { state: { doctor: targetDoctor } });
    };

    const startAppointment = (doctor) => {
        if (!isAuthed()) {
            setLoginTip('登录后才能预约挂号');
            setShowLoginModal(true);
            return;
        }
        setSelectedDoctor(doctor);
        navigateTo('appointment');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
            {/* 顶部导航 */}
            <Navbar currentPage={getCurrentPage()} navigateTo={navigateTo} />

            {/* 内容区域：Home 与 3D 页面使用全宽显示，其他页面使用居中容器 */}
            <Routes>
                {/* 全宽页面 */}
                <Route path="/" element={<HomePage navigateTo={navigateTo} />} />
                <Route path="/home" element={<HomePage navigateTo={navigateTo} />} />
                <Route path="/model3d" element={<ThreeDModelPage navigateTo={navigateTo} />} />

                {/* 医生端路由 */}
                <Route path="/doctorDashboard" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <DoctorAppointments />
                    </div>
                } />
                <Route path="/doctorAppointments" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <DoctorAppointments />
                    </div>
                } />
                <Route path="/doctorRecords" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <DoctorRecords />
                    </div>
                } />
                <Route path="/doctorConsultation" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <DoctorConsultation />
                    </div>
                } />
                <Route path="/doctorMySchedule" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <DoctorMySchedule />
                    </div>
                } />
                <Route path="/doctorProfile" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <DoctorProfile />
                    </div>
                } />
                <Route path="/doctorSchedule" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <DoctorSchedule />
                    </div>
                } />

                {/* 居中容器页面（统一外层容器） */}
                <Route path="/hospitals" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <HospitalsPage navigateTo={navigateTo} />
                    </div>
                } />
                <Route path="/hospitalDetail/:hospitalId" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <HospitalDetailPage navigateTo={navigateTo} startConsultation={startConsultation} startAppointment={startAppointment} />
                    </div>
                } />
                {/* 兼容旧路径，可能没有参数 */}
                <Route path="/hospitalDetail" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <HospitalDetailPage navigateTo={navigateTo} startConsultation={startConsultation} startAppointment={startAppointment} />
                    </div>
                } />
                <Route path="/doctors" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <DoctorsPage navigateTo={navigateTo} startConsultation={startConsultation} startAppointment={startAppointment} />
                    </div>
                } />
                <Route path="/doctors/:doctorId" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <DoctorDetailPage navigateTo={navigateTo} startAppointment={(doctor) => { setSelectedDoctor(doctor); navigateTo('appointment'); }} />
                    </div>
                } />
                <Route path="/consultation" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <ConsultationPage
                            currentDoctor={selectedDoctor}
                            consultationAuthRequired={REQUIRE_CONSULTATION_AUTH}
                        />
                    </div>
                } />
                <Route path="/appointment" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <AppointmentsPage />
                    </div>
                } />
                <Route path="/records" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <RecordsPage />
                    </div>
                } />
                <Route path="/aiInquiry" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <AiInquiryPage />
                    </div>
                } />
                {/* 管理员路由（使用侧边栏布局） */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="doctors" element={<DoctorReview />} />
                    <Route path="hospitals" element={<HospitalManagement />} />
                    <Route path="users" element={<UserManagement />} />
                </Route>
                <Route path="/login" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <Login navigateTo={navigateTo} />
                    </div>
                } />
                <Route path="/register" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <Register navigateTo={navigateTo} />
                    </div>
                } />
                <Route path="/profile" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <UserProfile />
                    </div>
                } />
            </Routes>

            {/* 移动端底部导航 */}
            <BottomNav currentPage={getCurrentPage()} navigateTo={navigateTo} />

            {/* 未登录提示弹窗 */}
            {showLoginModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-3">需要登录</h3>
                        <p className="text-slate-600 mb-6">{loginTip || '您还未登录，暂时无法使用该功能。'}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                            >
                                取消
                            </button>
                            <button
                                onClick={() => {
                                    setShowLoginModal(false);
                                    navigateTo('login');
                                }}
                                className="flex-1 py-2.5 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 transition shadow-sm"
                            >
                                去登录
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 主应用组件 ---
const DentalApp = () => {
    return (
        <Router>
            <AppWithRouter />
        </Router>
    );
};

export default DentalApp;

