import { useState, useRef, useEffect } from 'react';

const SearchableSelect = ({ label, placeholder, members, onSelect, excludeIds = [], disabled = false }) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const filtered = query.trim() === ''
        ? []
        : members.filter(m =>
            !excludeIds.includes(m.id) &&
            m.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
            <div className={`flex items-center border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden ${disabled ? 'opacity-50 grayscale' : ''}`}>
                <input
                    type="text"
                    disabled={disabled}
                    placeholder={disabled ? 'Batas tercapai' : placeholder}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                    className="w-full px-3 py-2 bg-transparent outline-none text-sm dark:text-white"
                />
            </div>
            {isOpen && filtered.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                    {filtered.map(m => (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                                onSelect(m.id);
                                setQuery('');
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 text-sm flex items-center gap-2 dark:text-slate-200"
                        >
                            {m.photo ? (
                                <img src={m.photo} className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-[8px] font-bold">
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

export default SearchableSelect;
