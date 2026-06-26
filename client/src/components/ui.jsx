import { Link } from 'react-router-dom';

export function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({ children, variant = 'primary', className = '', ...props }) {
  return (
    <Link className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </Link>
  );
}

export function Field({ label, error, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error ? <small className="error-text">{error}</small> : null}
    </label>
  );
}

export function Card({ children, className = '' }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function Badge({ status }) {
  return <span className={`badge badge-${String(status).toLowerCase()}`}>{status}</span>;
}

export function LoadingState({ label = 'Loading records...' }) {
  return <div className="state-box">{label}</div>;
}

export function EmptyState({ title, detail }) {
  return (
    <div className="state-box">
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}
