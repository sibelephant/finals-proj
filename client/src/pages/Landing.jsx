import { ArrowRight, BadgeCheck, BarChart3, FileText, UserPlus } from 'lucide-react';
import { Shell } from '../components/Shell.jsx';
import { LinkButton } from '../components/ui.jsx';

const FEATURES = [
  { icon: <FileText size={14} />, label: 'Guided filing' },
  { icon: <BadgeCheck size={14} />, label: 'Instant computation' },
  { icon: <BarChart3 size={14} />, label: 'PDF receipts & TCC' },
];

export default function Landing() {
  return (
    <Shell>
      <section className="hero animate-in">
        <div className="hero-copy">
          <p className="eyebrow">Nigeria Personal Income Tax — 2026 filing season</p>
          <h1>Submit your PIT return in minutes, not days.</h1>
          <p>
            A secure, guided portal for Nigerian taxpayers. Declare your income, let the server
            compute your liability under the NTA 2025 or Legacy PITA regime, confirm payment, and
            download your Tax Clearance Certificate — all in one place.
          </p>

          <div className="feature-cards">
            {FEATURES.map((f) => (
              <span key={f.label} className="feature-card">
                {f.icon} {f.label}
              </span>
            ))}
          </div>

          <div className="actions" style={{ marginTop: 32 }}>
            <LinkButton to="/register">
              <UserPlus size={18} /> Create account
            </LinkButton>
            <LinkButton to="/login" variant="secondary">
              Sign in <ArrowRight size={18} />
            </LinkButton>
          </div>
        </div>

        <div className="hero-panel">
          <p className="hero-panel-title">Portal at a glance</p>

          <div className="panel-row">
            <span>Filing year</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="panel-dot" />
              <strong>2026</strong>
            </div>
          </div>
          <div className="panel-row">
            <span>API status</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="panel-dot" />
              <strong>Live</strong>
            </div>
          </div>
          <div className="panel-row">
            <span>Access roles</span>
            <strong>Taxpayer + Admin</strong>
          </div>
          <div className="panel-row">
            <span>Tax regime</span>
            <strong>NTA 2025 / Legacy PITA</strong>
          </div>
          <div className="panel-row">
            <span>Documents</span>
            <strong>Receipt &amp; TCC PDF</strong>
          </div>
        </div>
      </section>
    </Shell>
  );
}
