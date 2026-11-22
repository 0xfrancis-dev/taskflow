import { useState } from 'react';
import { api, naira, timeFmt } from '../../lib/api';
import { useFetch } from '../../lib/hooks';
import { useApp } from '../../context/AppContext';
import { Empty, Field, Icon, Modal, Pager, Skeletons, Status } from '../../components/ui';

export default function Wallet() {
    const [type, setType] = useState('');
    const [page, setPage] = useState(1);
    const { data, loading, reload } = useFetch('/wallet', { type, page });
    const { config, toast, refreshUser } = useApp();
    const [modal, setModal] = useState(null);
    const [v, setV] = useState({});
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
    const open = (m) => { setModal(m); setV({}); setErrors({}); };

    const submit = async (e) => {
        e.preventDefault(); setBusy(true); setErrors({});
        try {
            await api(modal === 'deposit' ? '/wallet/deposit' : '/wallet/withdraw', { method: 'POST', body: v });
            toast(modal === 'deposit' ? 'Payment submitted. We will credit your wallet once confirmed.' : 'Withdrawal requested.');
            setModal(null); reload(); refreshUser();
        } catch (x) { setErrors(x.errors || {}); toast(x.message, 'error'); }
        setBusy(false);
    };
    const e = (k) => errors[k]?.[0];
    const p = config?.payment;

    return (
        <div className="animate-rise grid gap-6">
            <div className="relative overflow-hidden rounded-[2rem] bg-ink p-8 text-white">
                <div className="absolute -right-12 -top-12 h-60 w-60 animate-blob rounded-full bg-mint/40 blur-3xl" />
                <p className="relative text-sm font-semibold text-ink-300">Available balance</p>
                <p className="relative font-display text-6xl font-extrabold">{naira(data?.balance)}</p>
                <div className="relative mt-6 flex flex-wrap gap-3"><button className="btn btn-coral" onClick={() => open('deposit')}><Icon name="add_card" size={20} />Fund wallet</button><button className="btn bg-white/10 text-white hover:bg-white/20" onClick={() => open('withdraw')}><Icon name="north_east" size={20} />Withdraw</button></div>
            </div>

            {data && (data.deposits.length > 0 || data.withdrawals.length > 0) && (
                <div className="grid gap-4 md:grid-cols-2">
                    {[['Funding requests', data.deposits, (d) => d.reference], ['Withdrawals', data.withdrawals, (w) => w.bank_name + ' ••' + w.account_number.slice(-4)]].map(([t, rows, label]) => rows.length > 0 && (
                        <div key={t} className="card"><h3 className="mb-3 font-bold">{t}</h3><ul className="divide-y divide-ink-100">{rows.map((r) => <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm"><div><p className="font-semibold">{naira(r.amount)}</p><p className="text-xs text-ink-500">{label(r)} · {timeFmt(r.created_at)}</p></div><Status value={r.status} /></li>)}</ul></div>
                    ))}
                </div>
            )}

            <div className="card">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-bold">Transactions</h3>
                    <select className="input !w-auto !py-2" value={type} onChange={(x) => { setType(x.target.value); setPage(1); }}><option value="">All types</option>{['deposit', 'withdrawal', 'campaign', 'refund', 'reward', 'referral', 'adjustment'].map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}</select></div>
                {loading || !data ? <Skeletons n={4} h="h-14" /> : data.transactions.data.length === 0 ? <Empty icon="receipt_long" title="No transactions" /> : (
                    <><ul className="divide-y divide-ink-100">{data.transactions.data.map((t) => (
                        <li key={t.id} className="flex items-center justify-between gap-3 py-3.5"><div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${t.amount > 0 ? 'bg-mint-100 text-mint' : 'bg-coral-100 text-coral'}`}><Icon name={t.amount > 0 ? 'south_west' : 'north_east'} size={20} /></span><div><p className="text-sm font-semibold">{t.description}</p><p className="text-xs capitalize text-ink-500">{t.type} · {timeFmt(t.created_at)}</p></div></div><div className="text-right"><p className={`font-bold ${t.amount > 0 ? 'text-mint' : 'text-coral'}`}>{t.amount > 0 ? '+' : ''}{naira(t.amount)}</p><p className="text-xs text-ink-500">Bal {naira(t.balance_after)}</p></div></li>))}</ul>
                        <Pager data={data.transactions} onPage={setPage} /></>
                )}
            </div>

            <Modal open={modal === 'deposit'} onClose={() => setModal(null)} title="Fund your wallet">
                <div className="mb-4 rounded-2xl bg-paper p-4 text-sm"><p className="font-semibold">1. Transfer to this account</p><p className="mt-1 text-ink-700">{p?.bank_name}<br /><span className="font-display text-xl font-extrabold">{p?.account_number}</span><br />{p?.account_name}</p><p className="mt-3 font-semibold">2. Submit the payment reference below</p><p className="text-ink-500">We confirm it and credit your wallet, usually within a few hours.</p></div>
                <form onSubmit={submit} className="grid gap-4"><Field label={`Amount (min ${naira(config?.min_deposit)})`} error={e('amount')}><input className="input" type="number" required min={config?.min_deposit} onChange={set('amount')} /></Field><Field label="Payment reference / sender name" error={e('reference')}><input className="input" required onChange={set('reference')} /></Field><button className="btn btn-primary" disabled={busy}>Submit payment</button></form>
            </Modal>
            <Modal open={modal === 'withdraw'} onClose={() => setModal(null)} title="Withdraw to bank">
                <form onSubmit={submit} className="grid gap-4"><Field label={`Amount (min ${naira(config?.min_withdrawal)})`} error={e('amount')}><input className="input" type="number" required min={config?.min_withdrawal} onChange={set('amount')} /></Field><Field label="Bank name" error={e('bank_name')}><input className="input" required onChange={set('bank_name')} /></Field><Field label="Account number" error={e('account_number')}><input className="input" required maxLength={10} inputMode="numeric" onChange={set('account_number')} /></Field><Field label="Account name" error={e('account_name')}><input className="input" required onChange={set('account_name')} /></Field><button className="btn btn-primary" disabled={busy}>Request withdrawal</button></form>
            </Modal>
        </div>
    );
}
