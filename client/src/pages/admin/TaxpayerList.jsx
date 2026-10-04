import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserCheck, X } from 'lucide-react';
import { Shell } from '../../components/Shell.jsx';
import { PageTitle } from '../../components/Layout.jsx';
import { Badge, Card, EmptyState, LoadingState } from '../../components/ui.jsx';
import { getTaxpayers } from '../../services/api.js';

export default function TaxpayerList() {
  const [taxpayers, setTaxpayers] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getTaxpayers()
      .then(setTaxpayers)
      .catch((err) => setError(err.message || 'Failed to load taxpayers.'));
  }, []);

  const filtered = useMemo(
    () =>
      (taxpayers ?? []).filter((item) =>
        `${item.fullName} ${item.email} ${item.tin}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query, taxpayers],
  );

  return (
    <Shell>
      <PageTitle
        title="Taxpayer list"
        detail={taxpayers ? `${taxpayers.length} registered taxpayer${taxpayers.length !== 1 ? 's' : ''}` : 'Search and inspect registered taxpayers.'}
      />

      <Card>
        <label className="search-box" htmlFor="taxpayer-search">
          <Search size={16} />
          <input
            id="taxpayer-search"
            placeholder="Search by name, email, or TIN…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', display: 'flex', padding: 2 }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </label>

        {error ? (
          <p className="form-error">{error}</p>
        ) : !taxpayers ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={query ? 'No results found' : 'No taxpayers yet'}
            detail={query ? `No taxpayers match "${query}". Try a different search term.` : 'Taxpayers will appear here once registered.'}
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>TIN</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'var(--accent-bg)', color: 'var(--accent)',
                          fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                        }}>
                          {user.fullName?.charAt(0).toUpperCase()}
                        </span>
                        {user.fullName}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{user.tin}</td>
                    <td style={{ color: 'var(--muted)' }}>{user.email}</td>
                    <td><Badge status={user.complianceStatus} /></td>
                    <td>
                      <Link
                        to={`/admin/taxpayers/${user.id}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.88rem' }}
                      >
                        <UserCheck size={14} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Shell>
  );
}
