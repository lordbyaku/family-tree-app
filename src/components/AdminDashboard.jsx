import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { Users, UserPlus, Trash2, Shield, Mail, Key, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { user, isAdmin } = useAuth();
    const [allUsers, setAllUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const toast = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAdmin) {
            navigate('/');
            return;
        }
        fetchUsers();
    }, [isAdmin, navigate]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('app_users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAllUsers(data || []);
        } catch (error) {
            toast.error("Gagal mengambil data user: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            // Check if exists
            const { data: existing } = await supabase
                .from('app_users')
                .select('email')
                .eq('email', newUserEmail)
                .single();

            if (existing) {
                toast.error("Email sudah terdaftar.");
                setIsCreating(false);
                return;
            }

            const newUser = {
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                role: 'admin'
            };

            const { error } = await supabase.from('app_users').insert([newUser]);
            if (error) throw error;

            toast.success("User baru berhasil dibuat!");
            setNewUserName('');
            setNewUserEmail('');
            setNewUserPassword('');
            fetchUsers();
        } catch (error) {
            toast.error("Gagal membuat user: " + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteUser = async (userId, userEmail) => {
        if (userEmail === user.email) {
            toast.error("Anda tidak bisa menghapus akun sendiri!");
            return;
        }

        if (!confirm(`Hapus user ${userEmail}? Tindakan ini tidak dapat dibatalkan.`)) return;

        try {
            const { error } = await supabase
                .from('app_users')
                .delete()
                .eq('id', userId);

            if (error) throw error;
            toast.success("User berhasil dihapus.");
            fetchUsers();
        } catch (error) {
            toast.error("Gagal menghapus user: " + error.message);
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-600 dark:text-slate-400"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Master Admin</h1>
                            <p className="text-slate-500 dark:text-slate-400">Manajemen Pengguna & Akses</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                        <Shield size={18} />
                        <span>Super Admin Mode</span>
                    </div>
                </header>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Create Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <UserPlus size={20} className="text-blue-600" />
                                User Baru
                            </h2>

                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Nama Lengkap</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                            <Users size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            value={newUserName}
                                            onChange={(e) => setNewUserName(e.target.value)}
                                            placeholder="Nama User"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                            <Mail size={16} />
                                        </div>
                                        <input
                                            type="email"
                                            value={newUserEmail}
                                            onChange={(e) => setNewUserEmail(e.target.value)}
                                            placeholder="email@example.com"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                            <Key size={16} />
                                        </div>
                                        <input
                                            type="password"
                                            value={newUserPassword}
                                            onChange={(e) => setNewUserPassword(e.target.value)}
                                            placeholder="Min 6 karakter"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
                                >
                                    {isCreating ? <Loader2 size={18} className="animate-spin" /> : <><UserPlus size={18} /> Buat Akun</>}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Users List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Users size={20} className="text-indigo-600" />
                                    Daftar Pengguna
                                </h2>
                                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full uppercase tracking-wider">
                                    {allUsers.length} Users
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">User</th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Role</th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Password (Plain)</th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                                                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                                                    Memuat data...
                                                </td>
                                            </tr>
                                        ) : allUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                                                    Belum ada user terdaftar.
                                                </td>
                                            </tr>
                                        ) : allUsers.map((u) => (
                                            <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                                                            {u.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                                                            <p className="text-xs text-slate-500">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                                        }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs text-slate-400">
                                                    {u.password}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id, u.email)}
                                                        className={`p-2 rounded-lg transition-colors ${u.email === user.email
                                                                ? 'text-slate-200 dark:text-slate-800 cursor-not-allowed'
                                                                : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                            }`}
                                                        disabled={u.email === user.email}
                                                        title="Hapus User"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
