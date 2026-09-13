import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { Shell } from '../components/Shell.jsx';
import { Metric, PageTitle } from '../components/Layout.jsx';
import { Button, Card } from '../components/ui.jsx';
import { formatCurrency } from '../utils/format.js';

export default function ComputationResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state ?? {};
  const result = data.computedResult;

  if (!result) return <Navigate to="/declare" replace />;

  return (
    <Shell>
      <PageTitle title="Computation result" detail="Returned by the API. No tax calculation runs in the browser." />
      <section className="content-grid">
        <Metric label={result.reliefBasis === 'RENT_RELIEF' ? 'Rent relief' : 'CRA'} value={formatCurrency(result.reliefAmount)} />
        <Metric label="Deductions" value={formatCurrency(result.totalDeductions)} />
        <Metric label="Taxable income" value={formatCurrency(result.taxableIncome)} />
        <Metric label="Effective rate" value={`${result.effectiveRate}%`} />
        <Card className="wide">
          <h2>Graduated band breakdown</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Band</th><th>Rate</th><th>Amount taxed</th><th>Tax</th></tr></thead>
              <tbody>
                {result.bandBreakdown.map((band) => (
                  <tr key={band.band}>
                    <td>{band.band}</td>
                    <td>{band.rate}%</td>
                    <td>{formatCurrency(band.amountTaxedInBand)}</td>
                    <td>{formatCurrency(band.taxForBand)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="total-row">
            <span>Net tax payable</span>
            <strong>{formatCurrency(result.taxPayable)}</strong>
          </div>
          <Button onClick={() => navigate('/payment', { state: { taxReturn: data.taxReturn, amount: result.taxPayable } })}>
            <CreditCard size={18} /> Proceed to Payment
          </Button>
        </Card>
      </section>
    </Shell>
  );
}