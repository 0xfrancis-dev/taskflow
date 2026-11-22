import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, dateFmt, naira, timeFmt } from '../../lib/api';
import { useDebounced, useFetch } from '../../lib/hooks';
import { useApp } from '../../context/AppContext';
import { AreaChart, Empty, Field, Icon, Modal, Pager, PlatformChip, Skeletons, Stat, Status } from '../../components/ui';

const Title = ({ children, sub }) => <div className="mb-6"><h1 className="text-4xl font-extrabold">{children}</h1>{sub && <p className="text-ink-500">{sub}</p>}</div>;
const Table = ({ head, children }) => <div className="card scroll-slim overflow-x-auto !p-0"><table className="w-full min-w-[640px]"><thead className="border-b border-ink-100 bg-paper/60"><tr>{head.map((h) => <th key={h} className="th">{h}</th>)}</tr></thead><tbody className="divide-y divide-ink-100">{children}</tbody></table></div>;
const Tabs = ({ value, onChange, options }) => <div className="mb-5 flex flex-wrap gap-2">{options.map(([k, l]) => <button key={k} onClick={() => onChange(k)} className={`rounded-full px-4 py-2 text-sm font-semibold ${value === k ? 'bg-ink text-white' : 'bg-white text-ink-500'}`}>{l}</button>)}</div>;

export function Overview() {
    const { data: d, loading } = useFetch('/admin/stats');
    if (loading || !d) return <Skeletons n={3} h="h-32" />;
    return (
        <div className="animate-rise grid gap-6">
            <Title sub="Live snapshot of the whole platform.">Overview</Title>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat icon="group" label="Total users" value={d.users.toLocaleString()} sub={`+${d.new_users_today} today`} />
                <Stat icon="campaign" label="Active campaigns" value={d.active_campaigns} tone="mint" />
                <Stat icon="payments" label="Rewards paid" value={naira(d.rewards_paid)} tone="sun" />
                <Stat icon="savings" label="Platform revenue" value={naira(d.revenue)} tone="coral" sub="Fees from campaigns" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[['/admin/withdrawals', 'north_east', 'Pending withdrawals', d.pending_withdrawals, naira(d.pending_withdrawals_amount)], ['/admin/deposits', 'south_west', 'Pending deposits', d.pending_deposits], ['/admin/campaigns', 'pending_actions', 'Pending submissions', d.pending_submissions], ['/admin/messages', 'mail', 'Unread messages', d.unread_messages]].map(([to, ic, l, n, sub]) => (
                    <Link key={l} to={to} className={`card flex items-center gap-4 transition hover:-translate-y-1 ${n > 0 ? 'ring-2 ring-coral/40' : ''}`}><span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-ink text-white"><Icon name={ic} />{n > 0 && <span className="absolute -right-1 -top-1 h-3.5 w-3.5 animate-ring rounded-full bg-coral" />}</span><div><p className="text-xs font-semibold text-ink-500">{l}</p><p className="font-display text-2xl font-extrabold">{n}</p>{sub && <p className="text-xs text-ink-500">{sub}</p>}</div></Link>
                ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <div className="card"><h3 className="mb-4 text-lg font-bold">New users, last 14 days</h3><AreaChart series={d.series.map((s) => ({ label: new Date(s.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), value: s.users }))} format={(v) => `${v} users`} /></div>
                <div className="card"><h3 className="mb-3 text-lg font-bold">Newest members</h3><ul className="divide-y divide-ink-100">{d.recent_users.map((u) => <li key={u.id} className="flex items-center gap-3 py-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-violet-100 font-bold text-violet">{u.name[0]}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{u.name}</p><p className="truncate text-xs text-ink-500">{u.email}</p></div></li>)}</ul></div>
            </div>
            <p className="text-sm text-ink-500">Total user wallet balances (platform liability): <b>{naira(d.wallet_liability)}</b></p>
        </div>
    );
}

export function Users() {
    const [q, setQ] = useState(''); const [status, setStatus] = useState(''); const [page, setPage] = useState(1);
    const dq = useDebounced(q);
    const { data, loading, reload } = useFetch('/admin/users', { q: dq, status, page });
    const { toast, user: me } = useApp();
    const [adj, setAdj] = useState(null); const [v, setV] = useState({ amount: '', reason: '' }); const [err, setErr] = useState({});

    const patch = async (u, body) => { try { await api(`/admin/users/${u.id}`, { method: 'PATCH', body }); toast('User updated'); reload(); } catch (e) { toast(e.message, 'error'); } };
    const adjust = async (x) => { x.preventDefault(); setErr({}); try { await api(`/admin/users/${adj.id}/adjust`, { method: 'POST', body: v }); toast('Balance adjusted'); setAdj(null); setV({ amount: '', reason: '' }); reload(); } catch (e) { setErr(e.errors || {}); toast(e.message, 'error'); } };

    return (
        <div className="animate-rise">
            <Title sub="Search, suspend, promote and adjust wallets.">Users</Title>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" /><input className="input !pl-12" placeholder="Search name or email" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div><select className="input sm:w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select></div>
            {loading ? <Skeletons /> : data.data.length === 0 ? <Empty icon="group_off" title="No users found" /> : (
                <><Table head={['User', 'Balance', 'Activity', 'Status', 'Joined', '']}>{data.data.map((u) => (
                    <tr key={u.id}><td className="td"><p className="font-semibold">{u.name} {u.role === 'admin' && <span className="badge bg-ink text-white">admin</span>}</p><p className="text-xs text-ink-500">{u.email}</p></td><td className="td font-bold">{naira(u.balance)}</td><td className="td text-xs text-ink-500">{u.tasks_count} campaigns<br />{u.submissions_count} submissions</td><td className="td"><Status value={u.status} /></td><td className="td text-xs text-ink-500">{dateFmt(u.created_at)}</td>
                        <td className="td"><div className="flex justify-end gap-1.5"><button className="btn btn-ghost btn-sm" onClick={() => setAdj(u)} title="Adjust wallet"><Icon name="account_balance_wallet" size={16} /></button>{u.id !== me.id && <><button className="btn btn-ghost btn-sm" onClick={() => patch(u, { status: u.status === 'active' ? 'suspended' : 'active' })}>{u.status === 'active' ? 'Suspend' : 'Activate'}</button><button className="btn btn-ghost btn-sm" onClick={() => patch(u, { role: u.role === 'admin' ? 'user' : 'admin' })}>{u.role === 'admin' ? 'Remove admin' : 'Make admin'}</button></>}</div></td></tr>))}</Table><Pager data={data} onPage={setPage} /></>
            )}
            <Modal open={!!adj} onClose={() => setAdj(null)} title={`Adjust wallet: ${adj?.name}`}>
                <form onSubmit={adjust} className="grid gap-4"><p className="text-sm text-ink-500">Current balance {naira(adj?.balance)}. Use a negative number to deduct.</p><Field label="Amount (₦)" error={err.amount?.[0]}><input className="input" type="number" step="0.01" required value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value })} /></Field><Field label="Reason" error={err.reason?.[0]}><input className="input" required maxLength={150} value={v.reason} onChange={(e) => setV({ ...v, reason: e.target.value })} /></Field><button className="btn btn-primary">Apply adjustment</button></form>
            </Modal>
        </div>
    );
}

