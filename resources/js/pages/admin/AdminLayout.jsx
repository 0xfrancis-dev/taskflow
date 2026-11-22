import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Icon, Logo } from '../../components/ui';
import { Sidebar } from '../app/AppLayout';

const NAV = [
    ['/admin', 'monitoring', 'Overview', true], ['/admin/users', 'group', 'Users'], ['/admin/campaigns', 'campaign', 'Campaigns'],
    ['/admin/withdrawals', 'north_east', 'Withdrawals'], ['/admin/deposits', 'south_west', 'Deposits'], ['/admin/messages', 'mail', 'Messages'],
];

export default function AdminLayout() {
    const { logout, user } = useApp();
    const [open, setOpen] = useState(false);
    const nav = useNavigate();
    const side = (
        <div className="flex h-full flex-col">
            <Logo light className="mb-2 px-2" />
            <span className="mb-8 ml-2 inline-block w-fit rounded-full bg-coral px-3 py-1 text-xs font-bold text-white">Admin</span>
            <div className="[&_a]:text-ink-300 [&_a:hover]:bg-white/10 [&_a:hover]:text-white [&_a.bg-violet]:!text-white"><Sidebar items={NAV} onNavigate={() => setOpen(false)} /></div>
            <Link to="/app" className="mt-auto flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/20"><Icon name="swap_horiz" size={20} />Switch to user view</Link>
        </div>
    );
    return (
        <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
            <aside className="sticky top-0 hidden h-screen bg-ink p-5 lg:block">{side}</aside>
            {open && <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}><aside className="h-full w-72 bg-ink p-5" onClick={(e) => e.stopPropagation()}>{side}</aside></div>}
            <div className="min-w-0">
                <header className="sticky top-0 z-40 flex items-center justify-between border-b border-ink-100 bg-paper/80 px-5 py-3 backdrop-blur-xl">
                    <button className="grid h-10 w-10 place-items-center rounded-full bg-white shadow lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
                    <p className="hidden font-display text-lg font-bold lg:block">Admin dashboard</p>
                    <div className="flex items-center gap-3"><span className="hidden text-sm font-semibold text-ink-500 sm:block">{user.email}</span><button onClick={async () => { await logout(); nav('/'); }} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm hover:text-coral" aria-label="Log out"><Icon name="logout" size={20} /></button></div>
                </header>
                <main className="p-5 sm:p-8"><Outlet /></main>
            </div>
        </div>
    );
}
