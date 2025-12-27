import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RecordDetail from '../Records/RecordDetail';

const RecordDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    return (
        <div className="space-y-4 animate-fade-in">
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
