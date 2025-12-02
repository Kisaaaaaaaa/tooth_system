import React from 'react';

// --- 3D模型组件(使用CSS 3D模拟科技感) ---
const TechToothModel = () => {
    return (
        <div className="w-full h-64 flex items-center justify-center perspective-1000 overflow-hidden relative">
            <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full animate-pulse"></div>
            {/* CSS 3D Rotating Cube representing a stylized tech tooth */}
            <div className="relative w-32 h-32 transform-style-3d animate-spin-slow">
                <div className="absolute inset-0 border-2 border-cyan-400/50 bg-cyan-500/10 backdrop-blur-sm transform translate-z-16 flex items-center justify-center text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.5)]">TOP</div>
                <div className="absolute inset-0 border-2 border-cyan-400/50 bg-cyan-500/10 backdrop-blur-sm transform -translate-z-16 flex items-center justify-center text-cyan-200">BOTTOM</div>
                <div className="absolute inset-0 border-2 border-cyan-400/50 bg-cyan-500/10 backdrop-blur-sm transform rotate-y-90 translate-z-16 flex items-center justify-center text-cyan-200">RIGHT</div>
                <div className="absolute inset-0 border-2 border-cyan-400/50 bg-cyan-500/10 backdrop-blur-sm transform rotate-y-90 -translate-z-16 flex items-center justify-center text-cyan-200">LEFT</div>
                <div className="absolute inset-0 border-2 border-cyan-400/50 bg-cyan-500/10 backdrop-blur-sm transform rotate-x-90 translate-z-16 flex items-center justify-center text-cyan-200">FRONT</div>
                <div className="absolute inset-0 border-2 border-cyan-400/50 bg-cyan-500/10 backdrop-blur-sm transform rotate-x-90 -translate-z-16 flex items-center justify-center text-cyan-200">BACK</div>
                {/* Core Glow */}
                <div className="absolute inset-8 bg-white/30 blur-md rounded-full transform-style-3d animate-pulse"></div>
            </div>
            <div className="absolute bottom-4 text-cyan-600 text-xs font-mono tracking-widest">INTERACTIVE 3D VIEW</div>
            <style>{`
                .perspective-1000 {perspective: 1000px;}
                .transform-style-3d {transform-style: preserve-3d;}
                .translate-z-16 {transform: translateZ(4rem);}
                .-translate-z-16 {transform: translateZ(-4rem);}
                .rotate-y-90 {transform: rotateY(90deg);}
                .rotate-x-90 {transform: rotateX(90deg);}
                .animate-spin-slow {animation: spin 8s infinite linear;}
                @keyframes spin {
                    0% {transform: rotateX(0deg) rotateY(0deg);}
                    100% {transform: rotateX(360deg) rotateY(360deg);}
                }
            `}</style>
        </div>
    );
};

export default TechToothModel;

