import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, naira } from '../lib/api';
import { useApp } from '../context/AppContext';
import { Counter, Icon, Logo, PlatformChip, Reveal, Typewriter } from '../components/ui';

const FEED = [
    ['Tobi A.', 'Follow @stylehub on Instagram', 'instagram', 50], ['Ngozi E.', 'Watch & like product video', 'youtube', 80],
    ['Musa I.', 'Join Telegram community', 'telegram', 40], ['Zainab K.', 'Share TikTok challenge', 'tiktok', 120],
    ['Emeka O.', 'Retweet launch post', 'x', 60], ['Halima S.', 'Like Facebook page', 'facebook', 45],
    ['David U.', 'Sign up on landing page', 'website', 150], ['Blessing N.', 'Comment on giveaway', 'instagram', 70],
];

function LiveFeed() {
    const [items, setItems] = useState(() => [0, 1, 2, 3].map((i) => ({ ...mk(i), id: i })));
    const [paid, setPaid] = useState(184500);
    function mk(i) { const [name, task, platform, reward] = FEED[i % FEED.length]; return { name, task, platform, reward }; }
    useEffect(() => {
        let n = 4;
        const t = setInterval(() => {
            const it = { ...mk(n), id: n };
            n++;
            setItems((l) => [it, ...l].slice(0, 4));
            setPaid((p) => p + it.reward);
        }, 2400);
        return () => clearInterval(t);
    }, []);
    return (
        <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-violet/25 via-coral/20 to-sun/30 blur-2xl" />
            <div className="rounded-[2rem] bg-ink p-5 text-white shadow-2xl shadow-ink/40">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold"><span className="h-2.5 w-2.5 animate-ring rounded-full bg-mint" />Live approvals</div>
                    <div className="text-right"><p className="text-[11px] text-ink-300">Paid out today</p><p className="font-display text-xl font-extrabold text-mint">{naira(paid)}</p></div>
                </div>
                <div className="flex flex-col gap-2.5">
                    {items.map((it) => (
                        <div key={it.id} className="animate-feedIn flex items-center gap-3 rounded-2xl bg-white/[.07] p-3">
                            <PlatformChip platform={it.platform} />
                            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{it.task}</p><p className="text-xs text-ink-300">{it.name} · approved</p></div>
                            <span className="rounded-full bg-mint/20 px-2.5 py-1 text-xs font-bold text-mint">+{naira(it.reward)}</span>
                        </div>
                    ))}
                </div>
            </div>
            {[['favorite', 'top-[-22px] right-[-14px] bg-coral', '0deg', '0s'], ['thumb_up', 'bottom-24 left-[-26px] bg-violet', '-8deg', '1.2s'], ['person_add', 'bottom-[-18px] right-10 bg-sun text-ink', '6deg', '2.2s']].map(([ic, pos, r, d], i) => (
                <span key={i} className={`absolute ${pos} grid h-12 w-12 animate-float place-items-center rounded-2xl text-white shadow-xl`} style={{ '--r': r, animationDelay: d }}><Icon name={ic} size={26} /></span>
            ))}
        </div>
    );
}

const FAQ = [
    ['How do campaigns work?', 'Advertisers fund a campaign with a reward per task and a number of slots. Users complete the task, submit proof, and the advertiser approves it.'],
    ['How do users earn rewards?', 'Pick a task in the marketplace, follow the instructions, and submit proof. When the advertiser approves it, the reward lands in your wallet instantly.'],
    ['How are rewards paid out?', 'Request a withdrawal to your Nigerian bank account from your wallet. Requests are reviewed and paid by our team.'],
    ['Can I create my own campaigns?', 'Yes. Every account can both earn and advertise. Fund your wallet, create a campaign in two minutes, and pause or close it any time. Unused slots are refunded.'],
    ['How are submissions verified?', 'Advertisers review every submission and approve or reject it with a reason. Our admin team steps in on any dispute.'],
];

