import { useState } from 'react';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { Field } from '../../components/ui';

export default function Profile() {
    const { user, refreshUser, toast } = useApp();
    const [v, setV] = useState({ name: user.name, phone: user.phone || '', current_password: '', password: '', password_confirmation: '' });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
    const e = (k) => errors[k]?.[0];
    const save = async (x) => {
        x.preventDefault(); setBusy(true); setErrors({});
        try { await api('/profile', { method: 'POST', body: v }); await refreshUser(); toast('Profile updated'); setV({ ...v, current_password: '', password: '', password_confirmation: '' }); }
        catch (err) { setErrors(err.errors || {}); toast(err.message, 'error'); }
        setBusy(false);
    };
    return (
        <form onSubmit={save} className="animate-rise mx-auto grid max-w-2xl gap-6">
            <h1 className="text-4xl font-extrabold">Profile</h1>
            <div className="card grid gap-5 !p-8">
                <Field label="Email"><input className="input bg-paper" value={user.email} disabled /></Field>
                <Field label="Full name" error={e('name')}><input className="input" required value={v.name} onChange={set('name')} /></Field>
                <Field label="Phone" error={e('phone')}><input className="input" value={v.phone} onChange={set('phone')} /></Field>
            </div>
            <div className="card grid gap-5 !p-8"><h3 className="text-lg font-bold">Change password</h3>
                <Field label="Current password" error={e('current_password')}><input className="input" type="password" value={v.current_password} onChange={set('current_password')} autoComplete="current-password" /></Field>
                <div className="grid gap-5 sm:grid-cols-2"><Field label="New password" error={e('password')}><input className="input" type="password" minLength={8} value={v.password} onChange={set('password')} autoComplete="new-password" /></Field><Field label="Confirm new password"><input className="input" type="password" value={v.password_confirmation} onChange={set('password_confirmation')} autoComplete="new-password" /></Field></div>
            </div>
            <button className="btn btn-primary justify-self-start" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button>
        </form>
    );
}
