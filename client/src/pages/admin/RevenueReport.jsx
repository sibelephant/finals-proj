import { useEffect, useState } from 'react';
import { Shell } from '../../components/Shell.jsx';
import { PageTitle } from '../../components/Layout.jsx';
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

  const max = Math.max(...(stats?.revenueByPeriod ?? [{ amount: 1 }]).map((item) => item.amount), 1);

  return (
    <Shell>
      <PageTitle title="Revenue report" detail="Monthly payment totals for the past 6 months." />
      <Card>
        {error
          ? <p className="form-error">{error}</p>
          : !stats
            ? <LoadingState />
            : (
              <div className="bar-chart">
                {stats.revenueByPeriod.map((item) => (
                  <div className="bar-item" key={item.period}>
                    <div
                      className="bar"
                      style={{ height: `${Math.max(8, (item.amount / max) * 180)}px` }}
                    >
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                    <strong>{item.period}</strong>
                  </div>
                ))}
              </div>
            )}
      </Card>
    </Shell>
  );
}
