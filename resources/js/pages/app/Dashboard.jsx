import { Link } from 'react-router-dom';
import { useFetch } from '../../lib/hooks';
import { naira, timeFmt } from '../../lib/api';
import { AreaChart, Empty, Icon, Skeletons, Stat } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { useEffect } from 'react';

export default function Dashboard() {
    const { data: d, loading } = useFetch('/dashboard');
    const { refreshUser } = useApp();
    useEffect(() => { refreshUser(); }, [refreshUser]);
    if (loading || !d) return <Skeletons n={3} h="h-32" />;

    return (
        <div className="grid animate-rise gap-6">
            <div className="relative overflow-hidden rounded-[2rem] bg-ink p-7 text-white sm:p-9">
                <div className="absolute -right-10 -top-10 h-56 w-56 animate-blob rounded-full bg-violet/60 blur-3xl" />
                <p className="relative text-sm font-semibold text-ink-300">Wallet balance</p>
                <p className="relative font-display text-5xl font-extrabold sm:text-6xl">{naira(d.balance)}</p>
                <div className="relative mt-6 flex flex-wrap gap-3">
                    <Link to="/app/wallet" className="btn btn-coral btn-sm"><Icon name="add_card" size={18} />Fund wallet</Link>
                    <Link to="/app/tasks" className="btn bg-white/10 text-white btn-sm hover:bg-white/20"><Icon name="storefront" size={18} />Find tasks</Link>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat icon="payments" label="Total earned" value={naira(d.total_earned)} tone="mint" />
                <Stat icon="campaign" label="Spent on campaigns" value={naira(d.total_spent)} tone="coral" />
                <Stat icon="pending_actions" label="Submissions pending" value={d.submissions.pending} tone="sun" sub={`${d.submissions.approved} approved`} />
                <Stat icon="rate_review" label="Awaiting your review" value={d.campaigns.awaiting_review} tone="violet" sub={`${d.campaigns.active} active campaigns`} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <div className="card"><h3 className="mb-1 text-lg font-bold">Earnings, last 14 days</h3><p className="mb-4 text-sm text-ink-500">Rewards and referral bonuses</p>
                    <AreaChart series={d.series.map((s) => ({ label: new Date(s.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), value: s.total }))} color="#14C99A" format={naira} /></div>
                <div className="card"><h3 className="mb-4 text-lg font-bold">Recent activity</h3>
                    {d.recent.length === 0 ? <Empty icon="receipt_long" title="No activity yet" text="Complete a task or fund your wallet to get started." /> : (
                        <ul className="divide-y divide-ink-100">{d.recent.map((t) => (
                            <li key={t.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{t.description}</p><p className="text-xs text-ink-500">{timeFmt(t.created_at)}</p></div><span className={`shrink-0 text-sm font-bold ${t.amount > 0 ? 'text-mint' : 'text-coral'}`}>{t.amount > 0 ? '+' : ''}{naira(t.amount)}</span></li>
                        ))}</ul>)}
                </div>
            </div>
        </div>
    );
}
