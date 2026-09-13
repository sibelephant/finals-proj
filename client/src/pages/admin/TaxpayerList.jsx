import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
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
    () => (taxpayers ?? []).filter((item) =>
      `${item.fullName} ${item.email} ${item.tin}`.toLowerCase().includes(query.toLowerCase())
    ),
    [query, taxpayers],
  );

  return (
    <Shell>
      <PageTitle title="Taxpayer list" detail="Search and inspect registered taxpayers." />
      <Card>
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search by name, email, or TIN"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {error
          ? <p className="form-error">{error}</p>
          : !taxpayers
            ? <LoadingState />
            : filtered.length === 0
              ? <EmptyState title="No taxpayers found" detail="Adjust the search term." />
              : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th><th>TIN</th><th>Email</th><th>Status</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((user) => (
                        <tr key={user.id}>
                          <td>{user.fullName}</td>
                          <td>{user.tin}</td>
                          <td>{user.email}</td>
                          <td><Badge status={user.complianceStatus} /></td>
                          <td><Link to={`/admin/taxpayers/${user.id}`}>View</Link></td>
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
