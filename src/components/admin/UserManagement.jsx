import React, { useEffect, useState } from 'react';
import adminApi from '../../api/admin';

const UserManagement = () => {
  const [allUsers, setAllUsers] = useState([]); // 存储所有用户数据
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, blacklisted, normal
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState(''); // 用于实际查询的关键词

  // 获取用户列表（获取所有数据，不传分页参数）
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // 清理 keyword，去除前后空格和制表符
      const cleanKeyword = searchKeyword.trim();
      // 获取所有用户数据（不传page和page_size，让后端返回所有数据）
      const data = await adminApi.getUsers({ status: '', role: 'user', keyword: cleanKeyword });
      const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      // 映射后端返回的字段到前端使用的字段
      const normalized = list.map(u => ({
        id: u.id,
        name: u.name || u.username || u.phone || `用户${u.id}`,
        phone: u.phone || '',
        missedSignIns: u.no_show_count ?? 0,  // 后端返回 no_show_count
        blacklisted: u.status === 'blacklisted',  // 根据 status 判断是否拉黑
        role: u.role || 'user',
        registeredAt: u.created_at || '',  // 后端返回 created_at，直接保留字符串格式
        lastLoginAt: u.updated_at || ''   // 后端返回 updated_at，直接保留字符串格式
      }));
      // 兜底前端过滤，确保只展示 role=user
      const filteredUsers = normalized.filter(u => u.role === 'user');
      setAllUsers(filteredUsers);
      // 重置到第一页
      setPage(1);
    } catch (err) {
      setError('获取用户数据失败');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchKeyword]);

  // 切换用户拉黑状态
  const toggleBlacklist = async (id, currentStatus) => {
    try {
      if (currentStatus) {
        await adminApi.unblacklistUser(id);
      } else {
        await adminApi.blacklistUser(id);
      }
      // 成功后更新本地状态
      setAllUsers(prev => prev.map(u => u.id === id ? { ...u, blacklisted: !currentStatus } : u));
    } catch (err) {
      setError('操作失败');
      console.error('Error toggling blacklist:', err);
    }
  };

  // 自动拉黑未按时签到超过5次的用户
  const autoBlacklist = async () => {
    try {
      // 在真实场景中调用API
      // await adminApi.autoBlacklistUsers();
      
      // 模拟API调用
      setAllUsers(prev => prev.map(u => ({ ...u, blacklisted: u.missedSignIns > 5 })));
    } catch (err) {
      setError('自动拉黑失败');
      console.error('Error auto blacklisting:', err);
    }
  };

  // 过滤用户列表
  const filteredUsers = allUsers.filter(user => {
    if (filter === 'blacklisted') return user.blacklisted;
    if (filter === 'normal') return !user.blacklisted;
    return true;
  });
  
  // 前端分页：计算当前页应该显示的数据
  const totalCount = filteredUsers.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  if (loading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <h3 className="text-lg font-medium">用户管理</h3>
        <div className="flex items-center gap-2">
          {/* 搜索与状态筛选 */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setSearchKeyword(keyword.trim()); } }}
              placeholder="搜索用户名"
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(parseInt(e.target.value) || 10); setPage(1); }}
              className="px-3 py-2 border rounded-lg text-sm"
              title="每页数量"
            >
              <option value={10}>每页 10</option>
              <option value={20}>每页 20</option>
              <option value={50}>每页 50</option>
            </select>
            <button
              onClick={() => { setSearchKeyword(keyword.trim()); }}
              className="px-3 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-700"
            >
              查询
            </button>
            <span className="text-sm text-slate-500 ml-2">共 {totalCount} 条</span>
          </div>
          {/* 过滤选项 */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button 
              onClick={() => { setFilter('all'); setPage(1); }}
              className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-white shadow text-cyan-600' : 'text-slate-600'}`}
            >
              全部 ({allUsers.length})
            </button>
            <button 
              onClick={() => { setFilter('normal'); setPage(1); }}
              className={`px-3 py-1 rounded text-sm ${filter === 'normal' ? 'bg-white shadow text-cyan-600' : 'text-slate-600'}`}
            >
              正常 ({allUsers.filter(u => !u.blacklisted).length})
            </button>
            <button 
              onClick={() => { setFilter('blacklisted'); setPage(1); }}
              className={`px-3 py-1 rounded text-sm ${filter === 'blacklisted' ? 'bg-white shadow text-rose-600' : 'text-slate-600'}`}
            >
              已拉黑 ({allUsers.filter(u => u.blacklisted).length})
            </button>
          </div>
          
          {/* 自动拉黑按钮（本地规则） */}
          <button 
            onClick={autoBlacklist} 
            className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700 transition-colors"
          >
            自动拉黑：未按时签到超过5次
          </button>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                用户名
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                手机号
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                未按时签到次数
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                注册时间
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                最近登录
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                  暂无用户数据
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr key={user.id} className={user.blacklisted ? 'opacity-70' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-500">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${user.missedSignIns > 5 ? 'text-rose-600 font-medium' : 'text-slate-500'}`}>
                      {user.missedSignIns} 次
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-500">
                      {user.registeredAt || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-500">
                      {user.lastLoginAt || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => toggleBlacklist(user.id, user.blacklisted)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${user.blacklisted ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-rose-600 text-white hover:bg-rose-700'}`}
                    >
                      {user.blacklisted ? '解除拉黑' : '拉黑'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            上一页
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              disabled={loading}
              className={`px-3 py-1 rounded text-sm ${
                p === page ? 'bg-cyan-600 text-white' : 'border hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            下一页
          </button>
        </div>
      )}
      
      {/* 统计信息 */}
      <div className="mt-5 p-3 bg-slate-50 rounded-lg">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="font-medium">总用户数：</span>
            <span>{allUsers.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">正常用户：</span>
            <span>{allUsers.filter(u => !u.blacklisted).length}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">已拉黑用户：</span>
            <span className="text-rose-600">{allUsers.filter(u => u.blacklisted).length}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">未按时签到超过5次的用户：</span>
            <span className="text-rose-600">{allUsers.filter(u => u.missedSignIns > 5).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
