import { useState } from 'react';
import { X, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { useToast } from '../context/ToastContext';

const ExportModal = ({ onClose }) => {
    const { members, exportToExcel, exportToCSV, exportToHTML, exportToPDF } = useFamily();
    const toast = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [includePhotos, setIncludePhotos] = useState(true);
    const [includeStats, setIncludeStats] = useState(true);

    const handleExport = async (format) => {
        if (members.length === 0) {
            toast.error("Tidak ada data untuk dieksport");
            return;
        }

        setIsExporting(true);
        try {
            const options = {
                includePhotos,
                includeStats
            };

            if (format === 'excel') {
                await exportToExcel(options);
                toast.success("Buku keluarga berhasil diexport ke Excel!");
            } else if (format === 'csv') {
                await exportToCSV();
                toast.success("Data berhasil diexport ke CSV!");
            } else if (format === 'pdf') {
                await exportToPDF(options);
                toast.success("Buku keluarga berhasil diexport ke PDF!");
            } else if (format === 'html') {
                await exportToHTML(options);
                toast.success("Buku keluarga berhasil diexport ke HTML!");
            } else if (format === 'pdf') {
                await exportToPDF(options);
                toast.success("Buku keluarga berhasil diexport ke PDF!");
            }

            onClose();
        } catch (error) {
            console.error('Export error:', error);
            toast.error("Gagal mengeksport: " + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Export Buku Keluarga</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Options */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Opsi Export</h3>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includePhotos}
                                onChange={(e) => setIncludePhotos(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Sertakan Foto</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeStats}
                                onChange={(e) => setIncludeStats(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Sertakan Statistik</span>
                        </label>
                    </div>

                    {/* Export Buttons */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Pilih Format</h3>

                        <button
                            onClick={() => handleExport('pdf')}
                            disabled={isExporting}
                            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:bg-slate-400 text-white px-4 py-3 rounded-lg font-medium transition-all shadow-lg shadow-red-500/30"
                        >
                            {isExporting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <FileText size={20} />
                            )}
                            Export ke PDF (Buku Keluarga) ⭐
                        </button>

                        <button
                            onClick={() => handleExport('excel')}
                            disabled={isExporting}
                            className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                        >
                            {isExporting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <FileSpreadsheet size={20} />
                            )}
                            Export ke Excel (.xlsx)
                        </button>

                        <button
                            onClick={() => handleExport('csv')}
                            disabled={isExporting}
                            className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                        >
                            {isExporting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <FileSpreadsheet size={20} />
                            )}
                            Export ke CSV (.csv)
                        </button>

                        <button
                            onClick={() => handleExport('html')}
                            disabled={isExporting}
                            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                        >
                            {isExporting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <FileText size={20} />
                            )}
                            Export ke HTML (Web Page)
                        </button>

                        <button
                            onClick={() => handleExport('pdf')}
                            disabled={isExporting}
                            className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                        >
                            {isExporting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <FileText size={20} />
                            )}
                            Export ke PDF (.pdf)
                        </button>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                        Total {members.length} anggota keluarga akan diexport
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
