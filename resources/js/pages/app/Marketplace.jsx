import { useState } from 'react';
import { useFetch, useDebounced } from '../../lib/hooks';
import { PLATFORMS } from '../../lib/api';
import { Empty, Icon, Pager, Skeletons, TaskCard } from '../../components/ui';

export default function Marketplace() {
    const [q, setQ] = useState('');
    const [platform, setPlatform] = useState('');
    const [sort, setSort] = useState('new');
    const [page, setPage] = useState(1);
    const dq = useDebounced(q);
    const { data, loading } = useFetch('/tasks', { q: dq, platform, sort, page }, []);

    return (
        <div className="animate-rise">
            <h1 className="text-4xl font-extrabold">Task marketplace</h1>
            <p className="mt-1 text-ink-500">Pick a task, follow the steps, submit proof and get paid when it is approved.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1"><Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" /><input className="input !pl-12" placeholder="Search tasks" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
                <select className="input sm:w-48" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}><option value="new">Newest</option><option value="reward">Highest reward</option></select>
            </div>
            <div className="scroll-slim mt-4 flex gap-2 overflow-x-auto pb-2">
                {[['', 'All'], ...Object.entries(PLATFORMS).map(([k, v]) => [k, v.label])].map(([k, l]) => (
                    <button key={k} onClick={() => { setPlatform(k); setPage(1); }} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${platform === k ? 'bg-ink text-white' : 'bg-white text-ink-500 hover:text-violet'}`}>{l}</button>
                ))}
            </div>
            <div className="mt-6">
                {loading ? <Skeletons n={3} h="h-48" /> : data.data.length === 0 ? <Empty icon="search_off" title="No tasks match" text="Try another platform or clear your search." /> : (
                    <><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.data.map((t) => <TaskCard key={t.id} task={t} />)}</div><Pager data={data} onPage={setPage} /></>
                )}
            </div>
        </div>
    );
}
