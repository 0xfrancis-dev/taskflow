import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../../lib/hooks';
import { naira, dateFmt } from '../../lib/api';
import { Empty, Icon, Pager, PlatformChip, Skeletons, Status } from '../../components/ui';

export default function MyCampaigns() {
    const [page, setPage] = useState(1);
    const { data, loading } = useFetch('/my-tasks', { page });
    return (
        <div className="animate-rise">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-4xl font-extrabold">My campaigns</h1><p className="text-ink-500">Track progress and review submissions.</p></div><Link to="/app/campaigns/new" className="btn btn-primary"><Icon name="add" size={20} />New campaign</Link></div>
            {loading ? <Skeletons /> : data.data.length === 0 ? <Empty icon="campaign" title="No campaigns yet" text="Create your first campaign and reach real people." action={<Link to="/app/campaigns/new" className="btn btn-primary">Create campaign</Link>} /> : (
                <><div className="grid gap-4">{data.data.map((t) => {
                    const pct = Math.round((t.approved_count / t.slots) * 100);
                    return (
                        <Link key={t.id} to={`/app/campaigns/${t.id}`} className="card group grid gap-4 transition hover:-translate-y-0.5 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center">
                            <div><PlatformChip platform={t.platform} /><h3 className="mt-2 text-lg font-bold group-hover:text-violet">{t.title}</h3><p className="text-xs text-ink-500">Created {dateFmt(t.created_at)} · {naira(t.reward)} each</p></div>
                            <div><div className="mb-1 flex justify-between text-xs font-semibold text-ink-500"><span>{t.approved_count}/{t.slots} done</span><span>{pct}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-gradient-to-r from-violet to-coral transition-all duration-700" style={{ width: `${pct}%` }} /></div></div>
                            <div className="flex items-center gap-2">{t.pending_count > 0 && <span className="badge animate-ring bg-coral text-white">{t.pending_count} to review</span>}<Status value={t.status} /></div>
                        </Link>
                    );
                })}</div><Pager data={data} onPage={setPage} /></>
            )}
        </div>
    );
}
