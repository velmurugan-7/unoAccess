import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Globe, Lock, BarChart3, Key, ArrowRight, Check, ChevronRight, Star } from 'lucide-react';
import { Logo } from '../components/ui';

const features = [
  { icon: <Lock className="w-5 h-5" />, title: 'OAuth 2.0 / OIDC', desc: 'Industry-standard authorization with multi-account chooser, PKCE, and token introspection built in.' },
  { icon: <ShieldCheck className="w-5 h-5" />, title: 'Two-Factor Auth', desc: 'TOTP-based 2FA with backup codes, suspicious login detection, and email alerts.' },
  { icon: <BarChart3 className="w-5 h-5" />, title: 'Performance Monitoring', desc: 'Drop-in SDK for response times, error rates, and endpoint breakdowns with SLO tracking.' },
  { icon: <Globe className="w-5 h-5" />, title: 'Webhooks', desc: 'Real-time event delivery with HMAC signatures, automatic retries, and failure tracking.' },
  { icon: <Key className="w-5 h-5" />, title: 'Personal Access Tokens', desc: 'Scoped API keys for programmatic access. Revoke individually without affecting other sessions.' },
  { icon: <Zap className="w-5 h-5" />, title: 'Real-time Alerts', desc: 'Define metric thresholds — error rate, p95 latency — and receive instant email or webhook notifications.' },
];