export function Campaigns() {
    const [q, setQ] = useState(''); const [status, setStatus] = useState(''); const [page, setPage] = useState(1);
    const dq = useDebounced(q);
    const { data, loading, reload } = useFetch('/admin/tasks', { q: dq, status, page });
    const { toast } = useApp();
    const set = async (t, s) => {
        if (s === 'closed' && !window.confirm('Close this campaign and refund the owner for unfilled slots?')) return;
        try { await api(`/admin/tasks/${t.id}`, { method: 'PATCH', body: { status: s } }); toast('Campaign updated'); reload(); } catch (e) { toast(e.message, 'error'); }
    };
    return (
        <div className="animate-rise">
            <Title sub="Moderate every campaign on the platform.">Campaigns</Title>
            <input className="input mb-4 sm:max-w-sm" placeholder="Search title" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
            <Tabs value={status} onChange={(s) => { setStatus(s); setPage(1); }} options={[['', 'All'], ['active', 'Active'], ['paused', 'Paused'], ['completed', 'Completed'], ['closed', 'Closed']]} />
            {loading ? <Skeletons /> : data.data.length === 0 ? <Empty icon="campaign" title="No campaigns" /> : (
                <><Table head={['Campaign', 'Owner', 'Reward', 'Progress', 'Status', '']}>{data.data.map((t) => (
                    <tr key={t.id}><td className="td"><PlatformChip platform={t.platform} /><p className="mt-1 max-w-[16rem] truncate font-semibold">{t.title}</p></td><td className="td">{t.user?.name}</td><td className="td font-bold">{naira(t.reward)}</td><td className="td text-xs text-ink-500">{t.approved_count}/{t.slots} done{t.pending_count > 0 && <><br />{t.pending_count} pending</>}</td><td className="td"><Status value={t.status} /></td>
                        <td className="td"><div className="flex justify-end gap-1.5">{['active', 'paused'].includes(t.status) && <button className="btn btn-ghost btn-sm" onClick={() => set(t, t.status === 'active' ? 'paused' : 'active')}>{t.status === 'active' ? 'Pause' : 'Resume'}</button>}{t.status !== 'closed' && <button className="btn btn-ghost btn-sm !text-coral" onClick={() => set(t, 'closed')}>Close</button>}<Link className="btn btn-ghost btn-sm" to={`/app/campaigns/${t.id}`}>Review</Link></div></td></tr>))}</Table><Pager data={data} onPage={setPage} /></>
            )}
        </div>
    );
}

