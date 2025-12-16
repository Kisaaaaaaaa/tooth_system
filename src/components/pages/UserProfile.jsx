  // 邮箱格式校验
  function isValidEmail(email) {
    return /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(email);
  }

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/auth';

const UserProfile = () => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ name: '', phone: '', email: '', avatar: '', password: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [emailEdit, setEmailEdit] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [codeTimer, setCodeTimer] = useState(0);
  const navigate = useNavigate();

  // 同步用户信息到 localStorage，并派发事件通知 Navbar 刷新
  const syncLocalUser = (patch = {}) => {
    try {
      const raw = localStorage.getItem('user');
      const userObj = raw ? JSON.parse(raw) : {};
      const updated = { ...userObj, ...patch };
      localStorage.setItem('user', JSON.stringify(updated));
      if (updated.role) localStorage.setItem('role', updated.role);
      window.dispatchEvent(new Event('localStorageUpdated'));
    } catch (e) {
      console.error('syncLocalUser 失败:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const res = await api.me();
        // 兼容mock返回结构
        const user = res.data || res;
        setProfile({
          name: user.name ?? '',
          phone: user.phone ?? '',
          email: user.email ?? '',
          avatar: user.avatar ?? '',
          password: user.password ?? '',
        });
      } catch (e) {
        setError(e.message || '获取用户信息失败');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const uploadAvatarPreview = async (file) => {
    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setProfile(p => ({ ...p, avatar: previewUrl }));
    setError('');
    setMessage('');
    try {
      setLoading(true);
      const res = await api.uploadAvatar(file, true);
      const url = res?.data?.url || res?.url || res?.data?.path || res?.path || res?.data?.image_url || res?.image_url;
      if (url) {
        setProfile(p => ({ ...p, avatar: url }));
        // 同步到 localStorage，便于 Navbar 立即刷新头像
        syncLocalUser({ avatar: url });
        setMessage('头像已上传');
      } else {
        setMessage('上传成功，但未返回头像地址');
      }
    } catch (e) {
      setError(e.message || '上传头像失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存邮箱
  const handleSaveEmail = async () => {
    setError(''); setMessage('');
    if (!profile.email) {
      setError('请输入邮箱');
      return;
    }
    if (!isValidEmail(profile.email)) {
      setError('邮箱格式不正确');
      return;
    }
    try {
      setLoading(true);
      // 仅通过 auth.me 更新邮箱，不再携带 avatar URL
      await api.updateMe({ email: profile.email });
      setMessage('邮箱已保存');
      setEmailEdit(false);
      syncLocalUser({ email: profile.email });
    } catch (e) {
      setError(e.message || '保存邮箱失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存资料（姓名/电话）
  const handleUpdateProfile = async () => {
    setError(''); setMessage('');
    if (!profile.email) {
      setError('请先填写并保存邮箱，才能修改其他信息');
      return;
    }
    try {
      setLoading(true);
      // 只更新可由该接口修改的文本字段（如 name），不再把 avatar URL 传给后端
      await api.updateProfile({ name: profile.name });
      setMessage('资料已更新');
      syncLocalUser({ name: profile.name });
      setEditMode(false);
    } catch (e) {
      setError(e.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    setError(''); setMessage('');
    if (!profile.email) { setError('请先填写并保存邮箱'); return; }
    if (!isValidEmail(profile.email)) { setError('邮箱格式不正确'); return; }
    try {
      setLoading(true);
      await api.sendEmailCode({ email: profile.email });
      setMessage('验证码已发送到邮箱');
      setCodeTimer(60);
    } catch (e) {
      setError(e.message || '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  // 倒计时副作用
  React.useEffect(() => {
    if (codeTimer > 0) {
      const timer = setTimeout(() => setCodeTimer(codeTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [codeTimer]);

  const handleChangePassword = async () => {
    setError(''); setMessage('');
    if (!profile.email) {
      setError('请先填写并保存邮箱，才能修改密码');
      return;
    }
    if (!oldPwd || !newPwd || !emailCode) {
      setError('请填写完整信息');
      return;
    }
    try {
      setLoading(true);
      console.log('[用户端] 开始发送密码修改请求...');
      const payload = { old_password: oldPwd, new_password: newPwd, email: profile.email, code: emailCode };
      console.log('[用户端] 请求体:', { ...payload, old_password: '***', new_password: '***' });
      await api.changePasswordWithCode(payload);
      console.log('[用户端] 密码修改成功');
      setMessage('密码已修改，正在跳转首页...');
      // 直接跳转到首页
      navigate('/');
      setOldPwd(''); setNewPwd(''); setEmailCode('');
    } catch (e) {
      console.error('[用户端] 密码修改失败:', e);
      setError(e.message || '修改密码失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto py-10 px-6 md:px-12 lg:px-20">
      <h2 className="text-3xl font-bold mb-8 text-center tracking-wide">个人信息</h2>
      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-10 border border-slate-100">
        {/* 头像 */}
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-200 border-2 border-slate-300 shadow-sm flex-shrink-0">
            {profile.avatar ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400">无头像</div>}
          </div>
          <div className="space-y-3 w-full max-w-md">
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 border rounded cursor-pointer text-sm font-medium">
              上传头像
              <input type="file" accept="image/*" className="hidden" onChange={(e)=>{ if(e.target.files?.[0]) uploadAvatarPreview(e.target.files[0]); }} />
            </label>
            <input
              type="text"
              className="border rounded px-2 py-2 text-sm w-full"
              placeholder="或粘贴头像 URL"
              value={profile.avatar || ''}
              onChange={(e)=>setProfile(p=>({...p, avatar: e.target.value }))}
            />
          </div>
        </div>

        {/* 邮箱区域 */}
        <div className="space-y-2">
          <label className="text-sm text-slate-600 font-medium">邮箱</label>
          <div className="flex gap-2 items-center">
            <input
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-cyan-200 transition"
              value={emailEdit ? profile.email : (profile.email || '')}
              onChange={e=>{
                if (emailEdit) {
                  setProfile(p=>({...p, email: e.target.value}))
                }
              }}
              onFocus={()=>{
                if (!emailEdit) setEmailEdit(true);
              }}
              disabled={false}
              placeholder="请填写邮箱"
            />
            {emailEdit ? (
              <button className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm transition whitespace-nowrap" onClick={handleSaveEmail} disabled={loading}>保存邮箱</button>
            ) : (
              <button className="px-3 py-2 border rounded text-sm hover:bg-slate-100 transition whitespace-nowrap" onClick={()=>setEmailEdit(true)}>修改</button>
            )}
          </div>
        </div>

        {/* 只读信息展示/编辑 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm text-slate-600">姓名</label>
            {editMode ? (
              <input className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-cyan-200 transition" value={profile.name} onChange={e=>setProfile(p=>({...p, name: e.target.value}))} />
            ) : (
              <div className="px-3 py-2 bg-slate-50 rounded border text-slate-700">{profile.name || <span className="text-slate-400">未填写</span>}</div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-600">电话</label>
            {editMode ? (
              <input className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-cyan-200 transition" value={profile.phone} onChange={e=>setProfile(p=>({...p, phone: e.target.value}))} />
            ) : (
              <div className="px-3 py-2 bg-slate-50 rounded border text-slate-700">{profile.phone || <span className="text-slate-400">未填写</span>}</div>
            )}
          </div>
        </div>

        {/* 编辑按钮 */}
        <div className="flex gap-3 mt-2">
          {editMode ? (
            <>
              <button onClick={handleUpdateProfile} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm transition" disabled={loading}>保存资料</button>
              <button onClick={()=>setEditMode(false)} className="px-4 py-2 border rounded text-sm hover:bg-slate-100 transition">取消</button>
            </>
          ) : (
            <button onClick={()=>{
              if (!profile.email) {
                setError('请先填写并保存邮箱，才能修改其他信息');
                return;
              }
              setEditMode(true);
            }} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm transition">编辑资料</button>
          )}
        </div>

        {/* 邮箱验证码按钮已移除，仅在更改密码区域显示 */}

        {/* 更改密码区域 */}
        <div className="border-t pt-6">
          <h3 className="text-xl font-semibold mb-4">更改密码</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-slate-600 font-medium">旧密码</label>
              <input type="password" className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-cyan-200 transition" value={oldPwd} onChange={e=>setOldPwd(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600 font-medium">新密码</label>
              <input type="password" className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-cyan-200 transition" value={newPwd} onChange={e=>setNewPwd(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600 font-medium">邮箱验证码</label>
              <div className="flex gap-2">
                <input className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-cyan-200 transition" value={emailCode} onChange={e=>setEmailCode(e.target.value)} />
                <button
                  onClick={() => {
                    if (!profile.email) {
                      setError('请先填写并保存邮箱');
                      return;
                    }
                    handleSendCode();
                  }}
                  className="px-3 py-2 border rounded text-sm hover:bg-slate-100 transition whitespace-nowrap disabled:opacity-60"
                  disabled={loading || codeTimer > 0}
                >
                  {codeTimer > 0 ? `重新发送(${codeTimer}s)` : '发送邮箱验证码'}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button onClick={handleChangePassword} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-sm transition" disabled={loading}>提交更改</button>
          </div>
        </div>

        {(message || error) && (
          <div className={`p-3 rounded text-sm mt-4 ${error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{error || message}</div>
        )}
        {loading && <div className="text-sm text-slate-500 mt-2">处理中...</div>}
      </div>
    </div>
  );
};

export default UserProfile;
