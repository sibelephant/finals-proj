import { useEffect, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import { Shell } from '../components/Shell.jsx';
import { PageTitle } from '../components/Layout.jsx';
import { Card, EmptyState, LoadingState, LinkButton } from '../components/ui.jsx';
import ReturnsTable from '../components/ReturnsTable.jsx';
import { getTaxReturns } from '../services/api.js';

export default function Dashboard() {
  const { user } = useAuth();
  const [returns, setReturns] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTaxReturns(user.id)
      .then(setReturns)
      .catch((err) => setError(err.message || 'Failed to load filings.'));
  }, [user.id]);

  return (
    <Shell>
      <PageTitle
        title="Taxpayer dashboard"
        detail="Track filings, continue drafts, or start a new annual return."
        action={
          <>
            <LinkButton to="/bank-statements" variant="secondary"><Upload size={18} /> Upload Statement</LinkButton>
            <LinkButton to="/declare"><FileText size={18} /> File New Return</LinkButton>
          </>
        }
      />
      <section className="content-grid">
        <Card>
          <h2>Profile summary</h2>
          <dl className="detail-list">
            <dt>Name</dt><dd>{user.fullName}</dd>
            <dt>TIN</dt><dd>{user.tin}</dd>
            <dt>Email</dt><dd>{user.email}</dd>
            <dt>Address</dt><dd>{user.address}</dd>
          </dl>
        </Card>
        <Card className="wide">
          <h2>Filing history</h2>
          {error
            ? <p className="form-error">{error}</p>
            : !returns
              ? <LoadingState />
              : returns.length === 0
                ? <EmptyState title="No filings yet" detail="Start a new return when you are ready." />
                : <ReturnsTable returns={returns} />}
        </Card>
      </section>
    </Shell>
  );
}
