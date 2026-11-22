import { useState } from 'react';
import { useFetch } from '../../lib/hooks';
import { dateFmt, naira } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { Empty, Icon, Skeletons, Stat } from '../../components/ui';

export default function Referrals() {
    const { data, loading } = useFetch('/referrals');
    const { toast } = useApp();
    const [copied, setCopied] = useState(false);
    if (loading || !data) return <Skeletons n={3} />;
    const link = `${window.location.origin}/register?ref=${data.code}`;
    const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); toast('Referral link copied'); setTimeout(() => setCopied(false), 2000); } catch { toast('Copy failed. Select the link and copy it.', 'error'); } };
    return (
        <div className="animate-rise grid gap-6">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet to-ink p-8 text-white">
                <div className="absolute -right-8 -top-8 h-52 w-52 animate-blob rounded-full bg-coral/50 blur-3xl" />
                <h1 className="relative text-4xl font-extrabold">Invite friends, earn {naira(data.bonus)} each</h1>
                <p className="relative mt-2 max-w-lg text-white/80">You get a bonus when someone you invite has their first task approved.</p>
                <div className="relative mt-6 flex flex-col gap-3 sm:flex-row"><input readOnly value={link} className="w-full rounded-full bg-white/10 px-5 py-3 text-sm outline-none ring-1 ring-white/20" onFocus={(e) => e.target.select()} /><button onClick={copy} className="btn btn-coral shrink-0"><Icon name={copied ? 'check' : 'content_copy'} size={20} />{copied ? 'Copied' : 'Copy link'}</button></div>
                <p className="relative mt-3 text-sm text-white/70">Your code: <b className="font-display text-lg tracking-widest">{data.code}</b></p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2"><Stat icon="group_add" label="People invited" value={data.people.length} tone="violet" /><Stat icon="savings" label="Referral earnings" value={naira(data.earned)} tone="mint" /></div>
            <div className="card"><h3 className="mb-3 text-lg font-bold">Your referrals</h3>{data.people.length === 0 ? <Empty icon="diversity_3" title="No referrals yet" text="Share your link to start earning." /> : <ul className="divide-y divide-ink-100">{data.people.map((p) => <li key={p.id} className="flex items-center justify-between py-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-violet-100 font-bold text-violet">{p.name[0]}</span><div><p className="font-semibold">{p.name}</p><p className="text-xs text-ink-500">Joined {dateFmt(p.created_at)}</p></div></div><span className={`badge ${p.referral_rewarded ? 'bg-mint-100 text-[#0b7a5c]' : 'bg-sun-100 text-[#8a5b00]'}`}>{p.referral_rewarded ? 'Bonus paid' : 'Waiting for first task'}</span></li>)}</ul>}</div>
        </div>
    );
}
