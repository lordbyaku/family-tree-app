import { Search, X } from 'lucide-react';

const SearchBar = ({ searchQuery, setSearchQuery, filteredMembers, selectSearchResult, setIsNavOpen }) => {
    return (
        <div className="relative w-full md:w-64">
            <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white dark:focus-within:bg-slate-700 transition-all">
                <Search size={18} className="text-slate-400 mr-2" />
                <input
                    type="text"
                    placeholder="Cari anggota..."
                    className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {searchQuery && filteredMembers.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 py-1 max-h-60 overflow-y-auto z-[60]">
                    {filteredMembers.map(m => (
                        <button
                            key={m.id}
                            onClick={() => {
                                selectSearchResult(m.id);
                                if (window.innerWidth < 768) setIsNavOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2"
                        >
                            {m.photo ? (
                                <img src={m.photo} className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                                    {m.name.charAt(0)}
                                </div>
                            )}
                            <span className="truncate">{m.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
