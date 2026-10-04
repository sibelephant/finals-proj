import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BadgeCheck, ShieldCheck } from 'lucide-react';
import { Shell } from '../components/Shell.jsx';
import { PageTitle } from '../components/Layout.jsx';
import { Button, Card } from '../components/ui.jsx';
import { confirmPayment } from '../services/api.js';
import { formatCurrency } from '../utils/format.js';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);

  const amount = location.state?.amount;
  const taxReturn = location.state?.taxReturn;

  if (!amount) return <Navigate to="/dashboard" replace />;

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const response = await confirmPayment({ taxReturnId: taxReturn?.id });
      setPayment(response);
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <PageTitle
        title="Payment simulation"
        detail="Confirms a simulated payment — no real gateway or funds are involved."
      />

      <Card className="payment-card">
        {payment ? (
          <div className="success-box animate-in">
            <BadgeCheck size={36} />
            <h2 style={{ margin: 0 }}>Payment confirmed</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Your payment has been recorded. Reference:{' '}
              <strong style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                {payment.paymentReference}
              </strong>
            </p>
            <Button
              onClick={() =>
                navigate('/documents', { state: { payment, taxReturn, amount } })
              }
              style={{ marginTop: 4 }}
            >
              <ShieldCheck size={18} /> View documents
            </Button>
          </div>
        ) : (
          <>
            <span className="amount-label">Amount due</span>
            <strong className="amount">{formatCurrency(amount)}</strong>

            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 20 }}>
              This is a simulation. Click below to confirm payment and generate your receipt and TCC.
            </p>

            {error && <p className="form-error" style={{ marginBottom: 16 }}>{error}</p>}

            <Button onClick={pay} disabled={loading}>
              {loading ? 'Confirming…' : 'Confirm payment'}
            </Button>
          </>
        )}
      </Card>
    </Shell>
  );
}
