
import React, { useState, useEffect } from 'react';
import { X, ClipboardList, Clock, Search, User, UserPlus, UserMinus, Edit3, Trash2 } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { supabase } from '../lib/supabase';

const AuditLogModal = ({ onClose }) => {
    const { treeSlug } = useFamily();
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('audit_logs')
                    .select('*')
                    .eq('tree_slug', treeSlug)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;
                setLogs(data || []);
            } catch (error) {
                console.error("Gagal mengambil log:", error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, [treeSlug]);

    const getActionIcon = (action) => {
        switch (action) {
            case 'ADD_MEMBER': return <UserPlus size={16} className="text-emerald-500" />;
            case 'UPDATE_MEMBER': return <Edit3 size={16} className="text-blue-500" />;
            case 'DELETE_MEMBER': return <Trash2 size={16} className="text-red-500" />;
            case 'IMPORT_DATA': return <Upload size={16} className="text-orange-500" />;
            case 'RESTORE_SNAPSHOT': return <RotateCcw size={16} className="text-purple-500" />;
            default: return <ClipboardList size={16} className="text-slate-400" />;
        }
    };

    const getActionLabel = (action) => {
        switch (action) {
            case 'ADD_MEMBER': return 'Tambah Anggota';
            case 'UPDATE_MEMBER': return 'Ubah Profil';
            case 'DELETE_MEMBER': return 'Hapus Anggota';
            case 'IMPORT_DATA': return 'Impor Masal (Excel/JSON)';
            case 'RESTORE_SNAPSHOT': return 'Restore Snapshot';
            default: return action;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <ClipboardList size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Audit Log (Admin)</h2>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">Riwayat Perubahan Data</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X className="text-slate-500" size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="text-slate-400 text-sm italic">Menarik riwayat...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            <ClipboardList size={40} className="mx-auto text-slate-300 mb-4 opacity-20" />
                            <p className="text-slate-400 italic">Belum ada riwayat perubahan data.</p>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="p-4 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            {getActionIcon(log.action)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                {getActionLabel(log.action)}: <span className="text-indigo-600 dark:text-indigo-400">{log.details?.name || 'Unknown'}</span>
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                                <Clock size={12} /> {new Date(log.created_at).toLocaleString('id-ID')}
                                                <span className="mx-1">&bull;</span>
                                                <User size={12} /> {log.performed_by}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 uppercase">
                                        Slug: {log.tree_slug}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-center">
                    <p className="text-[10px] text-slate-400 italic">Menampilkan 50 riwayat terakhir. Audit log disimpan untuk keperluan keamanan data.</p>
                </div>
            </div>
        </div>
    );
};

export default AuditLogModal;
