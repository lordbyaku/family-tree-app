import { Upload, FileSpreadsheet, Download, BookOpen } from 'lucide-react';

const ImportExportActions = ({
    isAdmin,
    handleImportClick,
    handleExcelClick,
    exportData,
    setIsExportModalOpen,
    toast
}) => {
    if (!isAdmin) return null;

    return (
        <>
            <button
                onClick={handleImportClick}
                className="flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border md:border-0 border-slate-200 dark:border-slate-700"
                title="Restore Data (Import JSON)"
            >
                <Upload size={20} />
            </button>
            <button
                onClick={handleExcelClick}
                className="flex items-center justify-center text-slate-600 hover:text-green-600 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border md:border-0 border-slate-200 dark:border-slate-700"
                title="Import Excel/CSV"
            >
                <FileSpreadsheet size={20} />
            </button>
            <button
                onClick={() => {
                    exportData();
                    toast.success("Data berhasil dieksport ke JSON!");
                }}
                className="flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border md:border-0 border-slate-200 dark:border-slate-700"
                title="Backup Data (JSON)"
            >
                <Download size={20} />
            </button>
            <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border md:border-0 border-slate-200 dark:border-slate-700"
                title="Export Buku Keluarga"
            >
                <BookOpen size={20} />
            </button>
        </>
    );
};

export default ImportExportActions;
