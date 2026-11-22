import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { Field, Icon, Logo } from '../components/ui';

function Shell({ title, subtitle, children, footer }) {
    return (
        <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
            <div className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
                <div className="absolute -left-20 top-1/3 h-80 w-80 animate-blob rounded-full bg-violet/50 blur-3xl" />
                <div className="absolute -right-10 bottom-0 h-72 w-72 animate-blob rounded-full bg-coral/40 blur-3xl [animation-delay:-8s]" />
                <Logo light className="relative" />
                <div className="relative">
                    <h2 className="text-5xl font-extrabold leading-tight">Every task you finish pays you back.</h2>
                    <div className="mt-8 grid gap-4">
                        {[['task_alt', 'Pick from hundreds of simple tasks'], ['account_balance_wallet', 'Rewards land in your wallet instantly'], ['redeem', 'Invite friends and earn a bonus']].map(([i, t]) => <div key={t} className="flex items-center gap-3 text-lg"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><Icon name={i} /></span>{t}</div>)}
                    </div>
                </div>
                <p className="relative text-sm text-ink-300">© {new Date().getFullYear()} TaskFlow</p>
            </div>
            <div className="flex items-center justify-center p-6 sm:p-12">
                <div className="animate-rise w-full max-w-md">
                    <Logo className="mb-8 lg:hidden" />
                    <h1 className="text-4xl font-extrabold">{title}</h1>
                    <p className="mb-8 mt-2 text-ink-500">{subtitle}</p>
                    {children}
                    <p className="mt-8 text-center text-sm text-ink-500">{footer}</p>
                </div>
            </div>
        </div>
    );
}

function useForm(initial, submit) {
    const [v, setV] = useState(initial);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');
    const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
    const onSubmit = async (e) => {
        e.preventDefault();
        setBusy(true); setErrors({}); setMsg('');
        try { await submit(v); } catch (err) { setErrors(err.errors || {}); setMsg(err.message); }
        setBusy(false);
    };
    return { v, set, errors, busy, msg, onSubmit };
}

export function Login() {
    const { login } = useApp();
    const nav = useNavigate();
    const loc = useLocation();
    const [show, setShow] = useState(false);
    const f = useForm({ email: '', password: '' }, async (v) => {
        const r = await api('/login', { method: 'POST', body: v });
        login(r.token, r.user);
        nav(r.user.role === 'admin' ? '/admin' : loc.state?.from || '/app', { replace: true });
    });
    return (
        <Shell title="Welcome back" subtitle="Log in to manage campaigns and rewards." footer={<>New to TaskFlow? <Link to="/register" className="font-bold text-violet">Create an account</Link></>}>
            <form onSubmit={f.onSubmit} className="grid gap-5">
                {f.msg && !f.errors.email && <p className="rounded-2xl bg-coral-100 px-4 py-3 text-sm font-medium text-[#b3321f]">{f.msg}</p>}
                <Field label="Email" error={f.errors.email?.[0]}><input className="input" type="email" autoComplete="email" required value={f.v.email} onChange={f.set('email')} placeholder="you@example.com" /></Field>
                <Field label="Password"><div className="relative"><input className="input pr-12" type={show ? 'text' : 'password'} autoComplete="current-password" required value={f.v.password} onChange={f.set('password')} /><button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500" aria-label="Show password"><Icon name={show ? 'visibility_off' : 'visibility'} /></button></div></Field>
                <button className="btn btn-primary !py-3.5" disabled={f.busy}>{f.busy ? 'Logging in...' : 'Log in'}</button>
            </form>
        </Shell>
    );
}

export function Register() {
    const { login } = useApp();
    const nav = useNavigate();
    const [sp] = useSearchParams();
    const f = useForm({ name: '', email: '', phone: '', password: '', password_confirmation: '', referral: sp.get('ref') || '' }, async (v) => {
        const r = await api('/register', { method: 'POST', body: v });
        login(r.token, r.user);
        nav('/app', { replace: true });
    });
    const e = (k) => f.errors[k]?.[0];
    return (
        <Shell title="Create your account" subtitle="Earn rewards or launch campaigns. It's free to join." footer={<>Already have an account? <Link to="/login" className="font-bold text-violet">Log in</Link></>}>
            <form onSubmit={f.onSubmit} className="grid gap-4">
                {f.msg && !Object.keys(f.errors).length && <p className="rounded-2xl bg-coral-100 px-4 py-3 text-sm font-medium text-[#b3321f]">{f.msg}</p>}
                <Field label="Full name" error={e('name')}><input className="input" required value={f.v.name} onChange={f.set('name')} autoComplete="name" /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Email" error={e('email')}><input className="input" type="email" required value={f.v.email} onChange={f.set('email')} autoComplete="email" /></Field>
                    <Field label="Phone (optional)" error={e('phone')}><input className="input" value={f.v.phone} onChange={f.set('phone')} autoComplete="tel" /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Password" error={e('password')}><input className="input" type="password" required minLength={8} value={f.v.password} onChange={f.set('password')} autoComplete="new-password" /></Field>
                    <Field label="Confirm password"><input className="input" type="password" required value={f.v.password_confirmation} onChange={f.set('password_confirmation')} autoComplete="new-password" /></Field>
                </div>
                <Field label="Referral code (optional)" error={e('referral')}><input className="input uppercase" value={f.v.referral} onChange={f.set('referral')} maxLength={12} /></Field>
                <button className="btn btn-primary !py-3.5" disabled={f.busy}>{f.busy ? 'Creating account...' : 'Create account'}</button>
            </form>
        </Shell>
    );
}
