import { Card } from './ui.jsx';

export function Metric({ label, value }) {
  return <Card className="metric"><span>{label}</span><strong>{value}</strong></Card>;
}

export function PageTitle({ title, detail, action }) {
  return (
    <section className="page-title">
      <div><h1>{title}</h1><p>{detail}</p></div>
      {action}
    </section>
  );
}

export function AuthPanel({ title, detail, children }) {
  return (
    <section className="auth-layout">
      <Card className="auth-card">
        <p className="eyebrow">Secure portal</p>
        <h1>{title}</h1>
        <p>{detail}</p>
        {children}
      </Card>
    </section>
  );
}
