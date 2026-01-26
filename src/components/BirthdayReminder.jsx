import React, { useState, useMemo } from 'react';
import { Gift, MessageCircle, X, ChevronRight, Cake } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { isBirthdayToday, calculateAge, generateWhatsAppGreeting } from '../utils/date';

const BirthdayReminder = () => {
    const { members, treeSlug } = useFamily();
    const [isOpen, setIsOpen] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);

    const birthdayMembers = useMemo(() => {
        return members.filter(m => !m.isDeceased && isBirthdayToday(m.birthDate));
    }, [members]);

    if (birthdayMembers.length === 0 || !isOpen) return null;

    const handleSendWA = (member) => {
        const age = calculateAge(member.birthDate);
        const text = generateWhatsAppGreeting(member.name, age, treeSlug);
        const phone = member.phone || '';
        const cleanPhone = phone.replace(/[^0-9]/g, '');

        // Use web.whatsapp.com for desktop and api.whatsapp.com for mobile
        const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`;
        window.open(waUrl, '_blank');
    };

    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all animate-bounce"
            >
                <Gift size={24} />
                <span className="absolute -top-1 -right-1 bg-white text-rose-500 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-rose-500">
                    {birthdayMembers.length}
                </span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-xs animate-in slide-in-from-right-10 duration-500">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-rose-100 dark:border-rose-900/30">
                {/* Header */}
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                        <Cake size={20} className="animate-pulse" />
                        <h3 className="font-bold text-sm">Ada yang Ultah Nih! 🎂</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                            <ChevronRight size={18} />
                        </button>
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="p-4 space-y-3 max-h-80 overflow-y-auto no-scrollbar">
                    {birthdayMembers.map(member => (
                        <div key={member.id} className="group p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center overflow-hidden shrink-0 border-2 border-white dark:border-slate-700 shadow-sm">
                                    {member.photo ? (
                                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-rose-600 dark:text-rose-400 font-bold">{member.name[0]}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{member.name}</p>
                                    <p className="text-[10px] text-rose-500 font-bold uppercase">Ultah ke-{calculateAge(member.birthDate)}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleSendWA(member)}
                                disabled={!member.phone}
                                className={`mt-3 w-full py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 transition-all active:scale-95 ${member.phone
                                        ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                <MessageCircle size={14} />
                                {member.phone ? 'Kirim Ucapan WA' : 'No. HP Belum Ada'}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-[9px] text-center text-slate-400 italic">"Sentuhan kecil bisa menguatkan silaturahmi."</p>
                </div>
            </div>
        </div>
    );
};

export default BirthdayReminder;
