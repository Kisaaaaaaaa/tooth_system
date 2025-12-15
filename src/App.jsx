import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import HomePage from './components/pages/HomePage';
import HospitalsPage from './components/pages/HospitalsPage';
import HospitalDetailPage from './components/pages/HospitalDetailPage';
import DoctorsPage from './components/pages/DoctorsPage';
import ConsultationPage from './components/pages/ConsultationPage';
import AppointmentsPage from './components/pages/AppointmentsPage';
import RecordsPage from './components/pages/RecordsPage';
import AiInquiryPage from './components/pages/AiInquiryPage';
import AdminDashboard from './components/admin/AdminDashboard';
import ThreeDModelPage from './components/pages/ThreeDModelPage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import UserProfile from './components/pages/UserProfile';
import './styles/global.css';

// 路由包装组件，用于传递导航函数
const AppWithRouter = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedHospitalId, setSelectedHospitalId] = useState(null);

    // 获取当前页面名称
    const getCurrentPage = () => {
        const path = location.pathname;
        if (path === '/') return 'home';
        return path.substring(1);
    };

    // Router Logic
    const navigateTo = (page, params = {}) => {
        if (params.hospitalId) {
            setSelectedHospitalId(params.hospitalId);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // 如果page为空字符串，直接导航到根路径'/'
        navigate(page ? `/${page}` : '/');
    };

    const startConsultation = (doctor) => {
        setSelectedDoctor(doctor);
        navigateTo('consultation');
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

                {/* 居中容器页面（统一外层容器） */}
                <Route path="/hospitals" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <HospitalsPage navigateTo={navigateTo} />
                    </div>
                } />
                <Route path="/hospitalDetail" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <HospitalDetailPage navigateTo={navigateTo} hospitalId={selectedHospitalId} />
                    </div>
                } />
                <Route path="/doctors" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <DoctorsPage navigateTo={navigateTo} startConsultation={startConsultation} />
                    </div>
                } />
                <Route path="/consultation" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <ConsultationPage currentDoctor={selectedDoctor} />
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
                <Route path="/admin" element={
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <AdminDashboard />
                    </div>
                } />
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

