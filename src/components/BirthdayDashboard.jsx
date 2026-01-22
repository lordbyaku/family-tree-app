import { useMemo } from 'react';
import { X, Calendar, Cake, ChevronRight, User } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';

const BirthdayDashboard = ({ onClose, onViewProfile }) => {
    const { members } = useFamily();

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1; // 1-12

    const birthdayData = useMemo(() => {
        if (!members) return { today: [], upcoming: [] };

        const allBirthdays = members
            .filter(m => m.birthDate)
            .map(m => {
                // Assuming date format is YYYY-MM-DD or similar
                const dateParts = m.birthDate.split('-');
                if (dateParts.length < 3) return null;

                const day = parseInt(dateParts[2]);
                const month = parseInt(dateParts[1]);
                const year = parseInt(dateParts[0]);

                return {
                    ...m,
                    bDay: day,
                    bMonth: month,
                    bYear: year
                };
            })
            .filter(Boolean);

        const birthdaysToday = allBirthdays.filter(m => m.bDay === currentDay && m.bMonth === currentMonth);
        const birthdaysThisMonth = allBirthdays
            .filter(m => m.bMonth === currentMonth && m.bDay !== currentDay)
            .sort((a, b) => a.bDay - b.bDay);

        return {
            today: birthdaysToday,
            upcoming: birthdaysThisMonth
        };
    }, [members, currentDay, currentMonth]);

    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Calendar size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Ulang Tahun</h2>
                            <p className="text-blue-100 text-sm">{monthNames[currentMonth - 1]} {today.getFullYear()}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 p-6 space-y-8 no-scrollbar">

                    {/* Today */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
                            Hari Ini
                        </h3>
                        {birthdayData.today.length > 0 ? (
                            <div className="space-y-3">
                                {birthdayData.today.map(m => (
                                    <div
                                        key={m.id}
                                        className="group bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 p-4 rounded-xl border border-pink-100 dark:border-pink-800/50 flex items-center gap-4 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Cake size={48} />
                                        </div>
                                        <div className="w-14 h-14 rounded-full border-2 border-pink-200 dark:border-pink-800 overflow-hidden bg-white dark:bg-slate-700 shadow-sm">
                                            {m.photo ? (
                                                <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-pink-500 font-bold text-xl">
                                                    {m.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{m.name}</p>
                                            <p className="text-pink-600 dark:text-pink-400 text-sm font-medium">Berulang tahun hari ini! 🎂</p>
                                        </div>
                                        <button
                                            onClick={() => onViewProfile(m.id)}
                                            className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors z-10"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-700 p-6 rounded-xl text-center">
                                <p className="text-slate-400 dark:text-slate-500 text-sm italic">Tidak ada yang berulang tahun hari ini.</p>
                            </div>
                        )}
                    </section>

                    {/* This Month */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            Mendatang Bulan Ini
                        </h3>
                        {birthdayData.upcoming.length > 0 ? (
                            <div className="grid gap-4">
                                {birthdayData.upcoming.map(m => (
                                    <div
                                        key={m.id}
                                        className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors group cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                                        onClick={() => onViewProfile(m.id)}
                                    >
                                        <div className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 flex-shrink-0">
                                            {m.photo ? (
                                                <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                                                    {m.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-700 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{m.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{m.bDay} {monthNames[currentMonth - 1]}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full">
                                                +{m.bDay - currentDay} hari
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-slate-400 dark:text-slate-500 text-sm italic">Tidak ada ulang tahun lain di bulan ini.</p>
                            </div>
                        )}
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
                        <User size={12} />
                        Total {members.length} Anggota Keluarga
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BirthdayDashboard;
