import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PLATFORMS, naira } from '../lib/api';
import { useReveal } from '../lib/hooks';

export const Icon = ({ name, className = '', size }) => (
    <span className={`material-symbols-rounded ${className}`} style={size ? { fontSize: size } : undefined} aria-hidden="true">{name}</span>
);

export function Logo({ light = false, className = '' }) {
    return (
        <Link to="/" className={`inline-flex items-center gap-2.5 ${className}`} aria-label="TaskFlow home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet shadow-lg shadow-violet/40">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span className={`font-display text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>Task<span className="text-coral">Flow</span></span>
        </Link>
    );
}

export function Reveal({ children, delay = 0, className = '' }) {
    const ref = useReveal();
    return <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

/** Counts up to `to` when scrolled into view. */
export function Counter({ to, prefix = '', suffix = '', duration = 1600 }) {
    const [n, setN] = useState(0);
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        const io = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting) return;
            io.disconnect();
            const t0 = performance.now();
            const tick = (t) => {
                const p = Math.min(1, (t - t0) / duration);
                setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }, { threshold: 0.4 });
        io.observe(el);
        return () => io.disconnect();
    }, [to, duration]);
    return <span ref={ref}>{prefix}{n.toLocaleString()}{suffix}</span>;
}

/** Types and deletes through a list of phrases. */
export function Typewriter({ phrases, className = '' }) {
    const [i, setI] = useState(0);
    const [text, setText] = useState('');
    const [del, setDel] = useState(false);
    useEffect(() => {
        const full = phrases[i];
        let t;
        if (!del && text === full) t = setTimeout(() => setDel(true), 1700);
        else if (del && text === '') { setDel(false); setI((i + 1) % phrases.length); }
        else t = setTimeout(() => setText(full.slice(0, text.length + (del ? -1 : 1))), del ? 28 : 65);
        return () => clearTimeout(t);
    }, [text, del, i, phrases]);
    return <span className={className}>{text}<span className="animate-caret ml-0.5 inline-block w-[3px] translate-y-[3px] bg-coral" style={{ height: '0.9em' }} /></span>;
}

const STATUS = {
    pending: 'bg-sun-100 text-[#8a5b00]', processing: 'bg-violet-100 text-violet-600', approved: 'bg-mint-100 text-[#0b7a5c]', paid: 'bg-mint-100 text-[#0b7a5c]',
    active: 'bg-mint-100 text-[#0b7a5c]', completed: 'bg-violet-100 text-violet-600', paused: 'bg-sun-100 text-[#8a5b00]',
    rejected: 'bg-coral-100 text-[#b3321f]', closed: 'bg-ink-100 text-ink-500', suspended: 'bg-coral-100 text-[#b3321f]',
};
export const Status = ({ value }) => <span className={`badge capitalize ${STATUS[value] || 'bg-ink-100 text-ink-500'}`}>{value}</span>;

export function PlatformChip({ platform, large = false }) {
    const p = PLATFORMS[platform] || PLATFORMS.other;
    return (
        <span className={`inline-flex items-center gap-2 font-semibold ${large ? 'text-sm' : 'text-xs'}`}>
            <span className={`grid place-items-center rounded-xl text-white ${large ? 'h-10 w-10' : 'h-8 w-8'}`} style={{ background: p.color }}><Icon name={p.icon} size={large ? 22 : 18} /></span>
            {p.label}
        </span>
    );
}

export const Spinner = () => <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-100 border-t-violet" role="status" aria-label="Loading" />;

export const Skeletons = ({ n = 4, h = 'h-24' }) => (
    <div className="grid gap-4">{Array.from({ length: n }).map((_, i) => <div key={i} className={`skeleton ${h}`} />)}</div>
);

export function Empty({ icon = 'inbox', title, text, action }) {
    return (
        <div className="card flex flex-col items-center py-14 text-center">
            <span className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-violet-100 text-violet"><Icon name={icon} size={32} /></span>
            <h3 className="text-lg font-bold">{title}</h3>
            {text && <p className="mt-1 max-w-sm text-sm text-ink-500">{text}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

export function Pager({ data, onPage }) {
    if (!data || data.last_page <= 1) return null;
    return (
        <div className="mt-6 flex items-center justify-center gap-3">
            <button className="btn btn-ghost btn-sm" disabled={data.current_page <= 1} onClick={() => onPage(data.current_page - 1)}><Icon name="chevron_left" size={18} />Prev</button>
            <span className="text-sm font-medium text-ink-500">Page {data.current_page} of {data.last_page}</span>
            <button className="btn btn-ghost btn-sm" disabled={data.current_page >= data.last_page} onClick={() => onPage(data.current_page + 1)}>Next<Icon name="chevron_right" size={18} /></button>
        </div>
    );
}

export function Modal({ open, onClose, title, children }) {
    useEffect(() => {
        if (!open) return;
        const k = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', k);
        return () => window.removeEventListener('keydown', k);
    }, [open, onClose]);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-ink/60 p-4 backdrop-blur-sm" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label={title}>
            <div className="animate-pop w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-paper" aria-label="Close"><Icon name="close" /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

export function Field({ label, error, children }) {
    return <div><label className="label">{label}</label>{children}{error && <p className="err">{error}</p>}</div>;
}

export function Stat({ icon, label, value, tone = 'violet', sub }) {
    const tones = { violet: 'bg-violet-100 text-violet', mint: 'bg-mint-100 text-mint', coral: 'bg-coral-100 text-coral', sun: 'bg-sun-100 text-[#c98a00]' };
    return (
        <div className="card flex items-center gap-4">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tones[tone]}`}><Icon name={icon} size={26} /></span>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-500">{label}</p>
                <p className="truncate font-display text-2xl font-extrabold">{value}</p>
                {sub && <p className="text-xs text-ink-500">{sub}</p>}
            </div>
        </div>
    );
}

