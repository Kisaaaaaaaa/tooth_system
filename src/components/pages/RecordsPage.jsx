import React, { useState } from 'react';
import RecordsList from '../Records/RecordsList';
import RecordDetail from '../Records/RecordDetail';

// 病历页面：列表 + 详情（侧边/内联展示）
const RecordsPage = () => {
    const [selectedId, setSelectedId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800">就诊档案</h2>
            <div className="text-sm text-slate-500">仅显示当前登录用户的病例；无法查询或查看其他用户的病例。</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <RecordsList key={refreshKey} onSelect={(id) => setSelectedId(id)} />
                </div>

                <div className="md:col-span-1">
                    {selectedId ? (
                        <RecordDetail id={selectedId} onClose={() => setSelectedId(null)} onRated={() => setRefreshKey(k=>k+1)} />
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm p-6 text-sm text-slate-500">请选择左侧的病例以查看详情或评价。</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecordsPage;