function Queue({ title, sub, path, kind }) {
    const [status, setStatus] = useState('pending'); const [page, setPage] = useState(1);
    const { data, loading, reload } = useFetch(path, { status, page });
    const { toast } = useApp();
    const [row, setRow] = useState(null); const [act, setAct] = useState(null); const [note, setNote] = useState('');
    const isW = kind === 'withdrawal';
    const run = async () => {
        try { await api(`${path}/${row.id}`, { method: 'POST', body: { action: act, note } }); toast('Done'); setRow(null); setNote(''); reload(); } catch (e) { toast(e.message, 'error'); }
    };
    const pos = isW ? 'pay' : 'approve';
    return (
        <div className="animate-rise">
            <Title sub={sub}>{title}</Title>
            <Tabs value={status} onChange={(s) => { setStatus(s); setPage(1); }} options={[['pending', 'Pending'], [isW ? 'paid' : 'approved', isW ? 'Paid' : 'Approved'], ['rejected', 'Rejected'], ['', 'All']]} />
            {loading ? <Skeletons /> : data.data.length === 0 ? <Empty icon="task_alt" title="Nothing here" text="You are all caught up." /> : (
                <><Table head={isW ? ['User', 'Amount', 'Bank details', 'Status', 'Requested', ''] : ['User', 'Amount', 'Reference', 'Status', 'Submitted', '']}>{data.data.map((r) => (
                    <tr key={r.id}><td className="td"><p className="font-semibold">{r.user?.name}</p><p className="text-xs text-ink-500">{r.user?.email}</p></td><td className="td font-display text-lg font-extrabold">{naira(r.amount)}</td>
                        <td className="td text-sm">{isW ? <>{r.bank_name}<br /><b className="tracking-wider">{r.account_number}</b><br />{r.account_name}</> : <b>{r.reference}</b>}</td><td className="td"><Status value={r.status} />{r.note && <p className="mt-1 text-xs text-ink-500">{r.note}</p>}</td><td className="td text-xs text-ink-500">{timeFmt(r.created_at)}</td>
                        <td className="td">{r.status === 'pending' && <div className="flex justify-end gap-1.5"><button className="btn btn-primary btn-sm" onClick={() => { setRow(r); setAct(pos); }}>{isW ? 'Mark paid' : 'Approve'}</button><button className="btn btn-ghost btn-sm !text-coral" onClick={() => { setRow(r); setAct('reject'); }}>Reject</button></div>}</td></tr>))}</Table><Pager data={data} onPage={setPage} /></>
            )}
            <Modal open={!!row} onClose={() => setRow(null)} title={act === 'reject' ? 'Reject request' : isW ? 'Confirm payout' : 'Approve deposit'}>
                <p className="mb-3 text-sm text-ink-500">{act === 'reject' ? (isW ? 'The amount is returned to the user wallet.' : 'The deposit will be marked rejected.') : isW ? `Confirm you have transferred ${naira(row?.amount)} to the account.` : `${naira(row?.amount)} will be credited to ${row?.user?.name}.`}</p>
                <input className="input" placeholder="Note (optional)" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
                <button className={`btn mt-4 w-full ${act === 'reject' ? 'btn-coral' : 'btn-primary'}`} onClick={run}>Confirm</button>
            </Modal>
        </div>
    );
}
export const Withdrawals = () => <Queue kind="withdrawal" title="Withdrawals" sub="Pay users, then mark the request as paid." path="/admin/withdrawals" />;
export const Deposits = () => <Queue kind="deposit" title="Deposits" sub="Confirm bank transfers and credit wallets." path="/admin/deposits" />;

export function Messages() {
    const [page, setPage] = useState(1);
    const { data, loading, reload } = useFetch('/admin/messages', { page });
    const { toast } = useApp();
    const read = async (m) => { if (!m.is_read) { await api(`/admin/messages/${m.id}`, { method: 'PATCH' }).catch(() => {}); reload(); } };
    const del = async (m) => { if (!window.confirm('Delete this message?')) return; try { await api(`/admin/messages/${m.id}`, { method: 'DELETE' }); toast('Deleted'); reload(); } catch (e) { toast(e.message, 'error'); } };
    return (
        <div className="animate-rise">
            <Title sub="Messages sent from the contact form.">Messages</Title>
            {loading ? <Skeletons /> : data.data.length === 0 ? <Empty icon="mail" title="No messages yet" /> : (
                <><div className="grid gap-4">{data.data.map((m) => (
                    <div key={m.id} className={`card ${!m.is_read ? 'ring-2 ring-violet/30' : ''}`} onClick={() => read(m)}>
                        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold">{m.subject} {!m.is_read && <span className="badge bg-violet text-white">New</span>}</p><p className="text-sm text-ink-500">{m.name} · <a className="text-violet underline" href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}>{m.email}</a> · {timeFmt(m.created_at)}</p></div><button className="btn btn-ghost btn-sm !text-coral" onClick={(e) => { e.stopPropagation(); del(m); }}><Icon name="delete" size={18} /></button></div>
                        <p className="mt-3 whitespace-pre-line text-sm text-ink-700">{m.message}</p></div>))}</div><Pager data={data} onPage={setPage} /></>
            )}
        </div>
    );
}
