import { Fragment, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Shell } from '../components/Shell.jsx';
import { Metric, PageTitle } from '../components/Layout.jsx';
import { Badge, Card, EmptyState, LoadingState } from '../components/ui.jsx';
import { getTaxReturnById } from '../services/api.js';
import { formatCurrency, formatDate } from '../utils/format.js';

// Fields to exclude from the declaration detail list
const SKIP_KEYS = new Set(['id', 'taxReturnId', 'createdAt', 'updatedAt']);

// Human-readable labels for declaration fields
const FIELD_LABELS = {
  grossIncome: 'Gross income',
  employmentIncome: 'Employment income',
  businessIncome: 'Business income',
  pensionContribution: 'Pension contribution',
  lifeAssurance: 'Life assurance',
  nhfContribution: 'NHF contribution',
  rentPaidAnnual: 'Annual rent paid',
  nhisContribution: 'NHIS contribution',
  housingLoanInterest: 'Housing loan interest',
};

function formatDeclarationValue(key, value) {
  if (value === null || value === undefined) return '—';
  if (key in FIELD_LABELS) return formatCurrency(value);
  return String(value);
}

export default function ReturnDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTaxReturnById(id)
      .then(setDetail)
      .catch((err) => setError(err.message || 'Failed to load return.'));
  }, [id]);

  if (error) return <Shell><p className="form-error" style={{ margin: '24px' }}>{error}</p></Shell>;
  if (!detail) return <Shell><LoadingState /></Shell>;

  const { taxReturn, declaration, payment } = detail;
  if (!taxReturn) return <Shell><EmptyState title="Return not found" detail="Choose another filing from the dashboard." /></Shell>;

  const declarationEntries = Object.entries(declaration ?? {})
    .filter(([key]) => !SKIP_KEYS.has(key) && key in FIELD_LABELS);

  return (
    <Shell>
      <PageTitle title={`Filing detail — ${taxReturn.filingYear}`} detail="Read-only filing record." />
      <section className="content-grid">
        <Metric label="Status" value={<Badge status={taxReturn.filingStatus} />} />
        <Metric label="Gross income" value={formatCurrency(taxReturn.grossIncome)} />
        <Metric label="Tax payable" value={formatCurrency(taxReturn.taxPayable)} />
        <Metric label="Paid on" value={payment?.paidAt ? formatDate(payment.paidAt) : '—'} />
        <Card className="wide">
          <h2>Declaration</h2>
          <dl className="detail-list columns">
            {declarationEntries.map(([key, value]) => (
              <Fragment key={key}>
                <dt>{FIELD_LABELS[key]}</dt>
                <dd>{formatDeclarationValue(key, value)}</dd>
              </Fragment>
            ))}
          </dl>
        </Card>
      </section>
    </Shell>
  );
}
