import React, { useEffect, useRef, useState } from 'react';
import api from '../../api/auth';

const generateCaptcha = (length = 5) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混淆字符
    let s = '';
    for (let i = 0; i < length; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    return s;
};

const Login = ({ navigateTo }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [captchaText, setCaptchaText] = useState('');
    const [captchaImage, setCaptchaImage] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const [error, setError] = useState('');



    useEffect(() => {
        // 立即显示本地验证码，异步尝试请求服务器验证码，2秒后无论如何都允许交互
        let mounted = true;
        setCaptchaText(generateCaptcha(5));
        setCaptchaImage('');
        setUseServerCaptcha(false);

        let finished = false;
        const timeoutId = setTimeout(() => {
            finished = true;
            // 2秒后无论接口是否返回，都不再等待，页面可交互
        }, 2000);

        api.getCaptcha().then(r => {
            if (!mounted || finished) return;
            clearTimeout(timeoutId);
            // 如果r为null，表示请求失败，保持本地验证码
            if (r && (r.image || r.raw || r.captcha)) {
                if (r.image) {
                    setCaptchaImage(r.image);
                    setCaptchaText('');
                    setCaptchaId(r.id || r.captcha_id || null);
                    setUseServerCaptcha(true);
                } else if (r.raw) {
                    if (/^[A-Za-z0-9+/=]+$/.test(r.raw)) {
                        setCaptchaImage('data:image/png;base64,' + r.raw);
                        setCaptchaText('');
                        setUseServerCaptcha(true);
                        setCaptchaId(null);
                    } else {
                        setCaptchaImage('');
                        setCaptchaText(r.raw);
                        setUseServerCaptcha(false);
                    }
                } else {
                    setCaptchaImage('');
                    setCaptchaText(String(r));
                }
            }
        }).catch(() => {
            // 保持本地验证码
        });
        return () => { mounted = false; clearTimeout(timeoutId); };
    }, []);

    const [captchaId, setCaptchaId] = useState(null);
    const [useServerCaptcha, setUseServerCaptcha] = useState(false);

    const refreshCaptcha = async () => {
        try {
            const r = await api.getCaptcha();
            // 如果r为null，表示请求失败，使用本地验证码
            if (r && r.image) {
                setCaptchaImage(r.image);
                setCaptchaText('');
                setUseServerCaptcha(true);
                setCaptchaId(r.id || r.captcha_id || null);
            } else if (r && r.raw) {
                if (/^[A-Za-z0-9+/=]+$/.test(r.raw)) {
                    setCaptchaImage('data:image/png;base64,' + r.raw);
                    setCaptchaText('');
                    setUseServerCaptcha(true);
                    setCaptchaId(null);
                } else {
                    setCaptchaImage('');
                    setCaptchaText(r.raw);
                    setUseServerCaptcha(false);
                }
            } else {
                const text = generateCaptcha(5);
                setCaptchaImage('');
                setCaptchaText(text);
                setUseServerCaptcha(false);
            }
        } catch (err) {
            const text = generateCaptcha(5);
            setCaptchaImage('');
            setCaptchaText(text);
            setUseServerCaptcha(false);
        }
    };

    const canvasRef = useRef(null);

    const drawCaptchaCanvas = () => {
        // don't draw local canvas when server captcha image is used
        if (useServerCaptcha || captchaImage) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const width = 140;
        const height = 48;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);

        // background
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#f8fafc');
        bgGrad.addColorStop(1, '#eef2ff');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // noise lines
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * width, Math.random() * height);
            ctx.lineTo(Math.random() * width, Math.random() * height);
            ctx.strokeStyle = `rgba(${50 + Math.random() * 100},${50 + Math.random() * 100},${50 + Math.random() * 100},${0.15 + Math.random() * 0.2})`;
            ctx.lineWidth = 1 + Math.random() * 1.5;
            ctx.stroke();
        }

        // draw characters with rotation and random color
        // NOTE: previous font sizing could be too large and cause clipping; use smaller font
        const chars = captchaText.split('');
        const charCount = chars.length;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        for (let i = 0; i < charCount; i++) {
            const ch = chars[i];
            // use a smaller font range so characters won't be clipped
            const fontSize = 14 + Math.random() * 4; // 14-18px
            ctx.font = `${fontSize}px sans-serif`;
            const slotWidth = width / charCount;
            const x = slotWidth * (i + 0.5) + (Math.random() - 0.5) * (slotWidth * 0.15);
            const y = height / 2 + (Math.random() - 0.5) * 6; // small vertical jitter
            const angle = (Math.random() - 0.5) * 0.5; // rotate slightly

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillStyle = `rgba(${30 + Math.random() * 120},${30 + Math.random() * 120},${30 + Math.random() * 120},0.9)`;
            ctx.fillText(ch, 0, 0);
            ctx.restore();
        }

        // dots
        for (let i = 0; i < 30; i++) {
            ctx.beginPath();
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
            ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.6, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    useEffect(() => {
        drawCaptchaCanvas();
        // redraw when captcha text changes
    }, [captchaText, captchaImage]);

    const validatePhone = (p) => {
        // 限制为 11 位数字
        return /^\d{11}$/.test(p.replace(/\s|-/g, ''));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validatePhone(phone)) {
            setError('请输入有效的电话号码（仅数字，11位）');
            return;
        }

        // 仅在本地文本验证码时校验；如果是服务器图片验证码，由后端校验
        if (captchaText && captchaInput.trim().toUpperCase() !== captchaText.toUpperCase()) {
            setError('验证码错误，请刷新后重试');
            refreshCaptcha();
            setCaptchaInput('');
            return;
        }

        // 调用后端登录接口
        try {
            console.log('=== 开始登录流程 ===');
            const payload = { phone, password, captcha_id: captchaId, captcha: captchaInput };
            console.log('登录请求参数:', payload);
            
            // 使用api.login函数确保使用正确的mock服务器地址
            const res = await api.login(payload);
            console.log('登录响应:', res);
            
            // 手动设置localStorage
            if (res && res.token) {
                console.log('手动设置token:', res.token);
                localStorage.setItem('authToken', res.token);
            } else if (res && res.access_token) {
                console.log('手动设置token为access_token:', res.access_token);
                localStorage.setItem('authToken', res.access_token);
            } else if (typeof res === 'string' && res.length > 0) {
                console.log('手动设置token为字符串:', res);
                localStorage.setItem('authToken', res);
            } else {
                console.log('登录响应格式异常，无法提取token:', res);
                // 模拟登录成功，设置测试token
                localStorage.setItem('authToken', 'test-token-' + Date.now());
            }

            // 写入用户信息（兼容后端返回格式）
            let userObj = null;
            if (res && res.data) {
                userObj = res.data;
            } else if (res && res.user) {
                userObj = res.user;
            } else if (res && res.name) {
                userObj = res;
            }
            
            // 如果 userObj 仍然包含顶层的 token/refresh_token，说明它是响应对象而非真正的 user 对象
            // 此时应该提取其中的 user 字段
            if (userObj && userObj.token && userObj.user && typeof userObj.user === 'object') {
                console.log('检测到响应对象包含嵌套user，提取user对象');
                userObj = userObj.user;
            }
            
            if (userObj) {
                localStorage.setItem('user', JSON.stringify(userObj));
                console.log('设置后的user:', localStorage.getItem('user'));
                console.log('userObj.role:', userObj.role);
            }

            // 保存 role 字段（用于区分用户和医生）
            if (userObj && userObj.role) {
                localStorage.setItem('role', userObj.role);
                console.log('保存role:', userObj.role);
            } else {
                console.log('警告：userObj 中没有 role 字段，无法保存');
            }

            localStorage.removeItem('guest');
            console.log('登录流程结束，准备跳转到首页');
            console.log('当前 localStorage 状态:', {
                user: localStorage.getItem('user'),
                role: localStorage.getItem('role'),
                authToken: !!localStorage.getItem('authToken')
            });
            
            // 根据 role 判断跳转页面
            let targetPage = '';
            if (userObj && userObj.role === 'doctor') {
                targetPage = 'doctorDashboard';
            } else if (userObj && userObj.role === 'admin') {
                targetPage = 'admin';
            } else {
                targetPage = ''; // 用户端首页
            }

            // 先派发事件通知 Navbar 更新状态
            try {
                window.dispatchEvent(new Event('localStorageUpdated'));
                console.log('派发 localStorageUpdated 事件');
            } catch (e) {
                console.error('派发事件失败:', e);
            }

            // 延迟跳转，给 Navbar 反应时间
            setTimeout(() => {
                if (typeof navigateTo === 'function') {
                    navigateTo(targetPage);
                } else {
                    window.location.href = targetPage ? `/${targetPage}` : '/';
                }
            }, 100);
        } catch (err) {
            const msg = (err && err.message) ? err.message : JSON.stringify(err);
            setError(msg || '登录失败');
            // refresh captcha on failure
            refreshCaptcha();
        }
    };

    return (
        <div className="min-h-[60vh] flex items-start justify-center">
            <div className="w-full max-w-md mx-4 mt-12 sm:mt-20 bg-white p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 text-center">登录</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm text-slate-600">电话</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border rounded"
                        placeholder="请输入电话号码，仅数字"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm text-slate-600">密码</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border rounded"
                        placeholder="请输入密码"
                        required
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex-1">
                    <label className="block text-sm text-slate-600">验证码</label>
                    <input
                        type="text"
                        value={captchaInput}
                        onChange={e => setCaptchaInput(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border rounded text-base placeholder-slate-400"
                        placeholder="输入图形验证码（不区分大小写）"
                        required
                    />
                    </div>
                    <div className="select-none px-2 py-1 rounded border bg-white shadow-sm cursor-pointer" title="点击刷新验证码">
                        {captchaImage ? (
                            <img src={captchaImage} alt="captcha" width={140} height={48} onClick={refreshCaptcha} />
                        ) : (
                            <canvas ref={canvasRef} width="140" height="48" onClick={refreshCaptcha} />
                        )}
                    </div>
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <div>
                    <button className="w-full px-4 py-3 bg-cyan-600 text-white rounded-lg shadow-sm">登录</button>
                    <div className="text-center mt-3">
                        <button type="button" onClick={() => navigateTo('register')} className="text-sm text-cyan-600">没有账号？注册</button>
                    </div>
                </div>
            </form>
            </div>
        </div>
    );
};

export default Login;
