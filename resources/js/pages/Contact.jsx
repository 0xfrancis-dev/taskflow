import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { Field, Icon, Logo } from '../components/ui';

export default function Contact() {
    const { config, toast } = useApp();
    const email = config?.support_email || 'francis.audits@gmail.com';
    const [v, setV] = useState({ name: '', email: '', subject: '', message: '' });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [sent, setSent] = useState(false);
    const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setErrors({});
        try { await api('/contact', { method: 'POST', body: v }); setSent(true); }
        catch (err) { setErrors(err.errors || {}); toast(err.message, 'error'); }
        setBusy(false);
    };

    return (
        <div className="min-h-screen bg-paper">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6"><Logo /><Link to="/" className="btn btn-ghost btn-sm"><Icon name="arrow_back" size={18} />Back home</Link></div>
            <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-6 lg:grid-cols-[.8fr_1.2fr]">
                <div className="animate-rise">
                    <h1 className="text-5xl font-extrabold">Talk to a human.</h1>
                    <p className="mt-4 text-lg text-ink-500">Questions about campaigns, payouts or your account? Send us a message and we will reply within 24 hours.</p>
                    <a href={`mailto:${email}`} className="card mt-8 flex items-center gap-4 transition hover:-translate-y-1">
                        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet text-white"><Icon name="mail" size={28} /></span>
                        <span><span className="block text-sm font-semibold text-ink-500">Email support</span><span className="font-display text-lg font-bold">{email}</span></span>
                    </a>
                </div>
                <div className="card animate-rise !p-8 [animation-delay:.1s]">
                    {sent ? (
                        <div className="py-16 text-center"><span className="mx-auto mb-5 grid h-20 w-20 animate-pop place-items-center rounded-full bg-mint-100 text-mint"><Icon name="mark_email_read" size={40} /></span><h2 className="text-3xl font-extrabold">Message sent</h2><p className="mt-2 text-ink-500">Thanks for reaching out. We will reply to {v.email} soon.</p></div>
                    ) : (
                        <form onSubmit={submit} className="grid gap-5">
                            <div className="grid gap-5 sm:grid-cols-2">
                                <Field label="Your name" error={errors.name?.[0]}><input className="input" required value={v.name} onChange={set('name')} /></Field>
                                <Field label="Email" error={errors.email?.[0]}><input className="input" type="email" required value={v.email} onChange={set('email')} /></Field>
                            </div>
                            <Field label="Subject" error={errors.subject?.[0]}><input className="input" required value={v.subject} onChange={set('subject')} /></Field>
                            <Field label="Message" error={errors.message?.[0]}><textarea className="input min-h-36" required minLength={10} value={v.message} onChange={set('message')} /></Field>
                            <button className="btn btn-primary !py-3.5" disabled={busy}><Icon name="send" size={20} />{busy ? 'Sending...' : 'Send message'}</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
