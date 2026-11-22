import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, naira, timeFmt } from '../../lib/api';
import { useFetch } from '../../lib/hooks';
import { useApp } from '../../context/AppContext';
import { Empty, Icon, Modal, PlatformChip, Skeletons, Status } from '../../components/ui';

export default function CampaignDetail() {
    const { id } = useParams();
    const { data, loading, error, reload } = useFetch(`/tasks/${id}/submissions`);
    const { toast, refreshUser, user } = useApp();
    const nav = useNavigate();
    const [rejecting, setRejecting] = useState(null);
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [filter, setFilter] = useState('pending');

    if (loading) return <Skeletons n={3} />;
    if (error) return <div className="card text-center font-semibold">{error}</div>;
    const { task, submissions } = data;
    const mineOwner = task.user_id === user.id;
    const list = submissions.filter((s) => filter === 'all' || s.status === filter);

    const review = async (s, action, n) => {
        setBusy(true);
        try { await api(`/submissions/${s.id}/review`, { method: 'POST', body: { action, note: n } }); toast(action === 'approve' ? `Approved. ${naira(task.reward)} sent.` : 'Submission rejected.'); setRejecting(null); setNote(''); reload(); }
        catch (e) { toast(e.message, 'error'); }
        setBusy(false);
    };
    const toggle = async () => { try { await api(`/tasks/${task.id}/status`, { method: 'PATCH', body: { status: task.status === 'active' ? 'paused' : 'active' } }); reload(); } catch (e) { toast(e.message, 'error'); } };
    const close = async () => {
        if (!window.confirm('Close this campaign? Unused slots will be refunded to your wallet.')) return;
        try { const r = await api(`/tasks/${task.id}`, { method: 'DELETE' }); await refreshUser(); toast(`Campaign closed. ${naira(r.refund)} refunded.`); nav('/app/campaigns'); } catch (e) { toast(e.message, 'error'); }
    };

    return (
        <div className="animate-rise grid gap-6">
            <Link to="/app/campaigns" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-violet"><Icon name="arrow_back" size={18} />My campaigns</Link>
            <div className="card flex flex-wrap items-center justify-between gap-4 !p-7">
                <div><PlatformChip platform={task.platform} large /><h1 className="mt-3 text-3xl font-extrabold">{task.title}</h1><p className="text-sm text-ink-500">{naira(task.reward)} per task · {task.approved_count}/{task.slots} approved</p></div>
                <div className="flex flex-wrap items-center gap-2"><Status value={task.status} />
                    {mineOwner && ['active', 'paused'].includes(task.status) && <button className="btn btn-ghost btn-sm" onClick={toggle}><Icon name={task.status === 'active' ? 'pause' : 'play_arrow'} size={18} />{task.status === 'active' ? 'Pause' : 'Resume'}</button>}
                    {mineOwner && task.status !== 'closed' && <button className="btn btn-ghost btn-sm !text-coral" onClick={close}><Icon name="cancel" size={18} />Close & refund</button>}</div>
            </div>
            <div className="flex gap-2">{['pending', 'approved', 'rejected', 'all'].map((f) => <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${filter === f ? 'bg-ink text-white' : 'bg-white text-ink-500'}`}>{f}{f === 'pending' && task.pending_count > 0 ? ` (${task.pending_count})` : ''}</button>)}</div>
            {list.length === 0 ? <Empty icon="inbox" title={`No ${filter === 'all' ? '' : filter} submissions`} text="Submissions show up here as people complete your task." /> : (
                <div className="grid gap-4">{list.map((s) => (
                    <div key={s.id} className="card grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{s.user?.name}</p><Status value={s.status} /></div><p className="text-xs text-ink-500">{timeFmt(s.created_at)}</p><p className="mt-2 whitespace-pre-line text-sm text-ink-700">{s.proof}</p>
                            {s.proof_image_url && <a href={s.proof_image_url} target="_blank" rel="noreferrer"><img src={s.proof_image_url} alt="Proof screenshot" className="mt-3 max-h-44 rounded-2xl ring-1 ring-ink-100 transition hover:scale-[1.02]" /></a>}
                            {s.note && <p className="mt-2 text-xs italic text-ink-500">Note: {s.note}</p>}</div>
                        {s.status === 'pending' && <div className="flex gap-2"><button className="btn btn-primary btn-sm" disabled={busy} onClick={() => review(s, 'approve')}><Icon name="check" size={18} />Approve</button><button className="btn btn-ghost btn-sm !text-coral" disabled={busy} onClick={() => setRejecting(s)}><Icon name="close" size={18} />Reject</button></div>}
                    </div>
                ))}</div>
            )}
            <Modal open={!!rejecting} onClose={() => setRejecting(null)} title="Reject submission">
                <p className="mb-3 text-sm text-ink-500">Tell {rejecting?.user?.name} why, so they can improve next time.</p>
                <textarea className="input min-h-24" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Screenshot does not show the follow" />
                <button className="btn btn-coral mt-4 w-full" disabled={busy} onClick={() => review(rejecting, 'reject', note)}>Reject submission</button>
            </Modal>
        </div>
    );
}
