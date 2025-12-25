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
            console.log('=== 后端返回验证码 ===');
            console.log('返回数据:', r);
            
            // 后端返回的是 { code: 200, message: '...', data: { captcha_id, captcha_image } }
            const data = r?.data || r;
            console.log('提取的 data:', data);
            
            if (data && (data.captcha_image || data.image || data.raw || data.captcha)) {
                console.log('检测到后端验证码，准备使用');
                if (data.captcha_image) {
                    console.log('使用后端图片验证码，ID:', data.captcha_id);
                    setCaptchaImage(data.captcha_image);
                    setCaptchaText('');
                    setCaptchaId(data.captcha_id || null);
                    setUseServerCaptcha(true);
                } else if (data.image) {
                    console.log('使用图片验证码');
                    setCaptchaImage(data.image);
                    setCaptchaText('');
                    setCaptchaId(data.id || data.captcha_id || null);
                    setUseServerCaptcha(true);
                } else if (data.raw) {
                    console.log('检测到raw字段');
                    if (/^[A-Za-z0-9+/=]+$/.test(data.raw)) {
                        console.log('raw是base64，作为图片使用');
                        setCaptchaImage('data:image/png;base64,' + data.raw);
                        setCaptchaText('');
                        setUseServerCaptcha(true);
                        setCaptchaId(null);
                    } else {
                        console.log('raw是文本验证码:', data.raw);
                        setCaptchaImage('');
                        setCaptchaText(data.raw);
                        setUseServerCaptcha(false);
                    }
                } else if (data.captcha) {
                    console.log('使用captcha字段:', data.captcha);
                    setCaptchaImage('');
                    setCaptchaText(String(data.captcha));
                    setUseServerCaptcha(true);
                    setCaptchaId(data.id || data.captcha_id || null);
                }
            } else {
                console.log('后端返回验证码失败或为null，保持本地验证码');
            }
        }).catch((err) => {
            // 保持本地验证码
            console.log('获取后端验证码异常，保持本地验证码:', err);
        });
        return () => { mounted = false; clearTimeout(timeoutId); };
    }, []);

    const [captchaId, setCaptchaId] = useState(null);
    const [useServerCaptcha, setUseServerCaptcha] = useState(false);

    const refreshCaptcha = async () => {
        try {
            const r = await api.getCaptcha();
            const data = r?.data || r;
            console.log('刷新验证码，返回数据:', data);
            
            // 后端返回的图片验证码
            if (data && data.captcha_image) {
                console.log('刷新为后端图片验证码，ID:', data.captcha_id);
                setCaptchaImage(data.captcha_image);
                setCaptchaText('');
                setUseServerCaptcha(true);
                setCaptchaId(data.captcha_id || null);
            } else if (data && data.image) {
                setCaptchaImage(data.image);
                setCaptchaText('');
                setUseServerCaptcha(true);
                setCaptchaId(data.id || data.captcha_id || null);
            } else if (data && data.raw) {
                if (/^[A-Za-z0-9+/=]+$/.test(data.raw)) {
                    setCaptchaImage('data:image/png;base64,' + data.raw);
                    setCaptchaText('');
                    setUseServerCaptcha(true);
                    setCaptchaId(null);
                } else {
                    setCaptchaImage('');
                    setCaptchaText(data.raw);
                    setUseServerCaptcha(false);
                }
            } else {
                const text = generateCaptcha(5);
                setCaptchaImage('');
                setCaptchaText(text);
                setUseServerCaptcha(false);
            }
        } catch (err) {
            console.log('刷新验证码失败:', err);
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

        if (!password) {
            setError('请输入密码');
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
            // 如果使用本地验证码，则不发送captcha_id
            const payload = { 
                phone, 
                password,
                // 只在使用服务器验证码时才发送captcha_id和captcha
                ...(useServerCaptcha ? { captcha_id: captchaId, captcha: captchaInput } : { captcha: captchaInput })
            };
            console.log('登录请求参数:', payload);
            console.log('使用服务器验证码:', useServerCaptcha);
            
            // 使用api.login函数确保使用正确的mock服务器地址
            const res = await api.login(payload);
            console.log('===== 登录响应完整内容 =====');
            console.log('res:', JSON.stringify(res, null, 2));

            // 业务失败（即使 HTTP 200 也要拦截提示）
            const bizCode = res?.code ?? res?.status ?? res?.data?.code;
            console.log('bizCode:', bizCode);
            
            // 特殊处理：医生审核未通过的情况
            const errorMsg = res?.message || res?.data?.message || '';
            if (bizCode && Number(bizCode) >= 400 && errorMsg.includes('审核未通过')) {
                console.log('检测到医生审核未通过，准备跳转到申请页面');
                // 提取拒绝原因（格式：审核未通过：原因）
                const reasonMatch = errorMsg.match(/审核未通过[：:]\s*(.+)/);
                const reasonMsg = reasonMatch ? reasonMatch[1] : '您的医生申请未通过审核';
                
                setError(`${errorMsg}。3秒后将跳转到申请页面重新填写。`);
                
                // 延迟跳转到注册页的医生申请步骤
                setTimeout(() => {
                    console.log('开始跳转到注册页面');
                    localStorage.setItem('doctorReapply', 'true');
                    localStorage.setItem('doctorRejectReason', reasonMsg);
                    localStorage.setItem('doctorReapplyPhone', phone);
                    if (typeof navigateTo === 'function') {
                        console.log('使用 navigateTo 跳转');
                        navigateTo('register');
                    } else {
                        console.log('使用 window.location.href 跳转');
                        window.location.href = '/register';
                    }
                }, 3000);
                return;
            }
            
            if (bizCode && Number(bizCode) >= 400) {
                const msg = errorMsg || '登录失败，请检查账号或验证码';
                console.log('检测到业务错误，提前返回');
                setError(msg);
                refreshCaptcha();
                return;
            }
            console.log('业务码检查通过，继续处理登录');
            
            // 提取 token 和 user 数据
            let token = null;
            let userData = null;
            
            // 后端返回格式: { code: 200, message: '...', data: { user: {...}, access_token: '...', refresh_token: '...' } }
            if (res && res.data) {
                console.log('检测到 res.data 结构');
                const data = res.data;
                
                // 尝试从 data 中提取 token
                if (data.access_token) {
                    token = data.access_token;
                    console.log('从 data.access_token 提取 token');
                } else if (data.token) {
                    token = data.token;
                    console.log('从 data.token 提取 token');
                }
                
                // 尝试从 data 中提取用户数据
                if (data.user) {
                    userData = data.user;
                    console.log('从 data.user 提取用户数据');
                } else {
                    userData = data;
                    console.log('使用 data 作为用户数据');
                }
                
                // 保存 refresh token
                if (data.refresh_token) {
                    localStorage.setItem('refresh_token', data.refresh_token);
                    console.log('保存 refresh_token');
                }
            } else if (res && res.access_token) {
                token = res.access_token;
                userData = res;
                console.log('直接从 res.access_token 提取 token');
            } else if (res && res.token) {
                token = res.token;
                userData = res;
                console.log('直接从 res.token 提取 token');
            }
            
            // 保存 token
            if (token) {
                localStorage.setItem('access_token', token);
                localStorage.setItem('authToken', token);  // 兼容旧代码
                console.log('Token 已保存，值:', token.substring(0, 20) + '...');
            } else {
                console.warn('未能提取 token，登录响应可能格式不正确');
                localStorage.setItem('authToken', 'test-token-' + Date.now());
            }

            // 写入用户信息（兼容后端返回格式）
            // 后端返回格式: { code: 200, message: '...', data: { user: {...}, access_token: '...', ... } }
            let userObj = null;
            
            if (userData) {
                if (userData.user && typeof userData.user === 'object') {
                    userObj = userData.user;
                    console.log('从 userData.user 提取用户对象');
                } else {
                    userObj = userData;
                    console.log('使用 userData 作为用户对象');
                }
            } else if (res && res.data && res.data.user) {
                userObj = res.data.user;
                console.log('从 res.data.user 提取用户对象');
            }
            
            if (userObj) {
                localStorage.setItem('user', JSON.stringify(userObj));
                console.log('设置用户信息:', userObj.phone || userObj.name || userObj.id);
            } else {
                console.warn('未能提取用户信息');
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
            
            // 检查是否有审核被拒绝的提示
            const loginNotice = res?.data?.login_notice || '';
            const rejectedReason = res?.data?.rejected_reason || '';
            
            console.log('===== 医生状态检查 =====');
            console.log('userObj:', userObj);
            console.log('role:', userObj?.role);
            console.log('status:', userObj?.status);
            console.log('rejected_reason:', rejectedReason);
            
            // 如果是被拒绝的医生，显示拒绝原因并跳转到申请页面
            if (userObj && userObj.role === 'doctor' && (userObj.status === 'inactive' || rejectedReason)) {
                const reasonMsg = rejectedReason || userObj.rejected_reason || '您的医生申请未通过审核';
                console.log('检测到被拒绝的医生，准备跳转');
                console.log('拒绝原因:', reasonMsg);
                setError(`审核未通过：${reasonMsg}。3秒后将跳转到申请页面重新填写。`);
                
                // 延迟跳转到注册页的医生申请步骤
                setTimeout(() => {
                    console.log('开始跳转到注册页面');
                    // 先保存当前信息，以便在申请页可以复用
                    localStorage.setItem('doctorReapply', 'true');
                    localStorage.setItem('doctorRejectReason', reasonMsg);
                    if (typeof navigateTo === 'function') {
                        console.log('使用 navigateTo 跳转');
                        navigateTo('register');
                    } else {
                        console.log('使用 window.location.href 跳转');
                        window.location.href = '/register';
                    }
                }, 3000);
                return;
            }
            
            console.log('医生状态正常或非医生角色，继续正常登录流程');
            
            // 根据 role 判断跳转页面
            let targetPage = '';
            if (userObj && userObj.role === 'doctor') {
                targetPage = 'doctorAppointments';
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