const pricing = [
  { name: 'Free', price: '$0', period: 'forever', features: ['Up to 1,000 MAU', '1 OAuth client', '7-day log retention', 'Community support'], cta: 'Get started', href: '/signup', highlighted: false },
  { name: 'Pro', price: '$29', period: '/month', features: ['Up to 50,000 MAU', '10 OAuth clients', '90-day log retention', 'Webhooks & API keys', 'SLO reports & alerts', 'Email support'], cta: 'Start free trial', href: '/signup', highlighted: true },
  { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited MAU', 'Unlimited clients', '1-year retention', 'Custom SLAs', 'SSO & SAML', 'Dedicated support'], cta: 'Contact us', href: '/contact', highlighted: false },
];

const testimonials = [
  { name: 'Priya S.', role: 'CTO, Finverse', quote: 'Dropped our auth setup time from 3 weeks to 2 days. The monitoring SDK is genuinely excellent.' },
  { name: 'James K.', role: 'Lead Engineer, Logistix', quote: 'The SLO reporting alone is worth it. We caught a p95 regression before users noticed.' },
  { name: 'Amara O.', role: 'Founder, Synapse', quote: 'Clean API, clear docs, and the admin panel just works. This is how auth tools should feel.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-[DM_Sans,system-ui,sans-serif]">
      {/* ── Topbar ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[var(--c-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Logo size="sm" />
          <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--c-text2)]">
            {['Pricing', 'Docs', 'Status'].map(l => (
              <a key={l} href={`/${l.toLowerCase()}`} className="hover:text-[var(--c-text)] transition-colors">{l}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn btn-secondary btn-sm">Sign in</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">Get started</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden">
        {/* subtle grid bg */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e7ec_1px,transparent_1px),linear-gradient(to_bottom,#e4e7ec_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-[var(--c-blue-lt)] border border-[var(--c-blue-mid)] rounded-full px-3 py-1 text-xs font-medium text-[var(--c-blue)] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-blue)]" />
            Now with real-time alert rules and SLO tracking
            <ChevronRight className="w-3 h-3" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--c-text)] leading-[1.1]">
            Auth infrastructure<br />
            <span className="text-[var(--c-blue)]">built for developers</span>
          </h1>
          <p className="mt-6 text-lg text-[var(--c-text2)] max-w-2xl mx-auto leading-relaxed">
            Drop-in SSO with OAuth 2.0 & OIDC, two-factor auth, performance monitoring, and a full admin panel.
            From zero to production auth in under an hour.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-9">
            <Link to="/signup" className="btn btn-primary btn-lg gap-2">
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="/docs" className="btn btn-secondary btn-lg">View docs</a>
          </div>
          <p className="text-xs text-[var(--c-text3)] mt-4">No credit card required · Free tier forever</p>
        </div>
      </section>

      {/* ── Social proof strip ─────────────────────────── */}
      <section className="border-y border-[var(--c-border)] bg-[var(--c-surface2)] py-8">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs font-medium text-[var(--c-text3)] uppercase tracking-widest mb-6">Trusted by teams at</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale">
            {['Acme Corp', 'Veritas', 'Finverse', 'Logistix', 'Synapse', 'DataFlow'].map(n => (
              <span key={n} className="text-base font-semibold text-[var(--c-text2)] tracking-tight">{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--c-text)]">Everything you need, nothing you don't</h2>
          <p className="text-[var(--c-text3)] mt-3 max-w-xl mx-auto">A complete authentication platform that grows with your product. No vendor lock-in, full code ownership.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => (
            <div key={f.title} className="card card-p hover:shadow-md transition-shadow group">
              <div className="w-9 h-9 rounded-lg bg-[var(--c-blue-lt)] text-[var(--c-blue)] flex items-center justify-center mb-4 group-hover:bg-[var(--c-blue)] group-hover:text-white transition-colors">
                {f.icon}
              </div>
              <h3 className="font-semibold text-[var(--c-text)] mb-2">{f.title}</h3>
              <p className="text-sm text-[var(--c-text3)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Code preview ───────────────────────────────── */}
      <section className="bg-[var(--c-surface2)] border-y border-[var(--c-border)] py-20">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="badge badge-blue mb-4">Quick start</span>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--c-text)] mb-4">Integrate in minutes</h2>
            <p className="text-[var(--c-text3)] text-sm leading-relaxed mb-6">Install the monitoring SDK, point it at your UnoAccess instance, and start collecting data immediately — no configuration files needed.</p>
            <a href="/docs/quickstart" className="btn btn-primary btn-sm gap-1.5">
              Read the quickstart <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="code-block text-[13px]">
            <span className="text-[#94a3b8]"># Install the SDK</span>{'\n'}
            <span className="text-[#7dd3fc]">npm install</span> <span className="text-[#e2e8f0]">unoaccess-monitor</span>{'\n\n'}
            <span className="text-[#94a3b8]">// Initialize in your Express app</span>{'\n'}
            <span className="text-[#c084fc]">import</span> <span className="text-[#e2e8f0]">{'{ monitor }'}</span> <span className="text-[#c084fc]">from</span> <span className="text-[#86efac]">'unoaccess-monitor'</span>{'\n\n'}
            <span className="text-[#e2e8f0]">monitor</span><span className="text-[#94a3b8]">.</span><span className="text-[#7dd3fc]">init</span><span className="text-[#e2e8f0]">{'({'}</span>{'\n'}
            {'  '}<span className="text-[#fbbf24]">clientId</span><span className="text-[#e2e8f0]">:</span> <span className="text-[#86efac]">'ua_your_client_id'</span><span className="text-[#e2e8f0]">,</span>{'\n'}
            {'  '}<span className="text-[#fbbf24]">clientSecret</span><span className="text-[#e2e8f0]">:</span> <span className="text-[#86efac]">'your_secret'</span><span className="text-[#e2e8f0]">,</span>{'\n'}
            {'  '}<span className="text-[#fbbf24]">endpoint</span><span className="text-[#e2e8f0]">:</span> <span className="text-[#86efac]">'https://your-instance.com'</span>{'\n'}
            <span className="text-[#e2e8f0]">{'});'}</span>
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────── */}
      <section className="py-24 max-w-5xl mx-auto px-6" id="pricing">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--c-text)]">Simple, transparent pricing</h2>
          <p className="text-[var(--c-text3)] mt-3">Start free, upgrade when you're ready.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {pricing.map(plan => (
            <div key={plan.name} className={`card card-p flex flex-col ${plan.highlighted ? 'ring-2 ring-[var(--c-blue)] shadow-md' : ''}`}>
              {plan.highlighted && <span className="badge badge-blue mb-3 w-fit">Most popular</span>}
              <p className="font-semibold text-[var(--c-text)]">{plan.name}</p>
              <div className="mt-2 mb-5">
                <span className="text-3xl font-bold text-[var(--c-text)]">{plan.price}</span>
                {plan.period && <span className="text-sm text-[var(--c-text3)] ml-1">{plan.period}</span>}
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[var(--c-text2)]">
                    <Check className="w-4 h-4 text-[var(--c-green)] flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link to={plan.href} className={`btn w-full ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}`}>{plan.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────── */}
      <section className="bg-[var(--c-surface2)] border-y border-[var(--c-border)] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--c-text)]">What developers say</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            {testimonials.map(t => (
              <div key={t.name} className="card card-p">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-[var(--c-amber)] text-[var(--c-amber)]" />)}
                </div>
                <p className="text-sm text-[var(--c-text2)] leading-relaxed mb-4">"{t.quote}"</p>
                <div>
                  <p className="text-xs font-semibold text-[var(--c-text)]">{t.name}</p>
                  <p className="text-xs text-[var(--c-text3)]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="py-24 text-center max-w-3xl mx-auto px-6">
        <h2 className="text-3xl font-bold tracking-tight text-[var(--c-text)] mb-4">Ready to ship secure auth?</h2>
        <p className="text-[var(--c-text3)] mb-8">Join hundreds of teams using UnoAccess to handle authentication, monitoring, and more.</p>
        <Link to="/signup" className="btn btn-primary btn-lg gap-2">
          Get started for free <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-[var(--c-border)] bg-[var(--c-surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row items-start justify-between gap-6">
          <div>
            <Logo size="sm" />
            <p className="text-xs text-[var(--c-text3)] mt-2">Secure SSO for modern applications</p>
          </div>
          <div className="flex gap-12 text-sm">
            {[['Product', ['Pricing', 'Status', 'Changelog']], ['Developers', ['Documentation', 'API Reference', 'SDKs']], ['Company', ['Privacy', 'Terms', 'Contact']]].map(([cat, links]) => (
              <div key={cat as string}>
                <p className="font-semibold text-[var(--c-text)] mb-3">{cat}</p>
                <ul className="space-y-2">
                  {(links as string[]).map(l => (
                    <li key={l}><a href="#" className="text-[var(--c-text3)] hover:text-[var(--c-text)] transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-[var(--c-border)] py-4 text-center text-xs text-[var(--c-text3)]">
          © {new Date().getFullYear()} UnoAccess. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
