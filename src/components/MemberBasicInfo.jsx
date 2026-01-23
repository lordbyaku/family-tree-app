const MemberBasicInfo = ({ formData, handleChange, setFormData }) => {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nama Lengkap</label>
                <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Budi Santoso"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tanggal Lahir</label>
                    <input
                        type="date"
                        name="birthDate"
                        required
                        value={formData.birthDate}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Jenis Kelamin</label>
                    <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em]"
                    >
                        <option value="male">Laki-laki</option>
                        <option value="female">Perempuan</option>
                    </select>
                </div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${formData.isDeceased ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-700 border-slate-100 dark:border-slate-600'}`}>
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={formData.isDeceased}
                        onChange={e => setFormData(prev => ({ ...prev, isDeceased: e.target.checked }))}
                        className="w-5 h-5 text-blue-600 rounded-lg focus:ring-blue-500 border-slate-300"
                        id="deceased-check"
                    />
                    <label htmlFor="deceased-check" className="text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer flex-1">
                        Sudah Meninggal
                    </label>
                </div>
                {formData.isDeceased && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Tanggal Wafat (Opsional)</label>
                        <input
                            type="date"
                            name="deathDate"
                            value={formData.deathDate}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-xl outline-none"
                        />
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nomor Telepon / WhatsApp</label>
                <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="081234567890"
                />
            </div>
        </div>
    );
};

export default MemberBasicInfo;
