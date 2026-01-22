import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Heart } from 'lucide-react';

const MarriageNode = ({ data }) => {
    return (
        <div className="flex items-center justify-center p-1 bg-white dark:bg-slate-800 rounded-full border border-pink-200 dark:border-pink-900 shadow-sm animate-pulse">
            {/* Handles for spouses (left and right) */}
            <Handle type="target" position={Position.Left} id="left" className="!bg-pink-400 !border-none !w-1 !h-1" />
            <Handle type="target" position={Position.Right} id="right" className="!bg-pink-400 !border-none !w-1 !h-1" />

            {/* Handle for children (bottom) */}
            <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-blue-400 !border-none !w-2 !h-2" />

            <div className="bg-pink-50 dark:bg-pink-900/30 p-1.5 rounded-full text-pink-600 dark:text-pink-400">
                <Heart size={14} fill="currentColor" />
            </div>
        </div>
    );
};

export default memo(MarriageNode);
