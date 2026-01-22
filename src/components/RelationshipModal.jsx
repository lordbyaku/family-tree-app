import { useState } from 'react';
import { X, Calculator, ArrowRight } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { findRelationship } from '../utils/relationship';

const RelationshipModal = ({ onClose }) => {
    const { members } = useFamily();
    const [personA, setPersonA] = useState('');
    const [personB, setPersonB] = useState('');
    const [result, setResult] = useState(null);

    const handleCalculate = () => {
        if (!personA || !personB) return;

        const rel = findRelationship(members, personA, personB);
        const nameA = members.find(m => m.id === personA)?.name;
        const nameB = members.find(m => m.id === personB)?.name;

        setResult({
            text: rel,
            from: nameA,
            to: nameB
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Calculator className="text-purple-600 dark:text-purple-400" size={24} />
                        Cek Hubungan
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Siapa (Subjek)</label>
                            <select
                                value={personB}
                                onChange={(e) => setPersonB(e.target.value)}
                                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Pilih Anggota...</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center justify-center text-slate-400 dark:text-slate-500">
                            <span className="text-sm italic">adalah ... dari</span>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Siapa (Objek)</label>
                            <select
                                value={personA}
                                onChange={(e) => setPersonA(e.target.value)}
                                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Pilih Anggota...</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleCalculate}
                        disabled={!personA || !personB}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-lg transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-600 dark:disabled:text-slate-400"
                    >
                        Cek Hubungan
                    </button>

                    {result && (
                        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800 text-center animate-in fade-in slide-in-from-bottom-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Hubungan:</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                                {result.to}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 my-1">adalah</p>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                {result.text}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">dari {result.from}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RelationshipModal;
