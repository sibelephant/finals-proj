import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Shell } from '../../components/Shell.jsx';
import { PageTitle } from '../../components/Layout.jsx';
import { Badge, Card, EmptyState, LoadingState } from '../../components/ui.jsx';
import ReturnsTable from '../../components/ReturnsTable.jsx';
import { getTaxpayerDetails } from '../../services/api.js';

export default function AdminTaxpayerDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTaxpayerDetails(id)
      .then(setDetail)
      .catch((err) => setError(err.message || 'Failed to load taxpayer details.'));
  }, [id]);

  if (error) {
    return (
      <Shell>
        <p className="form-error" style={{ margin: '24px' }}>{error}</p>
      </Shell>
    );
  }

  if (!detail) return <Shell><LoadingState /></Shell>;

  const { user } = detail;

  return (
    <Shell>
      <PageTitle
        title={user?.fullName ?? 'Taxpayer detail'}
        detail="Read-only administrative view of this taxpayer's profile and filing history."
        action={
          <Link
            to="/admin/taxpayers"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', fontWeight: 600, color: 'var(--muted)' }}
          >
            <ArrowLeft size={16} /> Back to list
          </Link>
        }
      />

      <section className="content-grid animate-in">
        <Card>
          <h2>Profile</h2>
          <dl className="detail-list">
            <dt>TIN</dt>
            <dd style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.03em' }}>
              {user?.tin}
            </dd>
            <dt>Email</dt>
            <dd>{user?.email}</dd>
            <dt>Phone</dt>
            <dd>{user?.phone ?? '—'}</dd>
            <dt>Status</dt>
            <dd><Badge status={user?.complianceStatus} /></dd>
          </dl>
        </Card>

        <Card className="wide">
          <h2>Filing history</h2>
          {detail.returns.length ? (
            <ReturnsTable returns={detail.returns} admin />
          ) : (
            <EmptyState
              title="No filings"
              detail="This taxpayer has not submitted any returns yet."
            />
          )}
        </Card>
      </section>
    </Shell>
  );
}
