import React, { useEffect, useState } from 'react';
import adminApi from '../../api/admin';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, blacklisted, normal

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // 在真实场景中调用API
      // const usersData = await adminApi.getUsers();
      
      // 使用模拟数据
      const mockUsers = [];
      for (let i = 1; i <= 15; i++) {
        mockUsers.push({
          id: i,
          name: `用户${i}`,
          phone: `1380000${100 + i}`,
          missedSignIns: Math.floor(Math.random() * 10),
          blacklisted: Math.random() > 0.8, // 20%的用户被拉黑
          registeredAt: Date.now() - Math.floor(Math.random() * 31536000000), // 随机注册时间
          lastLoginAt: Date.now() - Math.floor(Math.random() * 604800000) // 随机最近登录时间
        });
      }
      
      setUsers(mockUsers);
    } catch (err) {
      setError('获取用户数据失败');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 切换用户拉黑状态
  const toggleBlacklist = async (id, currentStatus) => {
    try {
      // 在真实场景中调用API
      // await adminApi.toggleUserBlacklist(id, !currentStatus);
      
      // 模拟API调用
      setUsers(prev => prev.map(u => u.id === id ? { ...u, blacklisted: !currentStatus } : u));
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
      setUsers(prev => prev.map(u => ({ ...u, blacklisted: u.missedSignIns > 5 })));
    } catch (err) {
      setError('自动拉黑失败');
      console.error('Error auto blacklisting:', err);
    }
  };

  // 过滤用户列表
  const filteredUsers = users.filter(user => {
    if (filter === 'blacklisted') return user.blacklisted;
    if (filter === 'normal') return !user.blacklisted;
    return true;
  });

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
          {/* 过滤选项 */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-white shadow text-cyan-600' : 'text-slate-600'}`}
            >
              全部 ({users.length})
            </button>
            <button 
              onClick={() => setFilter('normal')}
              className={`px-3 py-1 rounded text-sm ${filter === 'normal' ? 'bg-white shadow text-cyan-600' : 'text-slate-600'}`}
            >
              正常 ({users.filter(u => !u.blacklisted).length})
            </button>
            <button 
              onClick={() => setFilter('blacklisted')}
              className={`px-3 py-1 rounded text-sm ${filter === 'blacklisted' ? 'bg-white shadow text-rose-600' : 'text-slate-600'}`}
            >
              已拉黑 ({users.filter(u => u.blacklisted).length})
            </button>
          </div>
          
          {/* 自动拉黑按钮 */}
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
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                  暂无用户数据
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
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
                      {new Date(user.registeredAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-500">
                      {new Date(user.lastLoginAt).toLocaleDateString()}
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
      
      {/* 统计信息 */}
      <div className="mt-5 p-3 bg-slate-50 rounded-lg">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="font-medium">总用户数：</span>
            <span>{users.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">正常用户：</span>
            <span>{users.filter(u => !u.blacklisted).length}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">已拉黑用户：</span>
            <span className="text-rose-600">{users.filter(u => u.blacklisted).length}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">未按时签到超过5次的用户：</span>
            <span className="text-rose-600">{users.filter(u => u.missedSignIns > 5).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
