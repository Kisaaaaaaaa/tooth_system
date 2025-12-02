import React, { useEffect, useRef, useState } from 'react';
// 如果需要对接后端，请在 `src/api/auth.js` 中实现并导入 login 方法
// import { login as apiLogin } from '../../api/auth';

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
        setCaptcha(generateCaptcha(5));
    }, []);

    const refreshCaptcha = () => setCaptcha(generateCaptcha(5));

    const canvasRef = useRef(null);

    const drawCaptchaCanvas = () => {
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
            setError('请输入有效的电话号码（仅数字，7-15位）');
            return;
        }

        if (captchaInput.trim().toUpperCase() !== captcha) {
            setError('验证码错误，请刷新后重试');
            refreshCaptcha();
            setCaptchaInput('');
            return;
        }

        // 前端示例：保存用户并视为已登录（实际请调用后端 API）
        const user = { phone };
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.removeItem('guest');
        navigateTo('home');

        // 如果对接后端，示例：
        // try {
        //   const res = await apiLogin({ phone, password });
        //   // 处理后端返回（token、user 等）
        // } catch (err) {
        //   setError(err.message || '登录失败');
        // }
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
                        <canvas ref={canvasRef} width="140" height="48" onClick={refreshCaptcha} />
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
