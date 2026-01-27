import React, { useState, useEffect } from 'react';
import { X, Check, Users } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';

const MergeTreesModal = ({ onClose, onConfirm }) => {
    const { listAllSlugs } = useFamily();
    const [slugs, setSlugs] = useState([]);
    const [selectedSlugs, setSelectedSlugs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSlugs = async () => {
            const data = await listAllSlugs();
            setSlugs(data);
            // Default select all
            setSelectedSlugs(data);
            setLoading(false);
        };
        fetchSlugs();
    }, []);

    const toggleSlug = (slug) => {
        setSelectedSlugs(prev =>
            prev.includes(slug)
                ? prev.filter(s => s !== slug)
                : [...prev, slug]
        );
    };

    const handleConfirm = () => {
        if (selectedSlugs.length === 0) return;
        onConfirm(selectedSlugs);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Users size={24} className="text-indigo-500" />
                        Gabungkan Silsilah
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        Pilih silsilah keluarga mana saja yang ingin Anda tampilkan secara bersamaan dalam satu pratinjau.
                    </p>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                            {slugs.map(slug => (
                                <button
                                    key={slug}
                                    onClick={() => toggleSlug(slug)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedSlugs.includes(slug)
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 ring-2 ring-indigo-500/10'
                                            : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                >
                                    <span className={`font-bold capitalize ${selectedSlugs.includes(slug) ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {slug === 'default' ? 'Silsilah Utama' : slug}
                                    </span>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${selectedSlugs.includes(slug) ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-600'
                                        }`}>
                                        {selectedSlugs.includes(slug) && <Check size={14} />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="mt-8 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedSlugs.length === 0}
                            className={`flex-1 px-4 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${selectedSlugs.length === 0
                                    ? 'bg-slate-300 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                                }`}
                        >
                            Tampilkan {selectedSlugs.length} Silsilah
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MergeTreesModal;
