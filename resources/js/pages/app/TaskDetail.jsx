import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, dateFmt, naira } from '../../lib/api';
import { useFetch } from '../../lib/hooks';
import { useApp } from '../../context/AppContext';
import { Field, Icon, PlatformChip, Skeletons, Status } from '../../components/ui';

export default function TaskDetail() {
    const { id } = useParams();
    const { data, loading, error, reload } = useFetch(`/tasks/${id}`);
    const { toast } = useApp();
    const [proof, setProof] = useState('');
    const [file, setFile] = useState(null);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState({});

    if (loading) return <Skeletons n={2} h="h-56" />;
    if (error) return <div className="card text-center"><p className="font-semibold">{error}</p><Link to="/app/tasks" className="btn btn-primary mt-4">Back to marketplace</Link></div>;
    const { task, my_submission: mine, is_owner } = data;
    const canSubmit = !mine && !is_owner && task.status === 'active' && task.remaining > 0;

    const submit = async (e) => {
        e.preventDefault(); setBusy(true); setErr({});
        const fd = new FormData(); fd.append('proof', proof); if (file) fd.append('proof_image', file);
        try { await api(`/tasks/${id}/submit`, { method: 'POST', body: fd }); toast('Submitted! The advertiser will review your proof.'); setProof(''); setFile(null); reload(); }
        catch (x) { setErr(x.errors || {}); toast(x.message, 'error'); }
        setBusy(false);
    };

    return (
        <div className="animate-rise grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="card !p-8">
                <Link to="/app/tasks" className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-violet"><Icon name="arrow_back" size={18} />Marketplace</Link>
                <div className="flex flex-wrap items-center justify-between gap-3"><PlatformChip platform={task.platform} large /><Status value={task.status} /></div>
                <h1 className="mt-5 text-3xl font-extrabold">{task.title}</h1>
                <p className="mt-1 text-sm text-ink-500">By {task.user?.name} · posted {dateFmt(task.created_at)}</p>
                <h3 className="mb-2 mt-8 text-lg font-bold">What to do</h3>
                <p className="whitespace-pre-line text-ink-700">{task.description}</p>
                <a href={task.link} target="_blank" rel="noopener noreferrer nofollow" className="btn btn-dark mt-6"><Icon name="open_in_new" size={20} />Open task link</a>
            </div>
            <div className="grid content-start gap-6">
                <div className="card bg-gradient-to-br from-mint-100 to-white"><p className="text-sm font-semibold text-ink-500">You earn</p><p className="font-display text-5xl font-extrabold text-[#0b7a5c]">{naira(task.reward)}</p><p className="mt-2 flex items-center gap-1 text-sm text-ink-500"><Icon name="group" size={18} />{task.remaining} of {task.slots} slots left</p></div>
                <div className="card">
                    {mine ? (
                        <div className="text-center"><Status value={mine.status} /><h3 className="mt-3 text-lg font-bold">{mine.status === 'pending' ? 'Waiting for review' : mine.status === 'approved' ? 'Reward paid' : 'Not approved'}</h3>{mine.note && <p className="mt-1 text-sm text-ink-500">{mine.note}</p>}</div>
                    ) : is_owner ? (
                        <div className="text-center"><p className="font-semibold">This is your campaign.</p><Link to={`/app/campaigns/${task.id}`} className="btn btn-primary mt-3">Manage campaign</Link></div>
                    ) : canSubmit ? (
                        <form onSubmit={submit} className="grid gap-4"><h3 className="text-lg font-bold">Submit proof</h3>
                            <Field label="Describe what you did" error={err.proof?.[0]}><textarea className="input min-h-28" required minLength={5} value={proof} onChange={(e) => setProof(e.target.value)} placeholder="Username, profile link, or short note" /></Field>
                            <Field label="Screenshot (optional)" error={err.proof_image?.[0]}><input type="file" accept="image/*" className="input !p-2 file:mr-3 file:rounded-full file:border-0 file:bg-violet-100 file:px-4 file:py-1.5 file:font-semibold file:text-violet" onChange={(e) => setFile(e.target.files[0])} /></Field>
                            <button className="btn btn-primary" disabled={busy}>{busy ? 'Submitting...' : 'Submit for review'}</button></form>
                    ) : <p className="text-center font-semibold text-ink-500">This task is not accepting submissions.</p>}
                </div>
            </div>
        </div>
    );
}
