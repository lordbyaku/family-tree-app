import React, { useState, useEffect } from 'react';
import { X, Database, History, RotateCcw, Save, Trash2, Download, Upload, FileSpreadsheet, FileDown, BookOpen, ImageIcon, Loader2, ExternalLink, ShieldCheck, FileText, ChevronRight } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

const DataManagerModal = ({ onClose, isAdmin, handleImportClick, handleExcelClick, handleExportImage, initialTab = 'backup' }) => {
    const {
        members,
        exportData,
        downloadExcelTemplate,
        listSnapshots,
        createSnapshot,
        restoreSnapshot,
        exportToExcel,
        exportToCSV,
        exportToHTML,
        exportToPDF,
        treeSlug
    } = useFamily();

    const toast = useToast();
    const confirm = useConfirm();

    const [activeTab, setActiveTab] = useState(initialTab); // 'backup', 'import', 'export'
    const [snapshots, setSnapshots] = useState([]);
    const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);
    const [snapshotNote, setSnapshotNote] = useState('');
    const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportOptions, setExportOptions] = useState({
        includePhotos: true,
        includeStats: true
    });

    useEffect(() => {
        if (activeTab === 'backup') {
            loadSnapshots();
        }
    }, [activeTab]);

    const loadSnapshots = async () => {
        setIsLoadingSnapshots(true);
        const data = await listSnapshots();
        setSnapshots(data || []);
        setIsLoadingSnapshots(false);
    };

    const handleCreateSnapshot = async (e) => {
        e.preventDefault();
        if (!snapshotNote.trim()) {
            toast.error("Tulis catatan snapshot terlebih dahulu");
            return;
        }
        setIsSavingSnapshot(true);
        const result = await createSnapshot(snapshotNote);
        if (result.success) {
            toast.success("Snapshot berhasil dibuat!");
            setSnapshotNote('');
            loadSnapshots();
        } else {
            toast.error("Gagal membuat snapshot: " + result.message);
        }
        setIsSavingSnapshot(false);
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

    const handleExportBook = async (format) => {
        if (members.length === 0) {
            toast.error("Tidak ada data untuk dieksport");
            return;
        }

        setIsExporting(true);
        try {
            if (format === 'excel') {
                await exportToExcel(exportOptions);
                toast.success("Buku keluarga berhasil diexport ke Excel!");
            } else if (format === 'csv') {
                await exportToCSV();
                toast.success("Data berhasil diexport ke CSV!");
            } else if (format === 'pdf') {
                await exportToPDF(exportOptions);
                toast.success("Buku keluarga berhasil diexport ke PDF!");
            } else if (format === 'html') {
                await exportToHTML(exportOptions);
                toast.success("Buku keluarga berhasil diexport ke HTML!");
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error("Gagal mengeksport: " + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                            <Database size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Pengelolaan Data</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Restore, Backup, dan Export Silsilah</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors group">
                        <X className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 dark:border-slate-700 px-6 bg-white dark:bg-slate-800">
                    <button
                        onClick={() => setActiveTab('backup')}
                        className={`px-4 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'backup' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        <History size={16} /> Backup & Snapshot
                    </button>
                    <button
                        onClick={() => setActiveTab('export')}
                        className={`px-4 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'export' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        <Download size={16} /> Export Laporan
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('import')}
                            className={`px-4 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'import' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <Upload size={16} /> Import Excel/JSON
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'backup' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* JSON Backup Button */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">Backup JSON Mandiri</h4>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 opacity-80">Download seluruh data silsilah ke dalam file .json untuk disimpan secara offline.</p>
                                </div>
                                <button
                                    onClick={() => { exportData(); toast.success("Data berhasil dieksport!"); }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95 whitespace-nowrap"
                                >
                                    <Download size={18} /> Download JSON
                                </button>
                            </div>

                            {/* Create Snapshot Section */}
                            {isAdmin && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Save size={14} /> Ambil Snapshot Internal
                                    </h3>
                                    <form onSubmit={handleCreateSnapshot} className={`flex gap-2 relative ${treeSlug === 'gabungan' ? 'opacity-50 pointer-events-none' : ''}`}>
                                        {treeSlug === 'gabungan' && (
                                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-slate-800/60 rounded-xl">
                                                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">Snapshot dinonaktifkan di mode Gabungan</p>
                                            </div>
                                        )}
                                        <input
                                            type="text"
                                            placeholder="Catatan snapshot (misal: Sebelum migrasi)..."
                                            className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            value={snapshotNote}
                                            onChange={(e) => setSnapshotNote(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            disabled={isSavingSnapshot}
                                            className="bg-slate-800 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50 active:scale-95 shadow-lg"
                                        >
                                            {isSavingSnapshot ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                            Simpan
                                        </button>
                                    </form>
                                    <p className="text-[10px] text-slate-400 italic">Snapshot disimpan di database dan dapat di-restore kapan saja.</p>
                                </div>
                            )}

                            {/* Snapshot List Section */}
                            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <History size={14} /> Riwayat Snapshot
                                </h3>

                                {isLoadingSnapshots ? (
                                    <div className="py-12 flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-tighter">Memuat riwayat...</p>
                                    </div>
                                ) : snapshots.length === 0 ? (
                                    <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                        <p className="text-slate-400 italic text-sm">Belum ada snapshot yang tersimpan.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {snapshots.map((s) => (
                                            <div key={s.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all group">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">
                                                        {s.note || "Tanpa Catatan"}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {new Date(s.created_at).toLocaleString('id-ID', {
                                                            day: 'numeric', month: 'long', year: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleRestore(s)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all font-bold text-xs"
                                                >
                                                    <RotateCcw size={14} /> Restore
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'export' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* Export Options */}
                            <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Opsi Laporan</h4>
                                <div className="flex flex-wrap gap-6">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={exportOptions.includePhotos}
                                            onChange={(e) => setExportOptions(prev => ({ ...prev, includePhotos: e.target.checked }))}
                                            className="w-5 h-5 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">Sertakan Foto</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={exportOptions.includeStats}
                                            onChange={(e) => setExportOptions(prev => ({ ...prev, includeStats: e.target.checked }))}
                                            className="w-5 h-5 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">Sertakan Statistik</span>
                                    </label>
                                </div>
                            </div>

                            {/* Export Formats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleExportBook('pdf')}
                                    disabled={isExporting}
                                    className="p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-4 hover:scale-[1.02] transition-all group active:scale-95"
                                >
                                    <div className="p-4 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-500/20">
                                        <FileText size={24} />
                                    </div>
                                    <div className="text-left">
                                        <h5 className="font-black text-red-900 dark:text-red-100">Cetak ke PDF</h5>
                                        <p className="text-[10px] text-red-700 dark:text-red-300">Format Buku Keluarga Lengkap</p>
                                    </div>
                                    <ChevronRight className="ml-auto text-red-300 group-hover:translate-x-1 transition-transform" size={20} />
                                </button>

                                <button
                                    onClick={handleExportImage}
                                    className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex items-center gap-4 hover:scale-[1.02] transition-all group active:scale-95"
                                >
                                    <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
                                        <ImageIcon size={24} />
                                    </div>
                                    <div className="text-left">
                                        <h5 className="font-black text-indigo-900 dark:text-indigo-100">Simpan Gambar</h5>
                                        <p className="text-[10px] text-indigo-700 dark:text-indigo-300">Download Pohon format PNG</p>
                                    </div>
                                    <ChevronRight className="ml-auto text-indigo-300 group-hover:translate-x-1 transition-transform" size={20} />
                                </button>

                                <button
                                    onClick={() => handleExportBook('excel')}
                                    disabled={isExporting}
                                    className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center gap-4 hover:scale-[1.02] transition-all group active:scale-95"
                                >
                                    <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                                        <FileSpreadsheet size={24} />
                                    </div>
                                    <div className="text-left">
                                        <h5 className="font-black text-emerald-900 dark:text-emerald-100">Export Excel</h5>
                                        <p className="text-[10px] text-emerald-700 dark:text-emerald-300">Tabulasi Data Spreadsheet</p>
                                    </div>
                                    <ChevronRight className="ml-auto text-emerald-300 group-hover:translate-x-1 transition-transform" size={20} />
                                </button>

                                <button
                                    onClick={() => handleExportBook('html')}
                                    disabled={isExporting}
                                    className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex items-center gap-4 hover:scale-[1.02] transition-all group active:scale-95"
                                >
                                    <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="text-left">
                                        <h5 className="font-black text-blue-900 dark:text-blue-100">Halaman Web</h5>
                                        <p className="text-[10px] text-blue-700 dark:text-blue-300">Format HTML Interaktif</p>
                                    </div>
                                    <ChevronRight className="ml-auto text-blue-300 group-hover:translate-x-1 transition-transform" size={20} />
                                </button>
                            </div>

                            <p className="text-[11px] text-slate-400 text-center font-bold uppercase tracking-wider">
                                Total {members.length} anggota keluarga siap dieksport
                            </p>
                        </div>
                    )}

                    {activeTab === 'import' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* Import Methods */}
                            <div className="grid grid-cols-1 gap-4">
                                {/* JSON Restore */}
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700 rounded-2xl space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                                            <Upload size={20} />
                                        </div>
                                        <h5 className="font-black text-slate-800 dark:text-slate-100">Restore dari JSON</h5>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">Gunakan fitur ini jika Anda memiliki file backup .json yang didownload sebelumnya.</p>
                                    <button
                                        onClick={handleImportClick}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Upload size={18} /> Pilih File JSON
                                    </button>
                                </div>

                                {/* Excel/CSV Import */}
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700 rounded-2xl space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                            <FileSpreadsheet size={20} />
                                        </div>
                                        <h5 className="font-black text-slate-800 dark:text-slate-100">Batch Import Excel/CSV</h5>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">Upload banyak anggota sekaligus menggunakan template Excel kami.</p>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { downloadExcelTemplate(); toast.success("Template berhasil didownload!"); }}
                                            className="flex-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 py-3 rounded-xl font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            <FileDown size={16} /> Template
                                        </button>
                                        <button
                                            onClick={handleExcelClick}
                                            className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            <Upload size={16} /> Upload Excel/CSV
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl flex gap-3">
                                <ShieldCheck className="text-amber-600 dark:text-amber-500 shrink-0" size={20} />
                                <div className="text-[10px] text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
                                    <p className="font-black mb-1 text-xs uppercase tracking-tight">Peringatan Keamanan:</p>
                                    Mengimpor data akan menggantikan atau menambah data yang sudah ada. Pastikan file yang Anda gunakan adalah file yang valid dan berasal dari sumber terpercaya. Kami menyarankan untuk mengambil snapshot sebelum melakukan impor besar.
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                    <a
                        href="https://github.com/lordbyaku/family-tree-app/tree/main/backups"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                    >
                        <ExternalLink size={12} /> GitHub Repository Archive
                    </a>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sistem Cloud Aktif</span>
                    </div>
                </div>
            </div>

            {/* Loading Overlay for Exports */}
            {isExporting && (
                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center z-[60] rounded-3xl">
                    <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="font-black text-slate-800 dark:text-slate-100 animate-pulse">Menyiapkan Berkas Laporan...</p>
                </div>
            )}
        </div>
    );
};

export default DataManagerModal;
