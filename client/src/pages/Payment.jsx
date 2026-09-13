import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
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
      const response = await confirmPayment({ taxReturnId: taxReturn?.id, amount });
      setPayment(response);
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <PageTitle title="Payment simulation" detail="This screen confirms a simulated payment without connecting to a payment gateway." />
      <Card className="payment-card">
        {payment ? (
          <div className="success-box">
            <BadgeCheck size={34} />
            <h2>Payment confirmed</h2>
            <p>Reference: <strong>{payment.paymentReference}</strong></p>
            <Button onClick={() => navigate('/documents', { state: { payment, taxReturn, amount } })}>View Receipt and TCC</Button>
          </div>
        ) : (
          <>
            <span className="amount-label">Amount due</span>
            <strong className="amount">{formatCurrency(amount)}</strong>
            {error && <p className="form-error">{error}</p>}
            <Button onClick={pay} disabled={loading}>{loading ? 'Confirming...' : 'Confirm Payment'}</Button>
          </>
        )}
      </Card>
    </Shell>
  );
}