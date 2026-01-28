import { useFamily } from '../context/FamilyContext';
import { useAuth } from '../context/AuthContext';
import { X, Pencil, MapPin, Briefcase, Phone } from 'lucide-react';

const ProfileModal = ({ memberId, onClose, onEdit }) => {
    const { members } = useFamily();
    const { isAdmin } = useAuth();
    const member = members.find(m => m.id === memberId);

    if (!member) return null;

    const isMale = member.gender === 'male';
    const bgClass = member.isDeceased ? 'bg-slate-100 dark:bg-slate-700' : (isMale ? 'bg-blue-50 dark:bg-slate-800' : 'bg-pink-50 dark:bg-slate-800');
    const textClass = member.isDeceased ? 'text-slate-700 dark:text-slate-300' : (isMale ? 'text-blue-700 dark:text-blue-400' : 'text-pink-700 dark:text-pink-400');
    const iconClass = isMale ? 'text-blue-500 dark:text-blue-400' : 'text-pink-500 dark:text-pink-400';

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-all">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* Scrollable Container */}
                <div className="overflow-y-auto flex-1 relative">
                    {/* Header / Cover */}
                    <div className={`h-32 ${bgClass} relative`}>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 rounded-full transition-colors z-20"
                        >
                            <X size={20} className="text-slate-600 dark:text-slate-300" />
                        </button>

                        {/* Edit Button - Visible to Admin */}
                        {isAdmin && (
                            <button
                                onClick={onEdit}
                                className="absolute top-4 left-4 p-2 bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 rounded-full transition-colors z-20"
                                title="Edit Profil"
                            >
                                <Pencil size={20} className="text-slate-600 dark:text-slate-300" />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="px-8 pb-8 -mt-16 flex-1 relative z-10">
                        {/* Profile Photo */}
                        <div className="flex justify-center mb-6">
                            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-700 flex items-center justify-center">
                                {member.photo ? (
                                    <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className={`text-4xl font-bold ${textClass}`}>
                                        {member.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Name & Dates */}
                        <div className="text-center mb-6">
                            <h2 className={`text-2xl font-bold ${textClass} flex items-center justify-center gap-2`}>
                                {member.name}
                                {member.isDeceased && <span title="Meninggal" className="text-xl">🕊️</span>}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                                {member.birthDate || '?'}
                                {member.isDeceased ? ` - ${member.deathDate || '?'}` : ' - Sekarang'}
                            </p>
                        </div>

                        {/* Info Badges */}
                        <div className="flex justify-center gap-4 mb-8 flex-wrap">
                            {member.address && (
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300 text-sm border border-slate-100 dark:border-slate-600">
                                    <MapPin size={14} className={iconClass} />
                                    {member.address}
                                </div>
                            )}
                            {member.occupation && (
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300 text-sm border border-slate-100 dark:border-slate-600">
                                    <Briefcase size={14} className={iconClass} />
                                    {member.occupation}
                                </div>
                            )}
                            {member.phone && (
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300 text-sm border border-slate-100 dark:border-slate-600">
                                    <Phone size={14} className={iconClass} />
                                    {member.phone}
                                </div>
                            )}
                        </div>

                        {/* Biography */}
                        <div className="space-y-4">
                            {member.biography ? (
                                <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-100 dark:border-slate-600 italic text-slate-600 dark:text-slate-300 leading-relaxed text-center">
                                    "{member.biography}"
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 italic text-sm">
                                    Belum ada biografi. {isAdmin ? 'Tambahkan melalui menu Edit.' : 'Hubungi Admin untuk memperbarui data.'}
                                </div>
                            )}

                            {/* Family Section - Simple */}
                            <div className="border-t border-slate-100 dark:border-slate-700 pt-6 mt-6">
                                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 text-center">Keluarga Inti</h3>
                                <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400 items-center">
                                    {member.parents.length > 0 && (
                                        <p>
                                            <span className="font-medium text-slate-500 dark:text-slate-400">Orang Tua:</span>{' '}
                                            {member.parents.map((p, idx) => {
                                                const parent = members.find(m => m.id === (typeof p === 'string' ? p : p.id));
                                                const type = typeof p === 'object' && p.type === 'step' ? 'Tiri/Angkat' : 'Kandung';
                                                return (
                                                    <span key={idx}>
                                                        {parent?.name} ({type}){idx < member.parents.length - 1 ? ', ' : ''}
                                                    </span>
                                                );
                                            })}
                                        </p>
                                    )}
                                    {member.spouses && member.spouses.length > 0 && (
                                        <p>
                                            <span className="font-medium text-slate-500 dark:text-slate-400">Pasangan:</span>{' '}
                                            {member.spouses.map((s, idx) => {
                                                const spouseId = typeof s === 'string' ? s : s.id;
                                                const spouse = members.find(m => m.id === spouseId);
                                                return (
                                                    <span key={idx}>
                                                        {spouse?.name}{idx < member.spouses.length - 1 ? ', ' : ''}
                                                    </span>
                                                );
                                            })}
                                        </p>
                                    )}
                                    {member.children && member.children.length > 0 && <p><span className="font-medium text-slate-500 dark:text-slate-400">Anak:</span> {member.children.map(cid => members.find(m => m.id === cid)?.name).join(', ')}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
