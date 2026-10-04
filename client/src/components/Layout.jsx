import { Lightbulb } from 'lucide-react';
import { Card } from './ui.jsx';

export function Metric({ label, value }) {
  return (
    <Card className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </Card>
  );
}

export function PageTitle({ title, detail, action }) {
  return (
    <section className="page-title">
      <div>
        <h1>{title}</h1>
        {detail && <p>{detail}</p>}
      </div>
      {action && (
        <div className="actions">
          {action}
        </div>
      )}
    </section>
  );
}

export function AuthPanel({ title, detail, hint, children }) {
  return (
    <section className="auth-layout">
      <Card className="auth-card animate-in">
        <p className="eyebrow">Secure portal</p>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.9rem)', marginBottom: 8 }}>{title}</h1>
        {detail && <p style={{ marginBottom: 0 }}>{detail}</p>}
        {hint && (
          <p style={{
            display: 'flex',
            gap: 8,
            marginTop: 8,
            padding: '8px 12px',
            borderRadius: 6,
            background: 'var(--surface-strong)',
            border: '1px solid var(--border)',
            fontSize: '0.82rem',
            color: 'var(--muted)',
            fontWeight: 600,
          }}>
            <Lightbulb size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--warning)' }} />
            {hint}
          </p>
        )}
        {children}
      </Card>
    </section>
  );
}
