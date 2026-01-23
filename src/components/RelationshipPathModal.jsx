import { useState } from 'react';
import { X, Search, ArrowRight, User } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { getDetailedRelationship } from '../utils/relationshipFinder';
import SearchableSelect from './SearchableSelect';

const RelationshipPathModal = ({ onClose }) => {
    const { members } = useFamily();
    const [personA, setPersonA] = useState('');
    const [personB, setPersonB] = useState('');
    const [result, setResult] = useState(null);

    const handleFind = () => {
        if (!personA || !personB) return;
        const analysis = getDetailedRelationship(members, personA, personB);
        setResult(analysis);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center text-slate-800 dark:text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Search className="text-purple-500" size={24} />
                        Relationship Path Finder
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-8 no-scrollbar">
                    {/* Select Members Section */}
                    <div className="grid md:grid-cols-2 gap-6 relative">
                        <div className="space-y-2">
                            <SearchableSelect
                                label="Anggota Pertama"
                                placeholder="Cari nama..."
                                members={members}
                                onSelect={(id) => setPersonA(id)}
                            />
                            {personA && (
                                <div className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                    <User size={12} />
                                    {members.find(m => m.id === personA)?.name}
                                </div>
                            )}
                        </div>

                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-2 hidden md:block">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                <ArrowRight size={16} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <SearchableSelect
                                label="Anggota Kedua"
                                placeholder="Cari nama..."
                                members={members}
                                onSelect={(id) => setPersonB(id)}
                            />
                            {personB && (
                                <div className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                    <User size={12} />
                                    {members.find(m => m.id === personB)?.name}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleFind}
                        disabled={!personA || !personB}
                        className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                        Temukan Hubungan
                    </button>

                    {/* Result Path Section */}
                    {result && (
                        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                            <div className="text-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Hasil Analisis</p>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                                    {result.type}
                                </h3>
                            </div>

                            {result.path.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400">Jalur Hubungan:</h4>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                                                {members.find(m => m.id === personA)?.name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold dark:text-white">{members.find(m => m.id === personA)?.name}</p>
                                                <p className="text-[10px] text-slate-400 uppercase">Input Awal</p>
                                            </div>
                                        </div>

                                        {result.path.map((step, idx) => {
                                            const member = members.find(m => m.id === step.id);
                                            return (
                                                <div key={idx} className="flex flex-col gap-3 ml-5 border-l-2 border-slate-200 dark:border-slate-700 pl-8 pb-3 relative">
                                                    <div className="absolute left-[-11px] top-0 w-5 h-5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                                                    </div>

                                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-600 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                                                            {member?.photo ? (
                                                                <img src={member.photo} className="w-full h-full object-cover rounded-full" />
                                                            ) : member?.name.charAt(0)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold dark:text-white truncate">{member?.name}</p>
                                                            <p className="text-[10px] text-purple-500 font-bold uppercase">{step.label}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RelationshipPathModal;
