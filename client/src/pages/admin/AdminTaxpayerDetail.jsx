import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Shell } from '../../components/Shell.jsx';
import { PageTitle } from '../../components/Layout.jsx';
import { Card, EmptyState, LoadingState } from '../../components/ui.jsx';
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

  if (error) return <Shell><p className="form-error" style={{ margin: '24px' }}>{error}</p></Shell>;
  if (!detail) return <Shell><LoadingState /></Shell>;

  return (
    <Shell>
      <PageTitle title={detail.user?.fullName ?? 'Taxpayer detail'} detail="Administrator read-only view of filing history." />
      <section className="content-grid">
        <Card>
          <h2>Taxpayer</h2>
          <dl className="detail-list">
            <dt>TIN</dt><dd>{detail.user?.tin}</dd>
            <dt>Email</dt><dd>{detail.user?.email}</dd>
            <dt>Status</dt><dd>{detail.user?.complianceStatus}</dd>
          </dl>
        </Card>
        <Card className="wide">
          <h2>Filing history</h2>
          {detail.returns.length
            ? <ReturnsTable returns={detail.returns} admin />
            : <EmptyState title="No filings" detail="This taxpayer has no returns yet." />}
        </Card>
      </section>
    </Shell>
  );
}
