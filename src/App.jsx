import { useState, useRef, useEffect, useMemo } from 'react'
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom'
import { FamilyProvider, useFamily } from './context/FamilyContext'
import FamilyTree from './components/FamilyTree'
import MemberForm from './components/MemberForm'

import StatsModal from './components/StatsModal'
import RelationshipModal from './components/RelationshipModal'
import ProfileModal from './components/ProfileModal'
import ExportModal from './components/ExportModal'
import BirthdayDashboard from './components/BirthdayDashboard'
import { Download, Upload, Search, Image as ImageIcon, BarChart3, FileSpreadsheet, Calculator, Moon, Sun, Users, Filter, X, BookOpen, RotateCcw, RotateCw, Map as MapIcon, Menu, LogOut, User, Cake } from 'lucide-react'
import { toPng } from 'html-to-image';
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginScreen from './components/LoginScreen'

import { ToastProvider, useToast } from './context/ToastContext';
import SearchBar from './components/SearchBar';
import ImportExportActions from './components/ImportExportActions';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';

// Inner component to access context
const MainLayout = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isRelOpen, setIsRelOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [viewingMemberId, setViewingMemberId] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusNodeId, setFocusNodeId] = useState(null);
  const [layoutMode, setLayoutMode] = useState('auto'); // 'auto' | 'manual'
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [filterMode, setFilterMode] = useState(null); // 'ancestors' | 'descendants' | null
  const [filterRootId, setFilterRootId] = useState(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isBirthdayOpen, setIsBirthdayOpen] = useState(false);

  const {
    members,
    treeSlug,
    setTreeSlug,
    exportData,
    importData,
    importFromExcel,
    undo,
    redo,
    canUndo,
    canRedo,
    lastAction,
    isLoading,
    migrateFromLocal
  } = useFamily();

  const { treeSlug: urlSlug } = useParams();
  const navigate = useNavigate();

  // Sync Global treeSlug with URL
  useEffect(() => {
    if (urlSlug && urlSlug !== treeSlug) {
      setTreeSlug(urlSlug);
    } else if (!urlSlug) {
      setTreeSlug('default');
    }
  }, [urlSlug, setTreeSlug, treeSlug]);
  const { user, logout, isAdmin, isAuthenticated, isAuthLoading } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const excelInputRef = useRef(null);

  const hasLocalData = !!localStorage.getItem('family-tree-data');

  const handleMigration = async () => {
    const result = await migrateFromLocal();
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };


  const handleEdit = (id) => {
    setEditingMemberId(id);
    setIsFormOpen(true);
  };

  const handleView = (id) => {
    setViewingMemberId(id);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingMemberId(null);
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim() === '') {
      setFocusNodeId(null);
    }
  };

  const selectSearchResult = (id) => {
    setFocusNodeId(id);
    setSearchQuery('');
  };

  // Dark Mode Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // useKeyboardShortcuts hook
  useKeyboardShortcuts({
    setIsFormOpen,
    setIsStatsOpen,
    setIsRelOpen,
    setViewingMemberId,
    setEditingMemberId,
    canUndo,
    canRedo,
    undo,
    redo,
    lastAction,
    toast
  });

  const filteredMembers = searchQuery
    ? members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleExcelClick = () => {
    excelInputRef.current?.click();
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await importData(file);
      toast.success("Data berhasil di-restore!");
    } catch (error) {
      toast.error("Gagal mengimpor data: " + error.message);
    }
    e.target.value = '';
  };

  const handleExcelChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await importFromExcel(file);
      toast.success("Data Excel berhasil di-import!");
    } catch (error) {
      toast.error("Gagal import Excel: " + error.message);
    }
    e.target.value = '';
  }

  const handleExportImage = async () => {
    const element = document.querySelector('.react-flow__viewport');
    if (!element) return;

    try {
      const dataUrl = await toPng(element, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', style: { transform: 'translate(0,0) scale(1)' } });
      const link = document.createElement('a');
      link.download = `family-tree-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Gambar berhasil diexport!");
    } catch (err) {
      console.error("Gagal export gambar", err);
      toast.error("Gagal melakukan export gambar.");
    }
  };

  const editingMember = editingMemberId ? members.find(m => m.id === editingMemberId) : null;

  const resetLayout = () => {
    localStorage.removeItem('family-tree-custom-layout');
    setLayoutMode('auto');
    toast.success("Layout berhasil di-reset ke otomatis");
  };

  const hasBirthdaysToday = useMemo(() => {
    const today = new Date();
    const d = today.getDate();
    const m = today.getMonth() + 1;
    return members.some(member => {
      if (!member.birthDate) return false;
      const parts = member.birthDate.split('-');
      return parseInt(parts[2]) === d && parseInt(parts[1]) === m;
    });
  }, [members]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {isAdmin && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <input
            type="file"
            ref={excelInputRef}
            onChange={handleExcelChange}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
        </>
      )}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row md:justify-between md:items-center shadow-sm z-30 transition-colors duration-300">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3 md:gap-4 truncate">
            <h1 className="text-lg md:text-2xl font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap overflow-hidden text-ellipsis">
              {treeSlug === 'utama' || treeSlug === 'default' ? 'Silsilah Keluarga' : `Silsilah: ${treeSlug.charAt(0).toUpperCase() + treeSlug.slice(1)}`}
            </h1>

            <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

            {/* Undo/Redo Buttons - Visible to Admin */}
            {isAdmin && (
              <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                <button
                  onClick={() => {
                    undo();
                    toast.info(`Undo: ${lastAction}`);
                  }}
                  disabled={!canUndo}
                  className={`p-1.5 rounded ${canUndo ? 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 shadow-sm' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
                  title="Undo (Ctrl+Z)"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  onClick={() => {
                    redo();
                    toast.info(`Redo: ${lastAction}`);
                  }}
                  disabled={!canRedo}
                  className={`p-1.5 rounded ${canRedo ? 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 shadow-sm' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
                  title="Redo (Ctrl+Y)"
                >
                  <RotateCw size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              {isNavOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Navigation Actions - Responsive */}
        <div className={`
          ${isNavOpen ? 'flex' : 'hidden md:flex'} 
          flex-col md:flex-row items-center gap-3 pt-4 md:pt-0 w-full md:w-auto mt-4 md:mt-0 
          border-t md:border-t-0 border-slate-100 dark:border-slate-700
        `}>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${isAdmin ? 'bg-blue-600' : 'bg-slate-500'}`}>
                {isAdmin ? 'A' : 'T'}
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-none">{user?.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{user?.role}</span>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                toast.info("Anda telah keluar");
              }}
              className="ml-1 p-1 text-slate-400 hover:text-red-500 transition-colors"
              title="Keluar"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          {isAdmin && hasLocalData && (
            <button
              onClick={handleMigration}
              className="hidden md:flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors text-[10px] font-bold"
              title="Pindah data dari browser ke Database online"
            >
              <Users size={14} />
              Migrasi Cloud
            </button>
          )}

          {/* Action Buttons Group */}
          <div className="grid grid-cols-4 md:flex items-center gap-2 w-full md:w-auto">
            <ImportExportActions
              isAdmin={isAdmin}
              handleImportClick={handleImportClick}
              handleExcelClick={handleExcelClick}
              exportData={exportData}
              setIsExportModalOpen={setIsExportModalOpen}
              toast={toast}
            />

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center justify-center text-slate-600 dark:text-amber-400 hover:text-blue-600 dark:hover:text-amber-300 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border md:border-0 border-slate-200 dark:border-slate-700"
              title={isDarkMode ? "Mode Terang" : "Mode Gelap"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              onClick={handleExportImage}
              className="flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border md:border-0 border-slate-200 dark:border-slate-700"
              title="Export Image (PNG)"
            >
              <ImageIcon size={20} />
            </button>

            <button
              onClick={() => setIsStatsOpen(true)}
              className="flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border md:border-0 border-slate-200 dark:border-slate-700"
              title="Statistik"
            >
              <BarChart3 size={20} />
            </button>

            <button
              onClick={() => setIsRelOpen(true)}
              className="flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border md:border-0 border-slate-200 dark:border-slate-700"
              title="Cek Hubungan"
            >
              <Calculator size={20} />
            </button>

            <button
              onClick={() => setIsBirthdayOpen(true)}
              className={`relative flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-pink-600 dark:hover:text-pink-400 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border md:border-0 border-slate-200 dark:border-slate-700 ${hasBirthdaysToday ? 'text-pink-600 dark:text-pink-400' : ''}`}
              title="Ulang Tahun"
            >
              <Cake size={20} />
              {hasBirthdaysToday && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full animate-bounce"></span>
              )}
            </button>
          </div>

          <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredMembers={filteredMembers}
            selectSearchResult={selectSearchResult}
            setIsNavOpen={setIsNavOpen}
          />

          {/* Add Member Button */}
          {isAdmin && (
            <button
              onClick={() => {
                setIsFormOpen(true);
                if (window.innerWidth < 768) setIsNavOpen(false);
              }}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <span>+ Tambah Anggota</span>
            </button>
          )}
        </div>
      </header>

      {/* Tertiary Navigation (MiniMap, Layout, Filters) - Sticky or Floating for better Mobile Reach */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {/* Filter Controls */}
        {filterMode && filterRootId && (
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/40 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800 flex-shrink-0 animate-in fade-in slide-in-from-left-2">
            <Filter size={14} className="text-blue-600 dark:text-blue-400" />
            <span className="text-[11px] md:text-xs text-blue-700 dark:text-blue-300 font-bold whitespace-nowrap">
              {filterMode === 'ancestors' ? 'Leluhur' : 'Keturunan'}: {members.find(m => m.id === filterRootId)?.name}
            </span>
            <button
              onClick={() => {
                setFilterMode(null);
                setFilterRootId(null);
                toast.info("Filter dibersihkan");
              }}
              className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full transition-colors"
            >
              <X size={12} className="text-blue-600 dark:text-blue-400" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setShowMiniMap(!showMiniMap)}
            className={`p-2 rounded-xl transition-all ${showMiniMap ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'} border border-transparent ${showMiniMap ? 'border-blue-100 dark:border-blue-800' : ''}`}
            title="Mini-Map"
          >
            <MapIcon size={18} />
          </button>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setLayoutMode('auto')}
              className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${layoutMode === 'auto' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Auto
            </button>
            <button
              onClick={() => setLayoutMode('manual')}
              className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${layoutMode === 'manual' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Manual
            </button>
          </div>

          {layoutMode === 'manual' && (
            <button
              onClick={resetLayout}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"
              title="Reset Layout"
            >
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      </div>

      <main className="flex-1 relative">
        {members.length > 0 ? (
          <FamilyTree
            onEdit={handleEdit}
            onView={handleView}
            focusNodeId={focusNodeId}
            isDarkMode={isDarkMode}
            filterMode={filterMode}
            filterRootId={filterRootId}
            layoutMode={layoutMode}
            showMiniMap={showMiniMap}
            onFilterRequest={(mode, rootId) => {
              setFilterMode(mode);
              setFilterRootId(rootId);
              toast.success(`Filter ${mode === 'ancestors' ? 'Leluhur' : 'Keturunan'} diterapkan`);
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
              <Users size={40} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">Silsilah Masih Kosong</h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-md mb-8 leading-relaxed">
              Mulai membangun pohon keluarga Anda sekarang! Tambahkan orang pertama atau impor data.
            </p>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <button
                onClick={() => setIsFormOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Users size={20} />
                Tambah Anggota
              </button>
              <button
                onClick={handleImportClick}
                className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-8 py-3.5 rounded-2xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <Upload size={20} />
                Restore Data
              </button>
            </div>
          </div>
        )}
      </main>

      {viewingMemberId && (
        <ProfileModal
          memberId={viewingMemberId}
          onClose={() => setViewingMemberId(null)}
          onEdit={() => {
            setViewingMemberId(null);
            handleEdit(viewingMemberId);
          }}
        />
      )}

      {isFormOpen && (
        <MemberForm
          onClose={handleClose}
          initialData={editingMember}
        />
      )}

      {isStatsOpen && <StatsModal onClose={() => setIsStatsOpen(false)} />}
      {isBirthdayOpen && (
        <BirthdayDashboard
          onClose={() => setIsBirthdayOpen(false)}
          onViewProfile={(id) => {
            setIsBirthdayOpen(false);
            setViewingMemberId(id);
          }}
        />
      )}

      {isRelOpen && (
        <RelationshipModal onClose={() => setIsRelOpen(false)} />
      )}

      {isExportModalOpen && (
        <ExportModal onClose={() => setIsExportModalOpen(false)} />
      )}

      {/* Loading Overlay */}
      {(isLoading || isAuthLoading) && (
        <div className="fixed inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="flex flex-col items-center gap-4 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">Menyingkronkan data...</p>
          </div>
        </div>
      )}
    </div>
  );
};

import { ConfirmProvider } from './context/ConfirmContext';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <FamilyProvider>
              <Routes>
                <Route path="/:treeSlug?" element={<MainLayout />} />
              </Routes>
            </FamilyProvider>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
