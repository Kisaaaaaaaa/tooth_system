import React, { useState, useEffect } from 'react';
import { MapPin, User, MessageSquare, FileText, Building, Clock, TrendingUp, Heart, Users } from 'lucide-react';
import { getHomeStatistics } from '../../api/statistics';

// 首页组件
const HomePage = ({ navigateTo }) => {
    // 统计数据状态
    const [statistics, setStatistics] = useState({
        cooperation_clinics: 2000,
        appointment_efficiency: 98,
        revenue_growth: 45,
        patient_satisfaction: 95,
        today_patients: 128,
        online_doctors: 12
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 获取统计数据
    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getHomeStatistics();

                // 处理响应数据
                if (response && response.code === 200 && response.data) {
                    setStatistics(response.data);
                } else {
                    // 如果响应格式不符合预期，使用默认值
                    console.warn('统计数据格式不符合预期，使用默认值', response);
                }
            } catch (err) {
                console.error('获取统计数据失败:', err);
                setError(err.message || '获取统计数据失败');
                // 发生错误时保持默认值，不更新状态
            } finally {
                setLoading(false);
            }
        };

        fetchStatistics();
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            <HeroCarousel navigateTo={navigateTo} />

            {/* 快捷功能区（居中容器） */}
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                {/* 修正这里：将 {{ 改为 [ */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: MapPin, label: "找医院", action: () => navigateTo('hospitals'), color: "bg-blue-100 text-blue-600" },
                        { icon: User, label: "找医生", action: () => navigateTo('doctors'), color: "bg-purple-100 text-purple-600" },
                        { icon: MessageSquare, label: "在线问诊", action: () => navigateTo('consultation'), color: "bg-green-100 text-green-600" },
                        { icon: FileText, label: "我的病历", action: () => navigateTo('records'), color: "bg-orange-100 text-orange-600" },
                    ].map((item, idx) => (
                        <button key={idx} onClick={item.action} className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-slate-100">
                            <div className={`p-4 rounded-xl mb-3 ${item.color}`}>
                                <item.icon size={28} />
                            </div>
                            <span className="text-slate-800 font-semibold text-base md:text-lg">{item.label}</span>
                        </button>
                    ))}
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 shadow-sm border border-slate-100 mt-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-slate-800 mb-3">数据见证成效</h2>
                        {error && (
                            <p className="text-sm text-red-500 mt-2">数据加载失败，显示默认值</p>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <p className="mt-4 text-slate-600">加载中...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* 第一行：3个指标 */}
                            <div className="bg-white rounded-xl p-6 shadow-sm border-t-4 border-blue-500 hover:shadow-md transition-shadow flex flex-col items-center text-center">
                                <div className="p-4 rounded-xl bg-blue-50 mb-4">
                                    <Building className="text-blue-500" size={28} />
                                </div>
                                <div className="text-4xl font-bold text-slate-800 mb-2">
                                    {statistics.cooperation_clinics >= 1000
                                        ? `${(statistics.cooperation_clinics / 1000).toFixed(0)}K+`
                                        : `${statistics.cooperation_clinics}+`}
                                </div>
                                <div className="font-medium text-slate-700 text-lg">合作诊所</div>
                                <div className="text-sm text-slate-500 mt-2">全国超过{statistics.cooperation_clinics}家牙科诊所的选择</div>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow-sm border-t-4 border-green-500 hover:shadow-md transition-shadow flex flex-col items-center text-center">
                                <div className="p-4 rounded-xl bg-green-50 mb-4">
                                    <Clock className="text-green-500" size={28} />
                                </div>
                                <div className="text-4xl font-bold text-slate-800 mb-2">{statistics.appointment_efficiency}%</div>
                                <div className="font-medium text-slate-700 text-lg">预约效率提升</div>
                                <div className="text-sm text-slate-500 mt-2">平均预约处理时间缩短{statistics.appointment_efficiency}%</div>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow-sm border-t-4 border-amber-500 hover:shadow-md transition-shadow flex flex-col items-center text-center">
                                <div className="p-4 rounded-xl bg-amber-50 mb-4">
                                    <TrendingUp className="text-amber-500" size={28} />
                                </div>
                                <div className="text-4xl font-bold text-slate-800 mb-2">{statistics.revenue_growth}%</div>
                                <div className="font-medium text-slate-700 text-lg">收入增长</div>
                                <div className="text-sm text-slate-500 mt-2">诊所平均收入增长{statistics.revenue_growth}%</div>
                            </div>

                            {/* 第二行：3个指标 */}
                            <div className="bg-white rounded-xl p-6 shadow-sm border-t-4 border-pink-500 hover:shadow-md transition-shadow flex flex-col items-center text-center">
                                <div className="p-4 rounded-xl bg-pink-50 mb-4">
                                    <Heart className="text-pink-500" size={28} />
                                </div>
                                <div className="text-4xl font-bold text-slate-800 mb-2">{statistics.patient_satisfaction}%</div>
                                <div className="font-medium text-slate-700 text-lg">患者满意度</div>
                                <div className="text-sm text-slate-500 mt-2">患者满意度提升至{statistics.patient_satisfaction}%以上</div>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow-sm border-t-4 border-cyan-500 hover:shadow-md transition-shadow flex flex-col items-center text-center">
                                <div className="p-4 rounded-xl bg-cyan-50 mb-4">
                                    <Users className="text-cyan-500" size={28} />
                                </div>
                                <div className="text-4xl font-bold text-slate-800 mb-2">{statistics.today_patients}</div>
                                <div className="font-medium text-slate-700 text-lg">今日接诊</div>
                                <div className="text-sm text-slate-500 mt-2">今日累计接诊患者数</div>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow-sm border-t-4 border-purple-500 hover:shadow-md transition-shadow flex flex-col items-center text-center">
                                <div className="p-4 rounded-xl bg-purple-50 mb-4">
                                    <User className="text-purple-500" size={28} />
                                </div>
                                <div className="text-4xl font-bold text-slate-800 mb-2">{statistics.online_doctors}</div>
                                <div className="font-medium text-slate-700 text-lg">在线医生</div>
                                <div className="text-sm text-slate-500 mt-2">当前在线提供服务的医生</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 优化后的HeroCarousel组件
function HeroCarousel({ navigateTo }) {
    // 背景图片轮播
    const backgroundImages = [
        '/images/儿童牙医.png',
        '/images/讲解.png',
        '/images/牙医.png'
    ];

    const [currentSlide, setCurrentSlide] = useState(0);

    // 自动轮播
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % backgroundImages.length);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[65vh] md:h-[70vh] flex flex-col">
            {/* 背景图片轮播 */}
            <div className="absolute inset-0 z-0">
                {backgroundImages.map((src, i) => (
                    <div
                        key={i}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === currentSlide ? 'opacity-100' : 'opacity-0'
                            }`}
                        style={{
                            backgroundImage: `url(${src})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }}
                    />
                ))}
            </div>

            {/* 背景遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent z-1"></div>

            {/* 右侧装饰效果 */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

            {/* 主要内容区 */}
            <div className="relative z-10 flex flex-col md:flex-row h-full">
                {/* 左侧文字内容 */}
                <div className="flex-1 flex flex-col justify-center px-6 md:px-12 py-8">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4">
                        智能守护<br /><span className="text-cyan-400">您的微笑</span>
                    </h1>
                    <p className="text-slate-200 text-lg max-w-xl mb-8">
                        全流程数字化牙科管理，3D可视模型、AI辅助诊断、一键预约名医。
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => navigateTo('appointment')}
                            className="bg-cyan-500 hover:bg-cyan-400 text-white px-8 py-3 rounded-full font-medium transition shadow-lg shadow-cyan-500/25 text-lg"
                        >
                            立即预约
                        </button>
                        <button
                            onClick={() => navigateTo('hospitals')}
                            className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-full font-medium transition backdrop-blur-sm text-lg"
                        >
                            寻找诊所
                        </button>
                    </div>
                </div>
            </div>

            {/* 轮播控制 */}
            <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + backgroundImages.length) % backgroundImages.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 z-20 transition"
            >
                <span className="text-xl">‹</span>
            </button>
            <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % backgroundImages.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 z-20 transition"
            >
                <span className="text-xl">›</span>
            </button>

            {/* 轮播指示点 */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-6 flex gap-3 z-20">
                {backgroundImages.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={`w-3 h-3 rounded-full transition-all ${i === currentSlide ? 'bg-white w-8' : 'bg-white/60'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}

// 简洁 Footer 组件（用于页面底部填充）
function HomeFooter({ navigateTo }) {
    return (
        <footer className="mt-12 bg-slate-50 border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-2">联系我们</h4>
                    <p className="text-sm text-slate-600">电话：400-123-4567</p>
                    <p className="text-sm text-slate-600">邮箱：1950514334@qq.com</p>
                    <p className="text-sm text-slate-600">地址：湖北省武汉市武汉理工大学南湖校区</p>
                </div>

                <div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-2">快速链接</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li>
                            <button onClick={() => navigateTo('hospitals')} className="hover:text-slate-800 cursor-pointer">找医院</button>
                        </li>
                        <li>
                            <button onClick={() => navigateTo('doctors')} className="hover:text-slate-800 cursor-pointer">找医生</button>
                        </li>
                        <li>
                            <button onClick={() => navigateTo('consultation')} className="hover:text-slate-800 cursor-pointer">在线问诊</button>
                        </li>
                        <li>
                            <button onClick={() => navigateTo('records')} className="hover:text-slate-800 cursor-pointer">我的病历</button>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-2">关于我们</h4>
                    <p className="text-sm text-slate-600">我们致力于为您提供国际化标准的口腔诊疗服务。汇聚资深专家团队，引进前沿齿科技术，以严谨的医疗态度和舒适的诊疗环境，守护您和家人的口腔健康。从预防保健到复杂治疗，我们是您值得信赖的终身牙医。</p>
                </div>
            </div>

            <div className="bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 text-center text-sm text-slate-500">© {new Date().getFullYear()} 牙科管理系统 - 版权所有</div>
            </div>
        </footer>
    );
}

// 将 Footer 添加到页面输出
function HomePageWrapper(props) {
    return (
        <>
            <HomePage {...props} />
            <HomeFooter navigateTo={props.navigateTo} />
        </>
    );
}

export default HomePageWrapper;