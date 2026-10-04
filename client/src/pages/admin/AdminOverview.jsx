import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users } from 'lucide-react';
import { Shell } from '../../components/Shell.jsx';
import { Metric, PageTitle } from '../../components/Layout.jsx';
import { Card, LinkButton, LoadingState } from '../../components/ui.jsx';
import { getAdminStats } from '../../services/api.js';
import { formatCurrency } from '../../utils/format.js';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((err) => setError(err.message || 'Failed to load admin stats.'));
  }, []);

  return (
    <Shell>
      <PageTitle
        title="Administrator overview"
        detail="Monitor compliance, revenue totals, and taxpayer activity across the platform."
      />

      {error ? (
        <p className="form-error" style={{ margin: '24px 0' }}>{error}</p>
      ) : !stats ? (
        <LoadingState />
      ) : (
        <section className="content-grid animate-in">
          <Metric label="Total taxpayers" value={stats.totalTaxpayers} />
          <Metric label="Revenue collected" value={formatCurrency(stats.totalRevenue)} />
          <Metric label="Compliance rate" value={`${stats.complianceRate}%`} />
          <Metric label="Pending / Paid returns" value={`${stats.pendingReturns} / ${stats.paidReturns}`} />

          <Card className="wide">
            <h2>Quick actions</h2>
            <div className="admin-links">
              <LinkButton to="/admin/taxpayers" variant="secondary">
                <Users size={16} /> View all taxpayers
              </LinkButton>
              <LinkButton to="/admin/reports" variant="secondary">
                <BarChart3 size={16} /> Revenue reports
              </LinkButton>
              <LinkButton to="/admin/reports" variant="secondary">
                <TrendingUp size={16} /> Monthly breakdown
              </LinkButton>
            </div>
          </Card>
        </section>
      )}
    </Shell>
  );
}
