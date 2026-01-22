import { X, AlertTriangle } from 'lucide-react';

const ConfirmationDialog = ({ isOpen, title, message, onConfirm, onCancel, type = 'danger' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${type === 'danger' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-blue-100 text-blue-600'
                        }`}>
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        {title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                        {message}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${type === 'danger'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            Ya, Lanjutkan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDialog;
