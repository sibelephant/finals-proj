import { useEffect, useState } from 'react';
import { BarChart3, Search } from 'lucide-react';
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
      <PageTitle title="Administrator overview" detail="Monitor compliance, revenue, and taxpayer activity." />
      {error
        ? <p className="form-error" style={{ margin: '24px 0' }}>{error}</p>
        : !stats
          ? <LoadingState />
          : (
            <section className="content-grid">
              <Metric label="Total taxpayers" value={stats.totalTaxpayers} />
              <Metric label="Revenue collected" value={formatCurrency(stats.totalRevenue)} />
              <Metric label="Compliance rate" value={`${stats.complianceRate}%`} />
              <Metric label="Pending vs paid" value={`${stats.pendingReturns} / ${stats.paidReturns}`} />
              <Card className="wide admin-links">
                <LinkButton to="/admin/taxpayers" variant="secondary"><Search size={18} /> View Taxpayers</LinkButton>
                <LinkButton to="/admin/reports" variant="secondary"><BarChart3 size={18} /> Revenue Reports</LinkButton>
              </Card>
            </section>
          )}
    </Shell>
  );
}
