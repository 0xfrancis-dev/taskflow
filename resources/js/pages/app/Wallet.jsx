import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
    const [sp, setSp] = useSearchParams();
    const [banks, setBanks] = useState([]);
    const [acctName, setAcctName] = useState('');
    const [resolving, setResolving] = useState(false);

    // Withdrawal form: load the bank list once the modal opens.
    useEffect(() => {
        if (modal !== 'withdraw' || !config?.payouts_enabled || banks.length) return;
        api('/banks').then(setBanks).catch(() => toast('Could not load banks. Close and try again.', 'error'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modal]);

    // Verify the account name as soon as bank + 10-digit number are filled.
    useEffect(() => {
        setAcctName('');
        if (modal !== 'withdraw' || !config?.payouts_enabled) return;
        if (!v.bank_code || !/^\d{10}$/.test(v.account_number || '')) return;
        setResolving(true);
        api('/wallet/resolve-account', { method: 'POST', body: { bank_code: v.bank_code, account_number: v.account_number } })
            .then((r) => setAcctName(r.account_name))
            .catch((x) => setErrors({ account_number: [x.message] }))
            .finally(() => setResolving(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [v.bank_code, v.account_number, modal]);

    // Returning from Monnify checkout: confirm the payment and credit the wallet.
    useEffect(() => {
        const ref = sp.get('paymentReference');
        if (!ref) return;
        setSp({}, { replace: true });
        api('/wallet/monnify/verify', { method: 'POST', body: { reference: ref } })
            .then((r) => {
                if (r.status === 'approved') toast('Payment received. Your wallet has been funded!');
                else if (r.status === 'pending') toast('Payment is still processing. It will be credited automatically.');
                else toast('The payment was not completed.', 'error');
                reload(); refreshUser();
            })
            .catch((x) => toast(x.message, 'error'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const payOnline = async (e) => {
        e.preventDefault(); setBusy(true); setErrors({});
        try {
            const r = await api('/wallet/monnify/initialize', { method: 'POST', body: { amount: v.amount } });
            window.location.href = r.checkout_url;
        } catch (x) { setErrors(x.errors || {}); toast(x.message, 'error'); setBusy(false); }
    };

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
                {config?.online_payments && (
                    <form onSubmit={payOnline} className="grid gap-4">
                        <Field label={`Amount (min ${naira(config?.min_deposit)})`} error={e('amount')}><input className="input" type="number" required min={config?.min_deposit} onChange={set('amount')} /></Field>
                        <button className="btn btn-primary" disabled={busy}><Icon name="lock" size={20} />{busy ? 'Redirecting...' : 'Pay securely online'}</button>
                        <p className="text-xs text-ink-500">Pay by card or bank transfer. Your wallet is credited automatically.</p>
                    </form>
                )}
                {config?.manual_funding && (
                    <>
                        {config?.online_payments && <div className="my-5 flex items-center gap-3 text-xs font-semibold text-ink-300"><span className="h-px flex-1 bg-ink-100" />OR PAY MANUALLY<span className="h-px flex-1 bg-ink-100" /></div>}
                        <div className="mb-4 rounded-2xl bg-paper p-4 text-sm"><p className="font-semibold">1. Transfer to this account</p><p className="mt-1 text-ink-700">{p?.bank_name}<br /><span className="font-display text-xl font-extrabold">{p?.account_number}</span><br />{p?.account_name}</p><p className="mt-3 font-semibold">2. Submit the payment reference below</p><p className="text-ink-500">We confirm it and credit your wallet, usually within a few hours.</p></div>
                        <form onSubmit={submit} className="grid gap-4"><Field label="Amount" error={e('amount')}><input className="input" type="number" required min={config?.min_deposit} onChange={set('amount')} /></Field><Field label="Payment reference / sender name" error={e('reference')}><input className="input" required onChange={set('reference')} /></Field><button className="btn btn-ghost" disabled={busy}>Submit manual payment</button></form>
                    </>
                )}
                {!config?.online_payments && !config?.manual_funding && <p className="rounded-2xl bg-sun-100 p-4 text-sm font-medium text-[#8a5b00]">Online payment is not available right now. Please contact support.</p>}
            </Modal>
            <Modal open={modal === 'withdraw'} onClose={() => setModal(null)} title="Withdraw to bank">
                {config?.payouts_enabled ? (
                    <form onSubmit={submit} className="grid gap-4">
                        <Field label={`Amount (min ${naira(config?.min_withdrawal)})`} error={e('amount')}><input className="input" type="number" required min={config?.min_withdrawal} onChange={set('amount')} /></Field>
                        <Field label="Bank"><select className="input" required value={v.bank_code || ''} onChange={set('bank_code')}><option value="">{banks.length ? 'Select your bank' : 'Loading banks...'}</option>{banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}</select></Field>
                        <Field label="Account number" error={e('account_number')}><input className="input" required maxLength={10} inputMode="numeric" onChange={set('account_number')} /></Field>
                        {(resolving || acctName) && <div className="flex items-center gap-2 rounded-2xl bg-mint-100 px-4 py-3 text-sm font-semibold text-[#0b7a5c]"><Icon name={resolving ? 'progress_activity' : 'verified'} size={20} className={resolving ? 'animate-spin' : ''} />{resolving ? 'Verifying account...' : acctName}</div>}
                        <p className="text-xs text-ink-500">Daily limit {naira(config?.withdrawal_daily_limit)}. Payouts are sent to your bank after approval.</p>
                        <button className="btn btn-primary" disabled={busy || !acctName}>Request withdrawal</button>
                    </form>
                ) : (
                    <form onSubmit={submit} className="grid gap-4"><Field label={`Amount (min ${naira(config?.min_withdrawal)})`} error={e('amount')}><input className="input" type="number" required min={config?.min_withdrawal} onChange={set('amount')} /></Field><Field label="Bank name" error={e('bank_name')}><input className="input" required onChange={set('bank_name')} /></Field><Field label="Account number" error={e('account_number')}><input className="input" required maxLength={10} inputMode="numeric" onChange={set('account_number')} /></Field><Field label="Account name" error={e('account_name')}><input className="input" required onChange={set('account_name')} /></Field><button className="btn btn-primary" disabled={busy}>Request withdrawal</button></form>
                )}
            </Modal>
        </div>
    );
}
