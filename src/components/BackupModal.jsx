import React, { useState, useEffect } from 'react';
import { X, Database, History, RotateCcw, Save, Trash2, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

const BackupModal = ({ onClose }) => {
    const { listSnapshots, createSnapshot, restoreSnapshot, treeSlug } = useFamily();
    const toast = useToast();
    const confirm = useConfirm();

    const [snapshots, setSnapshots] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [note, setNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSnapshots();
    }, []);

    const loadSnapshots = async () => {
        setIsLoading(true);
        const data = await listSnapshots();
        setSnapshots(data);
        setIsLoading(false);
    };

    const handleCreateSnapshot = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const result = await createSnapshot(note);
        if (result.success) {
            toast.success("Snapshot berhasil dibuat!");
            setNote('');
            loadSnapshots();
        } else {
            toast.error("Gagal membuat snapshot: " + result.message);
        }
        setIsSaving(false);
    };

    const handleRestore = async (snapshot) => {
        const isConfirmed = await confirm({
            title: "Konfirmasi Restore",
            message: `Apakah Anda yakin ingin mengembalikan data ke snapshot "${snapshot.note || new Date(snapshot.created_at).toLocaleString()}"? Data saat ini akan terhapus sepenuhnya.`,
            confirmText: "Ya, Restore",
            cancelText: "Batal",
            type: "warning"
        });

        if (isConfirmed) {
            const result = await restoreSnapshot(snapshot.id);
            if (result.success) {
                toast.success("Data berhasil di-restore!");
                onClose();
            } else {
                toast.error("Gagal melakukan restore: " + result.message);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <History size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Manajemen Backup</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Amankan data silsilah keluarga Anda</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X className="text-slate-500" size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Create Snapshot Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Save size={16} /> Ambil Snapshot Baru
                        </h3>
                        <form onSubmit={handleCreateSnapshot} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Tulis catatan (misal: Sebelum edit besar-besaran)..."
                                className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                            >
                                {isSaving ? "Menyimpan..." : "Ambil Snapshot"}
                            </button>
                        </form>
                    </div>

                    {/* Snapshot List Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <History size={16} /> Riwayat Snapshot
                        </h3>

                        {isLoading ? (
                            <div className="py-12 flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                                <p className="text-slate-500 text-sm">Memuat riwayat...</p>
                            </div>
                        ) : snapshots.length === 0 ? (
                            <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                <p className="text-slate-400 italic">Belum ada snapshot yang disimpan.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {snapshots.map((s) => (
                                    <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800 transition-all group">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                {s.note || "Tanpa Catatan"}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {new Date(s.created_at).toLocaleString('id-ID', {
                                                    day: 'numeric', month: 'long', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleRestore(s)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all font-medium text-sm"
                                        >
                                            <RotateCcw size={14} /> Restore
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info Alert */}
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl flex gap-3">
                        <ShieldCheck className="text-amber-600 dark:text-amber-500 shrink-0" size={20} />
                        <div className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                            <p className="font-bold mb-1 uppercase tracking-tight">Sistem Backup 2 Lapis Aktif:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li><strong>Snapshots (Internal)</strong>: Tersimpan di database untuk restore instan.</li>
                                <li><strong>Manual Backups (GitHub)</strong>: Archive lengkap tersedia di repository setiap 24 jam.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-center">
                    <a
                        href="https://github.com/lordbyaku/family-tree-app/tree/main/backups"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 flex items-center gap-1.5 py-2 px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                    >
                        <ExternalLink size={14} /> Lihat Backup Lengkap di GitHub
                    </a>
                </div>
            </div>
        </div>
    );
};

export default BackupModal;
