import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RecordsList from '../Records/RecordsList';

// 病历页面：列表 + 详情（侧边/内联展示）
const RecordsPage = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const navigate = useNavigate();

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
            </div>

            <RecordsList
                key={refreshKey}
                onSelect={(id) => navigate(`/records/${id}`)}
                onRefresh={() => setRefreshKey(k => k + 1)}
            />
        </div>
    );
};

export default RecordsPage;

