import { useEffect, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import { Shell } from '../components/Shell.jsx';
import { PageTitle } from '../components/Layout.jsx';
import { Card, EmptyState, LoadingState, LinkButton } from '../components/ui.jsx';
import ReturnsTable from '../components/ReturnsTable.jsx';
import { getTaxReturns } from '../services/api.js';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [returns, setReturns] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTaxReturns(user.id)
      .then(setReturns)
      .catch((err) => setError(err.message || 'Failed to load filings.'));
  }, [user.id]);

  const firstName = user.fullName?.split(' ')[0] ?? user.fullName;

  return (
    <Shell>
      <PageTitle
        title={
          <span>
            {getGreeting()},{' '}
            <span className="greeting-name">{firstName}</span>
          </span>
        }
        detail="Track your filings, review past returns, or start a new annual declaration."
        action={
          <>
            <LinkButton to="/bank-statements" variant="secondary">
              <Upload size={16} /> Upload Statement
            </LinkButton>
            <LinkButton to="/declare">
              <FileText size={16} /> File New Return
            </LinkButton>
          </>
        }
      />

      <section className="content-grid">
        {/* Profile card */}
        <Card>
          <h2>Profile</h2>
          <dl className="detail-list">
            <dt>Name</dt>
            <dd>{user.fullName}</dd>
            <dt>TIN</dt>
            <dd style={{ fontFamily: 'var(--font-mono)', fontSize: '0.92rem', letterSpacing: '0.04em' }}>
              {user.tin}
            </dd>
            <dt>Email</dt>
            <dd>{user.email}</dd>
            <dt>Address</dt>
            <dd>{user.address}</dd>
          </dl>
        </Card>

        {/* Filing history */}
        <Card className="wide">
          <h2>Filing history</h2>
          {error ? (
            <p className="form-error">{error}</p>
          ) : !returns ? (
            <LoadingState />
          ) : returns.length === 0 ? (
            <EmptyState
              title="No filings yet"
              detail="You haven't submitted any returns. Click 'File New Return' to get started."
            />
          ) : (
            <ReturnsTable returns={returns} />
          )}
        </Card>
      </section>
    </Shell>
  );
}
