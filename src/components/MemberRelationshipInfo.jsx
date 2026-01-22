import { X } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

const MemberRelationshipInfo = ({
    formData,
    members,
    initialData,
    handleParentAdd,
    toggleParentType,
    removeParent,
    handleSpouseAdd,
    removeSpouse
}) => {
    return (
        <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-700">
            {/* Parents */}
            <div className="space-y-3">
                <SearchableSelect
                    label={`Orang Tua (${formData.parents.length}/4)`}
                    placeholder="Cari nama ayah/ibu..."
                    members={members}
                    onSelect={handleParentAdd}
                    excludeIds={[...(initialData ? [initialData.id] : []), ...formData.parents.map(p => p.id)]}
                    disabled={formData.parents.length >= 4}
                />

                <div className="grid grid-cols-1 gap-2">
                    {formData.parents.map(pObj => {
                        const parent = members.find(m => m.id === pObj.id);
                        return (
                            <div key={pObj.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                                        {parent?.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{parent?.name}</p>
                                        <button
                                            type="button"
                                            onClick={() => toggleParentType(pObj.id)}
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${pObj.type === 'biological' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'}`}
                                        >
                                            {pObj.type === 'biological' ? 'Kandung' : 'Tiri/Angkat'}
                                        </button>
                                    </div>
                                </div>
                                <button type="button" onClick={() => removeParent(pObj.id)} className="text-slate-400 hover:text-red-500 p-1">
                                    <X size={18} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Spouses */}
            <div className="space-y-3">
                <SearchableSelect
                    label="Pasangan"
                    placeholder="Cari nama suami/istri..."
                    members={members}
                    onSelect={handleSpouseAdd}
                    excludeIds={[...(initialData ? [initialData.id] : []), ...formData.spouses, ...formData.parents.map(p => p.id)]}
                />

                <div className="flex flex-wrap gap-2">
                    {formData.spouses.map(sid => {
                        const spouse = members.find(m => m.id === sid);
                        return (
                            <div key={sid} className="flex items-center gap-2 bg-pink-50 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 px-3 py-1.5 rounded-full text-xs font-bold border border-pink-100 dark:border-pink-800 animate-in fade-in zoom-in duration-300">
                                <span className="truncate max-w-[120px]">{spouse?.name}</span>
                                <button type="button" onClick={() => removeSpouse(sid)} className="hover:text-red-500 bg-white/50 dark:bg-slate-800 rounded-full p-0.5"><X size={12} /></button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MemberRelationshipInfo;
