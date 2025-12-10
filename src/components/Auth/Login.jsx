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
    const [captcha, setCaptcha] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // try fetch server captcha; fallback to local generated captcha
        let mounted = true;
        api.getCaptcha().then(r => {
            if (!mounted) return;
            // server may return { id, image } or raw text
            if (r && (r.image || r.raw || r.captcha)) {
                // if image provided, display image; if raw text, treat as captcha string
                if (r.image) {
                    setCaptcha(r.image);
                    setCaptchaId(r.id || r.captcha_id || null);
                    setUseServerCaptcha(true);
                } else if (r.raw) {
                    // if it's base64 data without data: prefix, add prefix
                    if (/^[A-Za-z0-9+/=]+$/.test(r.raw)) {
                        setCaptcha('data:image/png;base64,' + r.raw);
                        setUseServerCaptcha(true);
                        setCaptchaId(null);
                    } else {
                        setCaptcha(r.raw);
                        setUseServerCaptcha(false);
                    }
                } else {
                    setCaptcha(String(r));
                }
            } else {
                setCaptcha(generateCaptcha(5));
            }
        }).catch(() => {
            setCaptcha(generateCaptcha(5));
        });
        return () => { mounted = false; };
    }, []);

    const [captchaId, setCaptchaId] = useState(null);
    const [useServerCaptcha, setUseServerCaptcha] = useState(false);

    const refreshCaptcha = async () => {
        try {
            const r = await api.getCaptcha();
            if (r && r.image) {
                setCaptcha(r.image);
                setUseServerCaptcha(true);
                setCaptchaId(r.id || r.captcha_id || null);
            } else if (r && r.raw) {
                if (/^[A-Za-z0-9+/=]+$/.test(r.raw)) {
                    setCaptcha('data:image/png;base64,' + r.raw);
                    setUseServerCaptcha(true);
                    setCaptchaId(null);
                } else {
                    setCaptcha(r.raw);
                    setUseServerCaptcha(false);
                }
            } else {
                setCaptcha(generateCaptcha(5));
                setUseServerCaptcha(false);
            }
        } catch (err) {
            setCaptcha(generateCaptcha(5));
            setUseServerCaptcha(false);
        }
    };

    const canvasRef = useRef(null);

    const drawCaptchaCanvas = () => {
        // don't draw local canvas when server captcha image is used
        if (useServerCaptcha || (typeof captcha === 'string' && captcha.startsWith('data:image/'))) return;
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
        const chars = captcha.split('');
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
        // redraw when captcha changes
    }, [captcha]);

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

        if (captchaInput.trim().toUpperCase() !== captcha) {
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
            
            // 直接调用fetch，不经过api.login，以便更直接地查看响应
            const myHeaders = new Headers();
            myHeaders.append('Content-Type', 'application/json');
            const body = JSON.stringify(payload);
            const requestOptions = { method: 'POST', headers: myHeaders, body, redirect: 'follow' };
            
            console.log('发送登录请求到:', `http://10.83.132.102:8000/api/auth/login/`);
            const rawResponse = await fetch(`http://10.83.132.102:8000/api/auth/login/`, requestOptions);
            console.log('原始响应状态:', rawResponse.status);
            console.log('原始响应头:', Object.fromEntries(rawResponse.headers.entries()));
            
            // 直接解析响应
            const responseText = await rawResponse.text();
            console.log('原始响应文本:', responseText);
            
            let res;
            try {
                res = JSON.parse(responseText);
                console.log('解析后的响应JSON:', res);
            } catch (e) {
                console.log('响应不是JSON，使用文本:', responseText);
                res = responseText;
            }
            
            // 手动设置localStorage
            if (res && res.token) {
                console.log('手动设置token:', res.token);
                localStorage.setItem('authToken', res.token);
                console.log('设置后的authToken:', localStorage.getItem('authToken'));
            } else if (typeof res === 'string' && res.length > 0) {
                console.log('手动设置token为字符串:', res);
                localStorage.setItem('authToken', res);
                console.log('设置后的authToken:', localStorage.getItem('authToken'));
            } else {
                console.log('登录响应格式异常，无法提取token:', res);
                // 模拟登录成功，设置测试token
                localStorage.setItem('authToken', 'test-token-' + Date.now());
                console.log('模拟设置token:', localStorage.getItem('authToken'));
            }
            
            console.log('localStorage中间状态:', {
                authToken: localStorage.getItem('authToken'),
                user: localStorage.getItem('user')
            });
            
            // 跳过获取用户信息，直接测试
            localStorage.removeItem('guest');
            console.log('登录流程结束，准备跳转到首页');
            navigateTo('home');
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
                            value={captchaInput}
                            onChange={e => setCaptchaInput(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded text-base placeholder-slate-400"
                            placeholder="输入图形验证码（不区分大小写）"
                            required
                        />
                    </div>
                    <div className="select-none px-2 py-1 rounded border bg-white shadow-sm cursor-pointer" title="点击刷新验证码">
                        {useServerCaptcha && captcha ? (
                            // server returned an image (data URI) or text
                            <img src={captcha} alt="captcha" width={140} height={48} onClick={refreshCaptcha} />
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
