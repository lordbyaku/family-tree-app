
import React, { useState, useEffect } from 'react';
import { Edit2, Check, X, BookOpen, Info } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const TreeMetadataSection = () => {
    const { treeMetadata, updateTreeMetadata, treeSlug } = useFamily();
    const { isAdmin } = useAuth();
    const { success, error: toastError } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => localStorage.getItem(`tree_info_minimized_${treeSlug}`) === 'true');

    useEffect(() => {
        setFormData(treeMetadata);
    }, [treeMetadata]);

    const toggleMinimize = () => {
        const newState = !isMinimized;
        setIsMinimized(newState);
        localStorage.setItem(`tree_info_minimized_${treeSlug}`, newState);
    };

    if (!treeMetadata.title && !isEditing) return null;

    return (
        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500 group relative">
            <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-all duration-300 ${isMinimized ? 'opacity-80 hover:opacity-100' : ''}`}>
                {/* Minimal Header (Always visible) */}
                <div className={`px-6 py-3 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-transparent transition-all ${isMinimized ? '' : 'border-slate-100 dark:border-slate-700'}`}>
                    <span className="flex items-center gap-1.5 min-w-0">
                        <BookOpen size={12} className="text-blue-500" />
                        <span className="truncate">{isMinimized ? (treeMetadata.title || 'Informasi Silsilah') : 'Informasi Silsilah'}</span>
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={toggleMinimize}
                            className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            <Info size={12} />
                            {isMinimized ? 'Expand' : 'Minimize'}
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <div className="p-6 md:p-8 animate-in zoom-in-95 fade-in duration-300">
                        <div className="flex justify-between items-start gap-4 mb-4">
                            <div className="flex-1">
                                {isEditing ? (
                                    <input
                                        value={formData.title}
                                        onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                        className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border-b-2 border-blue-500 outline-none w-full mb-2 px-2 py-1"
                                        placeholder="Judul Silsilah..."
                                    />
                                ) : (
                                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                        {treeMetadata.title}
                                    </h1>
                                )}
                            </div>

                            {isAdmin && treeSlug !== 'gabungan' && (
                                <div className="shrink-0">
                                    {isEditing ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-95"
                                            >
                                                <Check size={20} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setFormData(treeMetadata);
                                                    setIsEditing(false);
                                                }}
                                                className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                                            title="Edit Informasi Silsilah"
                                        >
                                            <Edit2 size={20} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="max-w-3xl">
                            {isEditing ? (
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                    className="w-full text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border-l-4 border-blue-500 outline-none p-4 text-sm leading-relaxed min-h-[100px]"
                                    placeholder="Tuliskan sejarah singkat atau deskripsi silsilah ini..."
                                />
                            ) : (
                                <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed border-l-4 border-blue-100 dark:border-slate-700 pl-6 italic">
                                    {treeMetadata.description}
                                </p>
                            )}
                        </div>

                        <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            <span>MODE: <span className="text-blue-600 dark:text-blue-400">{treeSlug === 'gabungan' ? 'Gabungan' : 'Eksklusif'}</span></span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TreeMetadataSection;
