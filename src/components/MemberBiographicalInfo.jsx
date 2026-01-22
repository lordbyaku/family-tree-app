const MemberBiographicalInfo = ({ formData, handleChange }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Pekerjaan</label>
                    <input
                        type="text"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl outline-none"
                        placeholder="Guru"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Domisili</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl outline-none"
                        placeholder="Jakarta"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Biografi</label>
                <textarea
                    name="biography"
                    value={formData.biography}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl outline-none resize-none"
                    placeholder="Cerita singkat..."
                ></textarea>
            </div>
        </div>
    );
};

export default MemberBiographicalInfo;
