import { X, Users, Baby, Activity } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';

const StatsModal = ({ onClose }) => {
    const { members } = useFamily();

    const totalMembers = members.length;
    const males = members.filter(m => m.gender === 'male').length;
    const females = members.filter(m => m.gender === 'female').length;

    const calculateAge = (birthDate, deathDate, isDeceased) => {
        if (!birthDate) return 0;
        const birth = new Date(birthDate);
        const end = isDeceased && deathDate ? new Date(deathDate) : new Date();

        let age = end.getFullYear() - birth.getFullYear();
        const m = end.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const ages = members.map(m => calculateAge(m.birthDate, m.deathDate, m.isDeceased)).filter(a => a > 0);
    const averageAge = ages.length > 0 ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : 0;

    // Find oldest and youngest (with valid dates)
    const sortedMembers = [...members].filter(m => m.birthDate).sort((a, b) => new Date(a.birthDate) - new Date(b.birthDate));
    const oldest = sortedMembers.length > 0 ? sortedMembers[0] : null;
    const youngest = sortedMembers.length > 0 ? sortedMembers[sortedMembers.length - 1] : null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Activity className="text-blue-600 dark:text-blue-400" size={24} />
                        Statistik Keluarga
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center">
                            <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">Total Anggota</p>
                            <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{totalMembers}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-center">
                            <p className="text-purple-600 dark:text-purple-400 text-sm font-medium mb-1">Rata-rata Umur</p>
                            <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{averageAge}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Tahun</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Users size={20} className="text-blue-500 dark:text-blue-400" />
                                <span className="text-slate-700 dark:text-slate-200">Laki-laki</span>
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{males}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Users size={20} className="text-pink-500 dark:text-pink-400" />
                                <span className="text-slate-700 dark:text-slate-200">Perempuan</span>
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{females}</span>
                        </div>
                    </div>

                    {(oldest && youngest) && (
                        <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Tertua:</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">{oldest.name} ({calculateAge(oldest.birthDate, oldest.deathDate, oldest.isDeceased)} th)</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Termuda:</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">{youngest.name} ({calculateAge(youngest.birthDate, youngest.deathDate, youngest.isDeceased)} th)</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatsModal;
