import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, naira, PLATFORMS } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { Field, Icon } from '../../components/ui';

export default function CreateCampaign() {
    const { config, user, toast, refreshUser } = useApp();
    const nav = useNavigate();
    const [v, setV] = useState({ title: '', description: '', platform: 'instagram', link: '', reward: 50, slots: 50 });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

    const cost = (Number(v.reward) || 0) * (Number(v.slots) || 0);
    const fee = (cost * (config?.fee_percent || 0)) / 100;
    const total = cost + fee;
    const short = total > Number(user.balance);

    const submit = async (e) => {
        e.preventDefault(); setBusy(true); setErrors({});
        try { const t = await api('/tasks', { method: 'POST', body: v }); await refreshUser(); toast('Campaign launched!'); nav(`/app/campaigns/${t.id}`); }
        catch (x) { setErrors(x.errors || {}); toast(x.message, 'error'); }
        setBusy(false);
    };
    const e = (k) => errors[k]?.[0];

    return (
        <form onSubmit={submit} className="animate-rise grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="card grid gap-5 !p-8">
                <div><h1 className="text-3xl font-extrabold">Create a campaign</h1><p className="text-ink-500">Tell people exactly what to do and what proof you need.</p></div>
                <Field label="Task title" error={e('title')}><input className="input" required maxLength={120} value={v.title} onChange={set('title')} placeholder="Follow our page and like 3 posts" /></Field>
                <div>
                    <label className="label">Platform</label>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{Object.entries(PLATFORMS).filter(([k]) => !config || config.platforms.includes(k)).map(([k, p]) => (
                        <button type="button" key={k} onClick={() => setV({ ...v, platform: k })} className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-xs font-semibold transition ${v.platform === k ? 'border-violet bg-violet-100 text-violet' : 'border-ink-100 hover:border-violet/40'}`}><Icon name={p.icon} size={24} />{p.label.split(' ')[0]}</button>
                    ))}</div>
                </div>
                <Field label="Task link" error={e('link')}><input className="input" type="url" required value={v.link} onChange={set('link')} placeholder="https://instagram.com/yourpage" /></Field>
                <Field label="Instructions" error={e('description')}><textarea className="input min-h-32" required minLength={20} maxLength={2000} value={v.description} onChange={set('description')} placeholder="Step by step. Say what proof to submit (screenshot, username, link)." /></Field>
                <div className="grid gap-5 sm:grid-cols-2">
                    <Field label={`Reward per task (min ${naira(config?.min_reward)})`} error={e('reward')}><input className="input" type="number" min={config?.min_reward || 1} step="1" required value={v.reward} onChange={set('reward')} /></Field>
                    <Field label="Number of people" error={e('slots')}><input className="input" type="number" min="1" max="10000" required value={v.slots} onChange={set('slots')} /></Field>
                </div>
            </div>
            <div className="lg:sticky lg:top-24 lg:self-start">
                <div className="card grid gap-3 bg-ink !p-7 text-white">
                    <h3 className="text-lg font-bold">Cost summary</h3>
                    <div className="flex justify-between text-sm text-ink-300"><span>{v.slots || 0} × {naira(v.reward)}</span><span>{naira(cost)}</span></div>
                    <div className="flex justify-between text-sm text-ink-300"><span>Platform fee ({config?.fee_percent}%)</span><span>{naira(fee)}</span></div>
                    <div className="flex justify-between border-t border-white/10 pt-3 font-display text-2xl font-extrabold"><span>Total</span><span className="text-mint">{naira(total)}</span></div>
                    <p className="text-xs text-ink-300">Wallet balance: {naira(user.balance)}. Unused slots are refunded if you close the campaign.</p>
                    {short ? <Link to="/app/wallet" className="btn btn-coral mt-2"><Icon name="add_card" size={20} />Fund wallet first</Link> : <button className="btn btn-primary mt-2" disabled={busy}><Icon name="rocket_launch" size={20} />{busy ? 'Launching...' : 'Launch campaign'}</button>}
                </div>
            </div>
        </form>
    );
}
