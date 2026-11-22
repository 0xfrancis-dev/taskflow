import { useState } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Icon, Logo } from '../../components/ui';
import { naira } from '../../lib/api';

const NAV = [
    ['/app', 'dashboard', 'Dashboard', true], ['/app/tasks', 'storefront', 'Task marketplace'], ['/app/campaigns', 'campaign', 'My campaigns'],
    ['/app/submissions', 'assignment_turned_in', 'My submissions'], ['/app/wallet', 'account_balance_wallet', 'Wallet'], ['/app/referrals', 'redeem', 'Referrals'], ['/app/profile', 'person', 'Profile'],
];

export function Sidebar({ items, onNavigate, extra }) {
    return (
        <nav className="flex flex-col gap-1">
            {items.map(([to, icon, label, end]) => (
                <NavLink key={to} to={to} end={end} onClick={onNavigate} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-violet text-white shadow-lg shadow-violet/30' : 'text-ink-500 hover:bg-violet-100 hover:text-violet'}`}>
                    <Icon name={icon} size={22} />{label}
                </NavLink>
            ))}
            {extra}
        </nav>
    );
}

export default function AppLayout() {
    const { user, logout, config } = useApp();
    const [open, setOpen] = useState(false);
    const nav = useNavigate();
    useLocation();
    const out = async () => { await logout(); nav('/'); };

    const side = (
        <div className="flex h-full flex-col">
            <Logo className="mb-8 px-2" />
            <Sidebar items={NAV} onNavigate={() => setOpen(false)} extra={user.role === 'admin' && <Link to="/admin" className="mt-4 flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white"><Icon name="admin_panel_settings" size={22} />Admin dashboard</Link>} />
            <div className="mt-auto rounded-3xl bg-ink p-5 text-white">
                <p className="text-xs text-ink-300">Need help?</p>
                <a href={`mailto:${config?.support_email}`} className="mt-1 block break-all text-sm font-semibold underline decoration-coral underline-offset-4">{config?.support_email}</a>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
            <aside className="sticky top-0 hidden h-screen border-r border-ink-100 bg-white p-5 lg:block">{side}</aside>
            {open && <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}><aside className="h-full w-72 bg-white p-5" onClick={(e) => e.stopPropagation()}>{side}</aside></div>}
            <div className="min-w-0">
                <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-ink-100 bg-paper/80 px-5 py-3 backdrop-blur-xl">
                    <button className="grid h-10 w-10 place-items-center rounded-full bg-white shadow lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
                    <p className="hidden font-display text-lg font-bold lg:block">Hi, {user.name.split(' ')[0]} <span className="inline-block animate-float">👋</span></p>
                    <div className="ml-auto flex items-center gap-3">
                        <Link to="/app/wallet" className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm transition hover:shadow-md"><Icon name="account_balance_wallet" size={20} className="text-violet" />{naira(user.balance)}</Link>
                        <Link to="/app/campaigns/new" className="btn btn-primary btn-sm hidden sm:inline-flex"><Icon name="add" size={18} />New campaign</Link>
                        <button onClick={out} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm hover:text-coral" aria-label="Log out"><Icon name="logout" size={20} /></button>
                    </div>
                </header>
                <main className="mx-auto max-w-6xl p-5 sm:p-8"><Outlet /></main>
            </div>
        </div>
    );
}
