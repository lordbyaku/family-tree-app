import { memo, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Trash2, Info, Filter, GitBranch } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatDateDisplay } from '../utils/date';

const CustomNode = ({ id, data }) => {
    const { deleteMember } = useFamily();
    const isMale = data.gender === 'male';
    const timerRef = useRef(null);
    const toast = useToast();
    const { isAdmin } = useAuth();
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    // Styles based on gender: Blue for Male, Pink for Female, Gray for Deceased
    // Updated for Dark Mode
    const bgClass = data.isHighlighted
        ? (data.isDarkMode ? 'bg-slate-800 border-blue-500 ring-4 ring-blue-500/30 ring-offset-2 ring-offset-slate-900' : 'bg-white border-blue-600 ring-4 ring-blue-600/20 ring-offset-2')
        : (data.isDeceased
            ? 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
            : (isMale
                ? 'bg-blue-50/50 border-blue-100 dark:bg-slate-800 dark:border-blue-900/50'
                : 'bg-pink-50/50 border-pink-100 dark:bg-slate-800 dark:border-pink-900/50'));

    const textClass = data.isDeceased
        ? 'text-slate-600 dark:text-slate-400'
        : (isMale
            ? 'text-blue-700 dark:text-blue-300'
            : 'text-pink-700 dark:text-pink-300');

    const iconBg = data.isDeceased
        ? 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
        : (isMale
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'
            : 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300');

    const handlePointerDown = (e) => {
        // Only trigger on left click or touch
        if (e.button !== 0 && e.type !== 'touchstart') return;
        if (!isAdmin) return;

        timerRef.current = setTimeout(() => {
            if (data.onEdit) {
                // Pass the member ID to the edit handler
                data.onEdit(id);
                // Vibrate if on mobile to indicate success
                if (navigator.vibrate) navigator.vibrate(50);
            }
        }, 5000); // 5 seconds as requested
    };

    const handlePointerUp = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const handlePointerLeave = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const confirm = useConfirm();

    const handleDelete = (e) => {
        e.stopPropagation(); // Prevent node selection/drag start
        confirm({
            title: 'Hapus Anggota?',
            message: `Apakah Anda yakin ingin menghapus ${data.name}?`,
            onConfirm: () => {
                deleteMember(id);
            }
        });
    };

    return (
        <div
            className={`w-64 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] dark:shadow-none rounded-2xl border ${bgClass} overflow-hidden font-sans relative group select-none cursor-pointer transition-all duration-300 active:scale-95 backdrop-blur-sm`}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (data.onFilterRequest) {
                    setMenuPosition({ x: e.clientX, y: e.clientY });
                    setShowContextMenu(true);
                }
            }}
        >
            {/* Info Button - Visible on Hover (Top Left) */}
            {/* Info Button - Always Visible but subtle */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (data.onView) data.onView(id);
                }}
                className="absolute top-2 left-2 p-1.5 rounded-full bg-white/60 dark:bg-slate-900/60 hover:bg-blue-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-300 transition-colors z-10 backdrop-blur-sm"
                title="Lihat Profil"
            >
                <Info size={16} />
            </button>

            {/* Handles for connections */}
            {/* Top/Bottom for Parent-Child */}
            <Handle type="target" position={Position.Top} id="top" className="!bg-slate-400 dark:!bg-slate-500" />
            <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-slate-400 dark:!bg-slate-500" />

            {/* Left/Right for Spouses (Both as Source and Target for flexibility) */}
            <Handle type="source" position={Position.Left} id="left-source" className="!bg-transparent !border-none" style={{ top: '50%' }} />
            <Handle type="target" position={Position.Left} id="left-target" className="!bg-transparent !border-none" style={{ top: '50%' }} />
            <Handle type="source" position={Position.Right} id="right-source" className="!bg-transparent !border-none" style={{ top: '50%' }} />
            <Handle type="target" position={Position.Right} id="right-target" className="!bg-transparent !border-none" style={{ top: '50%' }} />

            {/* Delete Button - Visible on Hover */}
            {/* Delete Button - Visible to Admin */}
            {isAdmin && (
                <button
                    onClick={handleDelete}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/60 dark:bg-slate-900/60 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors z-10 backdrop-blur-sm"
                    title="Hapus Anggota"
                >
                    <Trash2 size={16} />
                </button>
            )}

            <div className="p-4 flex items-center gap-4">
                {/* Avatar Placeholder or Image */}
                <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 ${iconBg}`}>
                    {data.photo ? (
                        <img src={data.photo} alt={data.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-xl font-bold">{data.name.charAt(0).toUpperCase()}</span>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className={`font-bold text-lg truncate ${textClass} flex items-center gap-2`}>
                        {data.name}
                        {data.isDeceased && (
                            <span title="Meninggal" className="text-sm">🕊️</span>
                        )}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDateDisplay(data.birthDate)}
                        {data.isDeceased && data.deathDate && ` - ${formatDateDisplay(data.deathDate)}`}
                    </p>
                    {data.tree_slug && data.tree_slug !== 'default' && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-[9px] font-bold rounded uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Kel: {data.tree_slug}
                        </span>
                    )}
                </div>
            </div>

            {/* Context Menu for Filter */}
            {showContextMenu && (
                <>
                    <div
                        className="fixed inset-0 z-[200]"
                        onClick={() => setShowContextMenu(false)}
                    />
                    <div
                        className="fixed bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 py-2 min-w-[180px] z-[201]"
                        style={{
                            left: `${menuPosition.x}px`,
                            top: `${menuPosition.y}px`
                        }}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                data.onFilterRequest?.('ancestors', id);
                                setShowContextMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"
                        >
                            <GitBranch size={16} className="text-purple-600 dark:text-purple-400" />
                            Tampilkan Leluhur
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                data.onFilterRequest?.('descendants', id);
                                setShowContextMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"
                        >
                            <Filter size={16} className="text-blue-600 dark:text-blue-400" />
                            Tampilkan Keturunan
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default memo(CustomNode);