/** Dependency-free SVG area chart. series: [{label, value}] */
export function AreaChart({ series, color = '#6B4CFF', format = (v) => v, height = 160 }) {
    const w = 600, pad = 8;
    const max = Math.max(1, ...series.map((s) => s.value));
    const pts = series.map((s, i) => [pad + (i * (w - pad * 2)) / Math.max(1, series.length - 1), height - pad - (s.value / max) * (height - pad * 2 - 6)]);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const area = `${line} L${pts[pts.length - 1][0]},${height} L${pts[0][0]},${height} Z`;
    const id = 'g' + color.slice(1);
    const [hover, setHover] = useState(null);
    return (
        <div className="relative">
            <svg viewBox={`0 0 ${w} ${height}`} className="h-40 w-full overflow-visible" role="img" aria-label="Trend chart">
                <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".35" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
                <path d={area} fill={`url(#${id})`} />
                <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {pts.map((p, i) => (
                    <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                        <rect x={p[0] - 20} y="0" width="40" height={height} fill="transparent" />
                        {hover === i && <circle cx={p[0]} cy={p[1]} r="6" fill="#fff" stroke={color} strokeWidth="3" />}
                    </g>
                ))}
            </svg>
            {hover !== null && (
                <div className="pointer-events-none absolute -top-2 rounded-xl bg-ink px-3 py-1.5 text-xs font-semibold text-white" style={{ left: `${(pts[hover][0] / w) * 100}%`, transform: 'translateX(-50%)' }}>
                    {series[hover].label}: {format(series[hover].value)}
                </div>
            )}
        </div>
    );
}

export function TaskCard({ task, to }) {
    return (
        <Link to={to || `/app/tasks/${task.id}`} className="group card flex flex-col gap-4 transition hover:-translate-y-1 hover:shadow-[0_24px_40px_-20px_rgba(107,76,255,.45)]">
            <div className="flex items-start justify-between gap-3">
                <PlatformChip platform={task.platform} large />
                <span className="rounded-full bg-mint-100 px-3 py-1.5 font-display text-sm font-extrabold text-[#0b7a5c]">{naira(task.reward)}</span>
            </div>
            <div>
                <h3 className="text-lg font-bold leading-snug group-hover:text-violet">{task.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-ink-500">{task.description}</p>
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3 text-xs font-semibold text-ink-500">
                <span className="flex items-center gap-1"><Icon name="group" size={16} />{task.remaining} slots left</span>
                <span className="flex items-center gap-1 text-violet">Do task<Icon name="arrow_forward" size={16} className="transition group-hover:translate-x-1" /></span>
            </div>
        </Link>
    );
}
