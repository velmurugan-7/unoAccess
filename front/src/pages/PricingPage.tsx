import { Link } from 'react-router-dom';
import { Check, ArrowRight, Zap, HelpCircle } from 'lucide-react';
import { Logo } from '../components/ui';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    desc: 'Perfect for side projects and early-stage products.',
    features: [
      '1,000 monthly active users',
      '1 OAuth client',
      '7-day log retention',
      'Basic monitoring',
      'Email + password auth',
      '2FA support',
      'Community support',
    ],
    missing: ['Webhooks', 'API keys', 'SLO reports', 'Alert rules', 'Priority support'],
    cta: 'Start for free',
    href: '/signup',
    highlighted: false,
    badge: null,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    desc: 'For growing teams that need reliability and observability.',
    features: [
      '50,000 monthly active users',
      '10 OAuth clients',
      '90-day log retention',
      'Full performance monitoring',
      'Webhooks with HMAC signing',
      'Personal API keys',
      'SLO dashboards & PDF reports',
      'Real-time alert rules',
      'Audit log exports (CSV/JSON)',
      'Email support (48h SLA)',
    ],
    missing: [],
    cta: 'Start 14-day free trial',
    href: '/signup?plan=pro',
    highlighted: true,
    badge: 'Most popular',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For organisations that need custom SLAs and dedicated support.',
    features: [
      'Unlimited monthly active users',
      'Unlimited OAuth clients',
      '1-year log retention',
      'All Pro features',
      'SSO / SAML integration',
      'Custom alert integrations',
      'Dedicated Slack channel',
      'Custom SLAs',
      'On-prem deployment option',
      'Security audit & pen test',
    ],
    missing: [],
    cta: 'Contact sales',
    href: 'mailto:sales@unoaccess.com',
    highlighted: false,
    badge: null,
  },
];

const faqs = [
  { q: 'What counts as a monthly active user?', a: 'Any user that authenticates at least once in a calendar month via your OAuth client.' },
  { q: 'Can I self-host UnoAccess?', a: 'Yes — UnoAccess is open source. Enterprise customers get dedicated deployment support and a hardened setup guide.' },
  { q: 'What payment methods do you accept?', a: 'All major credit and debit cards via Stripe. Enterprise customers can also pay by invoice.' },
  { q: 'How does the free trial work?', a: 'Your 14-day Pro trial starts immediately after signup — no credit card required. You can cancel anytime before the trial ends.' },
  { q: 'Is my data secure?', a: 'All data is encrypted at rest and in transit. Client secrets are AES-256 encrypted, IPs are SHA-256 hashed. We never store API keys in plaintext.' },
  { q: 'What happens if I exceed my MAU limit?', a: "We'll notify you when you're approaching your limit. We won't cut off your users — but we'll ask you to upgrade within 30 days." },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[var(--c-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/"><Logo size="sm" /></Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--c-text2)]">
            <Link to="/" className="hover:text-[var(--c-text)]">Home</Link>
            <a href="/docs" className="hover:text-[var(--c-text)]">Docs</a>
            <a href="/status" className="hover:text-[var(--c-text)]">Status</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn btn-secondary btn-sm">Sign in</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-12 text-center px-6">
        <span className="badge badge-blue mb-4 inline-flex">
          <Zap className="w-3 h-3" /> 14-day free trial on Pro
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--c-text)] mb-3">
          Simple, transparent pricing
        </h1>
        <p className="text-[var(--c-text3)] max-w-xl mx-auto text-base">
          Start free. Upgrade when you're ready. No surprises on your bill.
        </p>
      </section>

      {/* Tiers */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tiers.map(tier => (
            <div
              key={tier.name}
              className={`card flex flex-col ${tier.highlighted ? 'ring-2 ring-[var(--c-blue)] shadow-lg relative' : ''}`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge badge-blue px-3 py-1 text-xs font-semibold">{tier.badge}</span>
                </div>
              )}
              <div className="p-6 pb-5 border-b border-[var(--c-border)]">
                <p className="font-semibold text-[var(--c-text)] mb-1">{tier.name}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-[var(--c-text)]">{tier.price}</span>
                  {tier.period && <span className="text-sm text-[var(--c-text3)]">{tier.period}</span>}
                </div>
                <p className="text-sm text-[var(--c-text3)] leading-relaxed">{tier.desc}</p>
              </div>
              <div className="p-6 flex-1">
                <ul className="space-y-2.5">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[var(--c-text2)]">
                      <Check className="w-4 h-4 text-[var(--c-green)] flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {tier.missing.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[var(--c-text3)] line-through">
                      <span className="w-4 h-4 flex-shrink-0 mt-0.5 text-center text-[var(--c-border2)] font-bold">×</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 pt-0">
                <a
                  href={tier.href}
                  className={`btn w-full ${tier.highlighted ? 'btn-primary' : 'btn-secondary'} gap-1.5`}
                >
                  {tier.cta}
                  {tier.highlighted && <ArrowRight className="w-4 h-4" />}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Feature comparison note */}
        <p className="text-center text-xs text-[var(--c-text3)] mt-6">
          All plans include HTTPS, 99.9% uptime SLA, and GDPR-compliant data processing.
        </p>
      </section>

      {/* FAQ */}
      <section className="bg-[var(--c-surface2)] border-t border-[var(--c-border)] py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--c-text)] text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {faqs.map(({ q, a }) => (
              <div key={q} className="card card-p">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-4 h-4 text-[var(--c-blue)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--c-text)] mb-1">{q}</p>
                    <p className="text-sm text-[var(--c-text3)] leading-relaxed">{a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center px-6">
        <h2 className="text-2xl font-bold text-[var(--c-text)] mb-3">
          Ready to get started?
        </h2>
        <p className="text-[var(--c-text3)] text-sm mb-6">
          Free forever on the starter plan. No credit card required.
        </p>
        <Link to="/signup" className="btn btn-primary btn-lg gap-2">
          Create your account <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--c-border)] bg-[var(--c-surface)] py-6 text-center">
        <p className="text-xs text-[var(--c-text3)]">
          © {new Date().getFullYear()} UnoAccess ·{' '}
          <a href="/docs/terms" className="hover:text-[var(--c-text)]">Terms</a> ·{' '}
          <a href="/docs/privacy" className="hover:text-[var(--c-text)]">Privacy</a>
        </p>
      </footer>
    </div>
  );
}
