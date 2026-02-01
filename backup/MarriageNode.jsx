import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Heart } from 'lucide-react';

const MarriageNode = ({ data }) => {
    const isDivorced = data.status === 'divorced';

    return (
        <div className={`flex items-center justify-center p-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border ${isDivorced ? 'border-slate-300 dark:border-slate-600 shadow-slate-100 dark:shadow-slate-900/20' : 'border-pink-300 dark:border-pink-800 shadow-pink-100 dark:shadow-pink-900/20'} shadow-lg group transition-all duration-300 hover:scale-110`}>
            {/* Handles for spouses (left and right) */}
            <Handle type="target" position={Position.Left} id="left" className={`!border-none !w-2 !h-2 opacity-0 group-hover:opacity-100 transition-opacity ${isDivorced ? '!bg-slate-400' : '!bg-pink-400'}`} />
            <Handle type="target" position={Position.Right} id="right" className={`!border-none !w-2 !h-2 opacity-0 group-hover:opacity-100 transition-opacity ${isDivorced ? '!bg-slate-400' : '!bg-pink-400'}`} />

            {/* Handle for children (bottom) */}
            <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-blue-400 !border-none !w-2 !h-2 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className={`bg-gradient-to-br ${isDivorced ? 'from-slate-400 to-slate-500' : 'from-pink-400 to-rose-500'} p-2 rounded-full text-white shadow-inner relative overflow-hidden`}>
                <Heart size={16} fill="currentColor" className={`relative z-10 ${isDivorced ? '' : 'animate-pulse'}`} />
                {!isDivorced && <div className="absolute inset-0 bg-white/20 animate-ping rounded-full" />}
            </div>
        </div>
    );
};

export default memo(MarriageNode);
