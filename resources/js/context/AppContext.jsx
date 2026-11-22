import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from '../lib/api';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
    const [user, setUser] = useState(null);
    const [config, setConfig] = useState(null);
    const [booting, setBooting] = useState(true);
    const [toasts, setToasts] = useState([]);

    const toast = useCallback((message, type = 'success') => {
        const id = Math.random().toString(36).slice(2);
        setToasts((t) => [...t, { id, message, type }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
    }, []);

    const refreshUser = useCallback(async () => {
        if (!getToken()) return setUser(null);
        try { setUser(await api('/me')); } catch { setUser(null); }
    }, []);

    useEffect(() => {
        (async () => {
            await Promise.all([api('/config').then(setConfig).catch(() => {}), refreshUser()]);
            setBooting(false);
        })();
        const out = () => setUser(null);
        window.addEventListener('taskflow:logout', out);
        return () => window.removeEventListener('taskflow:logout', out);
    }, [refreshUser]);

    const login = (token, u) => { setToken(token); setUser(u); };
    const logout = async () => {
        try { await api('/logout', { method: 'POST' }); } catch {}
        setToken(null);
        setUser(null);
    };

    return (
        <Ctx.Provider value={{ user, config, booting, login, logout, refreshUser, toast }}>
            {children}
            <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3" aria-live="polite">
                {toasts.map((t) => (
                    <div key={t.id} className={`animate-pop flex max-w-sm items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-2xl ${t.type === 'error' ? 'bg-coral' : 'bg-ink'}`}>
                        <span className="material-symbols-rounded">{t.type === 'error' ? 'error' : 'check_circle'}</span>
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </Ctx.Provider>
    );
}
