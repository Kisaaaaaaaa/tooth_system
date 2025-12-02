import React from 'react';

const ThreeDModelPage = ({ navigateTo }) => {
    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
            <div className="w-full h-full flex items-center justify-center">
                <div className="w-full h-full bg-white flex items-center justify-center">
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-slate-400 text-xl">3D 模型预览</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThreeDModelPage;
