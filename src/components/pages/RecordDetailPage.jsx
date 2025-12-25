import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RecordDetail from '../Records/RecordDetail';

const RecordDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                >
                    返回
                </button>
                <div className="text-sm text-slate-500">病历详情</div>
            </div>

            <RecordDetail
                id={id}
                onClose={() => navigate(-1)}
                // 详情页里提交评价后，保持在本页并刷新详情（RecordDetail 内部会刷新）
                onRated={() => { }}
            />
        </div>
    );
};

export default RecordDetailPage;
