import { useEffect, useState } from 'react';
import { Shell } from '../../components/Shell.jsx';
import { Metric, PageTitle } from '../../components/Layout.jsx';
import { Card, LoadingState } from '../../components/ui.jsx';
import { getAdminStats } from '../../services/api.js';
import { formatCurrency } from '../../utils/format.js';

export default function RevenueReport() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((err) => setError(err.message || 'Failed to load revenue data.'));
  }, []);

  const periods = stats?.revenueByPeriod ?? [];
  const max = Math.max(...periods.map((item) => item.amount), 1);

  return (
    <Shell>
      <PageTitle
        title="Revenue report"
        detail="Monthly payment totals for the past 6 filing periods."
      />

      {error ? (
        <p className="form-error" style={{ margin: '24px 0' }}>{error}</p>
      ) : !stats ? (
        <LoadingState />
      ) : (
        <section className="content-grid animate-in">
          <Metric label="Total revenue collected" value={formatCurrency(stats.totalRevenue)} />
          <Metric label="Paid returns" value={stats.paidReturns} />
          <Metric label="Compliance rate" value={`${stats.complianceRate}%`} />
          <Metric label="Pending returns" value={stats.pendingReturns} />

          <Card className="wide">
            <h2>Monthly revenue</h2>
            {periods.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No revenue data available yet.</p>
            ) : (
              <div className="bar-chart">
                {periods.map((item) => (
                  <div className="bar-item" key={item.period}>
                    <div
                      className="bar"
                      style={{ height: `${Math.max(10, (item.amount / max) * 200)}px` }}
                    >
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                    <strong className="bar-label">{item.period}</strong>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      )}
    </Shell>
  );
}
