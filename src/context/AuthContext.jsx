import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('family-tree-auth-user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [isAuthLoading, setIsAuthLoading] = useState(false);

    const register = async (name, email, password) => {
        setIsAuthLoading(true);
        try {
            // Check if user exists
            const { data: existing } = await supabase
                .from('app_users')
                .select('email')
                .eq('email', email)
                .single();

            if (existing) return { success: false, message: 'Email sudah terdaftar.' };

            const newUser = { name, email, password, role: 'admin' };
            const { error } = await supabase.from('app_users').insert([newUser]);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        } finally {
            setIsAuthLoading(false);
        }
    };

    const login = async (email, password) => {
        setIsAuthLoading(true);
        try {
            const { data, error } = await supabase
                .from('app_users')
                .select('*')
                .eq('email', email)
                .eq('password', password)
                .single();

            if (error || !data) {
                return { success: false, message: 'Email atau password salah.' };
            }

            const { password: _, ...userSession } = data;
            setUser(userSession);
            localStorage.setItem('family-tree-auth-user', JSON.stringify(userSession));
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        } finally {
            setIsAuthLoading(false);
        }
    };

    const loginAsGuest = () => {
        const guestUser = { name: 'Tamu', role: 'guest' };
        setUser(guestUser);
        localStorage.setItem('family-tree-auth-user', JSON.stringify(guestUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('family-tree-auth-user');
    };

    const isAdmin = user?.role === 'admin';
    const isGuest = user?.role === 'guest';

    return (
        <AuthContext.Provider value={{
            user, login, register, loginAsGuest, logout,
            isAdmin, isGuest, isAuthenticated: !!user,
            isAuthLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
};