function Faq() {
    const [open, setOpen] = useState(0);
    return (
        <div className="mx-auto max-w-3xl divide-y divide-ink-100 rounded-3xl bg-white p-2 shadow-sm">
            {FAQ.map(([q, a], i) => (
                <div key={q}>
                    <button className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left font-display text-lg font-bold" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                        {q}<Icon name="add" className={`shrink-0 text-violet transition-transform duration-300 ${open === i ? 'rotate-45' : ''}`} />
                    </button>
                    <div className={`grid transition-all duration-300 ${open === i ? 'grid-rows-[1fr] pb-5' : 'grid-rows-[0fr]'}`}><p className="overflow-hidden px-5 text-ink-500">{a}</p></div>
                </div>
            ))}
        </div>
    );
}

function MockDashboard() {
    const bars = [30, 52, 40, 68, 55, 82, 74, 96, 70, 88, 100, 78];
    return (
        <div className="rounded-[2rem] bg-white p-4 shadow-2xl shadow-violet/20 ring-1 ring-ink-100 sm:p-6">
            <div className="mb-4 flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-coral" /><span className="h-3 w-3 rounded-full bg-sun" /><span className="h-3 w-3 rounded-full bg-mint" /></div>
            <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                <div className="hidden flex-col gap-2 md:flex">{['dashboard', 'storefront', 'campaign', 'account_balance_wallet', 'redeem'].map((i, k) => <div key={i} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${k === 0 ? 'bg-violet text-white' : 'text-ink-500'}`}><Icon name={i} size={20} />{['Dashboard', 'Marketplace', 'Campaigns', 'Wallet', 'Referrals'][k]}</div>)}</div>
                <div>
                    <div className="grid grid-cols-3 gap-3">{[['Balance', '₦48,250', 'bg-violet-100'], ['Earned', '₦126,800', 'bg-mint-100'], ['Active', '6 campaigns', 'bg-sun-100']].map(([l, v, c]) => <div key={l} className={`rounded-2xl p-3 ${c}`}><p className="text-[11px] font-semibold text-ink-500">{l}</p><p className="font-display text-base font-extrabold sm:text-xl">{v}</p></div>)}</div>
                    <div className="mt-4 flex h-40 items-end gap-2 rounded-2xl bg-paper p-4">{bars.map((h, i) => <div key={i} className="flex-1 rounded-t-lg bg-gradient-to-t from-violet to-coral" style={{ height: `${h}%` }} />)}</div>
                </div>
            </div>
        </div>
    );
}

export default function Landing() {
    const { user, config } = useApp();
    const [stats, setStats] = useState(null);
    const [menu, setMenu] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => { api('/public/stats').then(setStats).catch(() => {}); }, []);
    useEffect(() => { const f = () => setScrolled(window.scrollY > 12); f(); window.addEventListener('scroll', f); return () => window.removeEventListener('scroll', f); }, []);
    const links = [['How it works', '#how'], ['Features', '#features'], ['FAQ', '#faq']];
    const email = config?.support_email || 'francis.audits@gmail.com';

    return (
        <div className="overflow-x-hidden">
            <header className={`fixed inset-x-0 top-0 z-50 transition duration-300 ${scrolled ? 'bg-white/80 shadow-sm backdrop-blur-xl' : ''}`}>
                <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
                    <Logo />
                    <div className="hidden items-center gap-8 text-sm font-semibold text-ink-700 md:flex">
                        {links.map(([l, h]) => <a key={l} href={h} className="hover:text-violet">{l}</a>)}
                        <Link to="/contact" className="hover:text-violet">Contact us</Link>
                    </div>
                    <div className="hidden items-center gap-3 md:flex">
                        {user ? <Link to={user.role === 'admin' ? '/admin' : '/app'} className="btn btn-primary btn-sm">Open dashboard</Link> : <><Link to="/login" className="btn btn-ghost btn-sm">Log in</Link><Link to="/register" className="btn btn-primary btn-sm">Sign up free</Link></>}
                    </div>
                    <button className="grid h-10 w-10 place-items-center rounded-full bg-white shadow md:hidden" onClick={() => setMenu(!menu)} aria-label="Menu"><Icon name={menu ? 'close' : 'menu'} /></button>
                </nav>
                {menu && (
                    <div className="animate-pop mx-4 mb-4 flex flex-col gap-1 rounded-3xl bg-white p-4 shadow-xl md:hidden">
                        {links.map(([l, h]) => <a key={l} href={h} onClick={() => setMenu(false)} className="rounded-xl px-3 py-3 font-semibold hover:bg-paper">{l}</a>)}
                        <Link to="/contact" className="rounded-xl px-3 py-3 font-semibold hover:bg-paper">Contact us</Link>
                        <Link to={user ? '/app' : '/register'} className="btn btn-primary mt-2">{user ? 'Open dashboard' : 'Sign up free'}</Link>
                    </div>
                )}
            </header>

            {/* HERO */}
            <section className="relative isolate pt-32 sm:pt-40">
                <div className="dots absolute inset-0 -z-10" />
                <div className="absolute -left-24 top-10 -z-10 h-80 w-80 animate-blob rounded-full bg-violet/25 blur-3xl" />
                <div className="absolute right-0 top-40 -z-10 h-96 w-96 animate-blob rounded-full bg-coral/20 blur-3xl [animation-delay:-6s]" />
                <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 lg:grid-cols-[1.1fr_.9fr]">
                    <div>
                        <p className="animate-rise mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm"><span className="h-2 w-2 animate-ring rounded-full bg-mint" />Real people. Real tasks. Real payouts.</p>
                        <h1 className="animate-rise text-5xl font-extrabold leading-[1.02] sm:text-7xl [animation-delay:.1s]">
                            Get tasks done by <span className="grad-text">real people</span>, or get paid doing them.
                        </h1>
                        <p className="animate-rise mt-6 h-8 font-display text-xl font-bold text-violet sm:text-2xl [animation-delay:.2s]">
                            <Typewriter phrases={['Launch a campaign in minutes.', 'Earn from your phone every day.', 'Cash out to your bank account.', 'Grow your page with real engagement.']} />
                        </p>
                        <p className="animate-rise mt-5 max-w-xl text-lg text-ink-500 [animation-delay:.3s]">TaskFlow helps advertisers boost engagement through users who complete simple online tasks, with a wallet, referrals and verified approvals built in.</p>
                        <div className="animate-rise mt-9 flex flex-wrap gap-4 [animation-delay:.4s]">
                            <Link to="/register" className="btn btn-primary !px-8 !py-4 text-base"><Icon name="rocket_launch" />Start a campaign</Link>
                            <Link to="/register" className="btn btn-ghost !px-8 !py-4 text-base"><Icon name="payments" />Start earning</Link>
                        </div>
                    </div>
                    <LiveFeed />
                </div>
            </section>

            {/* PLATFORM MARQUEE */}
            <div className="border-y border-ink-100 bg-white py-5">
                <div className="flex w-max animate-marquee gap-10">
                    {[...Array(2)].flatMap((_, k) => ['instagram', 'tiktok', 'youtube', 'x', 'facebook', 'telegram', 'whatsapp', 'website'].map((p) => <PlatformChip key={p + k} platform={p} large />))}
                </div>
            </div>

            {/* STATS */}
            <section className="bg-ink py-20 text-white">
                <div className="mx-auto grid max-w-7xl gap-10 px-5 text-center sm:grid-cols-2 lg:grid-cols-4">
                    {[['Tasks completed', stats?.tasks_completed, ''], ['Rewards distributed', stats?.rewards_distributed, '₦'], ['Platform users', stats?.users, ''], ['Campaigns launched', stats?.campaigns, '']].map(([l, v, p], i) => (
                        <Reveal key={l} delay={i * 90}><p className="font-display text-5xl font-extrabold text-mint sm:text-6xl"><Counter to={Math.round(v || 0)} prefix={p} /></p><p className="mt-2 font-semibold text-ink-300">{l}</p></Reveal>
                    ))}
                </div>
            </section>

            {/* HOW */}
            <section id="how" className="mx-auto max-w-7xl px-5 py-24">
                <Reveal className="mx-auto max-w-2xl text-center"><h2 className="text-4xl font-extrabold sm:text-5xl">How TaskFlow works</h2><p className="mt-4 text-lg text-ink-500">Launch campaigns, complete tasks and manage rewards from one simple platform.</p></Reveal>
                <div className="relative mt-16 grid gap-8 md:grid-cols-3">
                    <div className="absolute left-[16%] right-[16%] top-10 hidden border-t-2 border-dashed border-violet/30 md:block" />
                    {[['person_add', 'Create an account', 'Sign up free and get tools for earning rewards or running campaigns.', 'bg-violet'], ['task_alt', 'Launch or complete tasks', 'Create engagement campaigns or perform tasks from other users across social platforms.', 'bg-coral'], ['account_balance_wallet', 'Track results & rewards', 'Monitor campaign performance or receive rewards straight to your wallet.', 'bg-mint']].map(([ic, t, d, c], i) => (
                        <Reveal key={t} delay={i * 130}><div className="card relative text-center"><span className={`relative mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl text-white shadow-xl ${c}`}><Icon name={ic} size={38} /><span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-ink text-xs font-bold">{i + 1}</span></span><h3 className="text-xl font-bold">{t}</h3><p className="mt-2 text-ink-500">{d}</p></div></Reveal>
                    ))}
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="bg-white py-24">
                <div className="mx-auto max-w-7xl px-5">
                    <Reveal className="mx-auto max-w-2xl text-center"><h2 className="text-4xl font-extrabold sm:text-5xl">Everything you need to grow and earn</h2><p className="mt-4 text-lg text-ink-500">Engagement tools, campaign management and rewards in one streamlined platform.</p></Reveal>
                    <div className="mt-14 grid gap-5 md:grid-cols-6">
                        {[
                            ['campaign', 'Campaign creation', 'Launch engagement tasks for social platforms, websites and online communities. Set the reward, the slots and the instructions.', 'md:col-span-3 bg-violet text-white', 'text-white/80'],
                            ['storefront', 'Task marketplace', 'Discover available tasks and earn rewards for completing online activities.', 'md:col-span-3 bg-paper', 'text-ink-500'],
                            ['account_balance_wallet', 'Wallet system', 'Manage earnings, campaign funding, withdrawals and transactions in one place.', 'md:col-span-2 bg-sun-100', 'text-ink-700'],
                            ['redeem', 'Referral rewards', 'Invite friends and earn a bonus when they complete their first task.', 'md:col-span-2 bg-coral-100', 'text-ink-700'],
                            ['verified', 'Submission verification', 'Review proof, approve or reject with a reason, and keep quality high.', 'md:col-span-2 bg-mint-100', 'text-ink-700'],
                        ].map(([ic, t, d, cls, tc], i) => (
                            <Reveal key={t} delay={i * 80} className={cls.split(' ')[0]}>
                                <div className={`group h-full rounded-3xl p-7 transition duration-300 hover:-translate-y-1 ${cls.split(' ').slice(1).join(' ')}`}>
                                    <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-white/90 text-violet shadow transition group-hover:rotate-6"><Icon name={ic} size={30} /></span>
                                    <h3 className="text-2xl font-bold">{t}</h3><p className={`mt-2 ${tc}`}>{d}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* BUILT FOR ENGAGEMENT */}
            <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 lg:grid-cols-2">
                <Reveal><h2 className="text-4xl font-extrabold sm:text-5xl">Built for real engagement</h2>
                    <div className="mt-8 grid gap-5">
                        {[['groups', 'Reach active users', 'Connect your campaigns with real users ready to complete engagement tasks.'], ['tune', 'Simple campaign management', 'Launch, pause and monitor campaigns from a clean dashboard.'], ['visibility', 'Transparent rewards', 'Users know exactly what they will earn. Advertisers see where every naira goes.'], ['bolt', 'Fast, structured verification', 'A smooth approval flow keeps campaigns moving.']].map(([ic, t, d]) => (
                            <div key={t} className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet"><Icon name={ic} /></span><div><h3 className="text-lg font-bold">{t}</h3><p className="text-ink-500">{d}</p></div></div>
                        ))}
                    </div></Reveal>
                <Reveal delay={150}><MockDashboard /></Reveal>
            </section>

            {/* TESTIMONIALS */}
            <section className="bg-ink py-24 text-white">
                <div className="mx-auto max-w-7xl px-5">
                    <Reveal className="mx-auto max-w-2xl text-center"><h2 className="text-4xl font-extrabold sm:text-5xl">Trusted by advertisers and users</h2></Reveal>
                    <div className="mt-14 grid gap-5 md:grid-cols-3">
                        {[['Launching campaigns and tracking participants feels incredibly smooth.', 'Amina B.', 'Brand manager'], ['I\'m a student and TaskFlow has been helping with my daily needs.', 'Chidi O.', 'University student'], ['If you are looking for a way to earn your daily 2k, I recommend TaskFlow.', 'Zainab K.', 'Freelancer']].map(([q, n, r], i) => (
                            <Reveal key={n} delay={i * 110}><figure className="h-full rounded-3xl bg-white/[.06] p-7 ring-1 ring-white/10"><div className="mb-4 flex gap-0.5 text-sun">{[...Array(5)].map((_, k) => <Icon key={k} name="star" size={20} />)}</div><blockquote className="text-lg leading-relaxed">“{q}”</blockquote><figcaption className="mt-6 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-violet font-bold">{n[0]}</span><span><span className="block font-bold">{n}</span><span className="text-sm text-ink-300">{r}</span></span></figcaption></figure></Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="mx-auto max-w-7xl px-5 py-24">
                <Reveal className="mx-auto mb-12 max-w-2xl text-center"><h2 className="text-4xl font-extrabold sm:text-5xl">Frequently asked questions</h2></Reveal>
                <Reveal><Faq /></Reveal>
            </section>

            {/* CTA */}
            <section className="px-5 pb-24">
                <Reveal><div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-violet via-violet-600 to-ink p-10 text-white sm:p-16">
                    <div className="absolute -right-16 -top-16 h-72 w-72 animate-blob rounded-full bg-coral/40 blur-3xl" />
                    <div className="relative max-w-2xl"><h2 className="text-4xl font-extrabold sm:text-5xl">Ready to reach more people?</h2><p className="mt-4 text-lg text-white/80">Create campaigns, grow engagement and connect with real users through task-based interactions.</p>
                        <Link to="/register" className="btn btn-coral mt-8 !px-8 !py-4 text-base"><Icon name="rocket_launch" />Launch a campaign</Link></div>
                </div></Reveal>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-ink-100 bg-white">
                <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
                    <div><Logo /><p className="mt-4 max-w-sm text-ink-500">TaskFlow helps advertisers grow through task-based engagement while giving users rewarding ways to participate online.</p></div>
                    <div><h4 className="mb-3 font-bold">Platform</h4><ul className="space-y-2 text-ink-500"><li><Link className="hover:text-violet" to="/register">Sign up</Link></li><li><Link className="hover:text-violet" to="/login">Log in</Link></li><li><a className="hover:text-violet" href="#faq">FAQ</a></li></ul></div>
                    <div><h4 className="mb-3 font-bold">Support</h4><ul className="space-y-2 text-ink-500"><li><a className="inline-flex items-center gap-2 hover:text-violet" href={`mailto:${email}`}><Icon name="mail" size={18} />{email}</a></li><li><Link className="hover:text-violet" to="/contact">Contact form</Link></li></ul></div>
                </div>
                <p className="border-t border-ink-100 py-5 text-center text-sm text-ink-500">© {new Date().getFullYear()} TaskFlow. All rights reserved.</p>
            </footer>
        </div>
    );
}
