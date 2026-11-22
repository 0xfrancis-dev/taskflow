import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../../lib/hooks';
import { naira, timeFmt } from '../../lib/api';
import { Empty, Pager, PlatformChip, Skeletons, Status } from '../../components/ui';

export default function MySubmissions() {
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const { data, loading } = useFetch('/my-submissions', { status, page });
    return (
        <div className="animate-rise">
            <h1 className="text-4xl font-extrabold">My submissions</h1><p className="mb-6 text-ink-500">Everything you have completed and its review status.</p>
            <div className="mb-5 flex gap-2">{[['', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']].map(([k, l]) => <button key={k} onClick={() => { setStatus(k); setPage(1); }} className={`rounded-full px-4 py-2 text-sm font-semibold ${status === k ? 'bg-ink text-white' : 'bg-white text-ink-500'}`}>{l}</button>)}</div>
            {loading ? <Skeletons /> : data.data.length === 0 ? <Empty icon="assignment" title="Nothing here yet" text="Complete a task from the marketplace and it will appear here." action={<Link to="/app/tasks" className="btn btn-primary">Browse tasks</Link>} /> : (
                <><div className="grid gap-3">{data.data.map((s) => (
                    <Link key={s.id} to={`/app/tasks/${s.task_id}`} className="card flex flex-wrap items-center justify-between gap-3 !p-5 transition hover:-translate-y-0.5">
                        <div><PlatformChip platform={s.task?.platform} /><p className="mt-1.5 font-bold">{s.task?.title}</p><p className="text-xs text-ink-500">{timeFmt(s.created_at)}{s.note ? ` · ${s.note}` : ''}</p></div>
                        <div className="flex items-center gap-3"><span className="font-display font-extrabold">{naira(s.task?.reward)}</span><Status value={s.status} /></div>
                    </Link>))}</div><Pager data={data} onPage={setPage} /></>
            )}
        </div>
    );
}
