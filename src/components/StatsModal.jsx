
import React, { useMemo } from 'react';
import { X, Users, Baby, Activity, Heart, Calendar, TrendingUp, UserCheck, Shield } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';

const StatsModal = ({ onClose }) => {
    const { members } = useFamily();

    const stats = useMemo(() => {
        const total = members.length;
        const males = members.filter(m => m.gender === 'male').length;
        const females = members.filter(m => m.gender === 'female').length;
        const deceased = members.filter(m => m.isDeceased).length;
        const living = total - deceased;

        const calculateAge = (birthDate, deathDate, isDeceased) => {
            if (!birthDate) return null;
            const birth = new Date(birthDate);
            const end = isDeceased && deathDate ? new Date(deathDate) : new Date();
            let age = end.getFullYear() - birth.getFullYear();
            if (end < new Date(end.getFullYear(), birth.getMonth(), birth.getDate())) age--;
            return age;
        };

        const ages = members.map(m => calculateAge(m.birthDate, m.deathDate, m.isDeceased)).filter(a => a !== null);
        const avgAge = ages.length > 0 ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : 0;

        // Generations (Very simple depth estimation)
        // Find roots (no parents)
        const roots = members.filter(m => !m.parents || m.parents.length === 0);

        const getDepth = (memberId, currentDepth = 1) => {
            const member = members.find(m => m.id === memberId);
            if (!member || !member.children || member.children.length === 0) return currentDepth;
            return Math.max(...member.children.map(cid => getDepth(cid, currentDepth + 1)));
        };

        const totalGenerations = roots.length > 0
            ? Math.max(...roots.map(r => getDepth(r.id)))
            : 0;

        const ageGroups = {
            '0-12': ages.filter(a => a <= 12).length,
            '13-19': ages.filter(a => a > 12 && a <= 19).length,
            '20-40': ages.filter(a => a > 19 && a <= 40).length,
            '41-60': ages.filter(a => a > 40 && a <= 60).length,
            '60+': ages.filter(a => a > 60).length,
        };

        return { total, males, females, deceased, living, avgAge, totalGenerations, ageGroups };
    }, [members]);

    const StatCard = ({ icon: Icon, label, value, subtext, color }) => (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-2 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-${color}-500/5 dark:bg-${color}-400/5 rounded-full blur-2xl group-hover:scale-150 transition-transform`} />
            <div className="flex items-center justify-between">
                <div className={`p-2.5 bg-${color}-50 dark:bg-${color}-900/40 rounded-xl text-${color}-600 dark:text-${color}-400`}>
                    <Icon size={20} />
                </div>
                <div className="text-2xl font-black text-slate-800 dark:text-white">{value}</div>
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                {subtext && <p className="text-[10px] text-slate-500 mt-1">{subtext}</p>}
            </div>
        </div>
    );

    const ProgressBar = ({ label, value, total, color }) => {
        const percentage = total > 0 ? (value / total) * 100 : 0;
        return (
            <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-slate-800 dark:text-slate-200">{value} ({percentage.toFixed(0)}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full bg-${color}-500 dark:bg-${color}-400 transition-all duration-1000 ease-out`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
                {/* Header */}
                <div className="px-8 py-6 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <TrendingUp className="text-blue-600" size={28} />
                            Statistik Keluarga
                        </h2>
                        <p className="text-sm text-slate-500">Analisis mendalam silsilah keluarga Anda.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto no-scrollbar space-y-8">
                    {/* Top Stats Overview */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={Users} label="Total Anggota" value={stats.total} color="blue" />
                        <StatCard icon={Calendar} label="Rata-rata Usia" value={`${stats.avgAge}`} subtext="Tahun" color="purple" />
                        <StatCard icon={TrendingUp} label="Total Generasi" value={stats.totalGenerations} subtext="Kedalaman Pohon" color="indigo" />
                        <StatCard icon={UserCheck} label="Anggota Hidup" value={stats.living} subtext={`${stats.deceased} Wafat`} color="emerald" />
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Gender Distribution */}
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Activity className="text-pink-500" size={20} />
                                <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-widest text-xs">Distribusi Gender</h3>
                            </div>
                            <div className="space-y-6">
                                <ProgressBar label="Pria" value={stats.males} total={stats.total} color="blue" />
                                <ProgressBar label="Wanita" value={stats.females} total={stats.total} color="pink" />
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-slate-50 dark:border-slate-700">
                                <div className="text-center flex-1">
                                    <p className="text-2xl font-black text-blue-600">{((stats.males / stats.total) * 100 || 0).toFixed(0)}%</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Rasio Pria</p>
                                </div>
                                <div className="w-px bg-slate-100 dark:bg-slate-700" />
                                <div className="text-center flex-1">
                                    <p className="text-2xl font-black text-pink-600">{((stats.females / stats.total) * 100 || 0).toFixed(0)}%</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Rasio Wanita</p>
                                </div>
                            </div>
                        </div>

                        {/* Age Groups Overlay */}
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Baby className="text-amber-500" size={20} />
                                <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-widest text-xs">Kelompok Usia</h3>
                            </div>
                            <div className="space-y-4">
                                {Object.entries(stats.ageGroups).map(([group, count]) => (
                                    <div key={group} className="flex items-center gap-4">
                                        <span className="text-[10px] font-black text-slate-400 w-10 text-right">{group}</span>
                                        <div className="flex-1 h-3 bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500/80 dark:bg-blue-400/80 rounded-full"
                                                style={{ width: `${(count / stats.total) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-6">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Fun Facts or Detailed Insight */}
                    <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 -mr-16 -mt-16 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 -ml-16 -mb-16 bg-black/10 rounded-full blur-3xl" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                            <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl">
                                <Shield size={32} />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h4 className="text-xl font-black mb-1">Keamanan & Keutuhan Data</h4>
                                <p className="text-indigo-100 text-sm opacity-80 leading-relaxed">
                                    Silsilah Anda saat ini memiliki <strong>{stats.total} profil</strong> yang saling terhubung melalui <strong>{members.reduce((acc, m) => acc + (m.spouses?.length || 0), 0) / 2} pernikahan</strong>.
                                    Data disimpan dengan enkripsi aman di cloud untuk generasi mendatang.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsModal;
