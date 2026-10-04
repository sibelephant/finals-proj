import { useState } from 'react';
import { Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Shell } from '../components/Shell.jsx';
import { PageTitle } from '../components/Layout.jsx';
import { Button, Card, Field } from '../components/ui.jsx';
import { submitIncomeDeclaration } from '../services/api.js';

const CURRENT_YEAR = new Date().getFullYear();
const FILING_YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

const LEGACY_FIELDS = [
  ['grossIncome', 'Gross income (₦)', true],
  ['employmentIncome', 'Employment income (₦)', false],
  ['businessIncome', 'Business income (₦)', false],
  ['pensionContribution', 'Pension contribution — max 8% of gross (₦)', false],
  ['lifeAssurance', 'Life assurance premium (₦)', false],
  ['nhfContribution', 'NHF contribution (₦)', false],
];

const NTA_FIELDS = [
  ['grossIncome', 'Gross income (₦)', true],
  ['employmentIncome', 'Employment income (₦)', false],
  ['businessIncome', 'Business income (₦)', false],
  ['pensionContribution', 'Pension contribution (₦)', false],
  ['lifeAssurance', 'Life assurance premium (₦)', false],
  ['nhfContribution', 'NHF contribution (₦)', false],
  ['rentPaidAnnual', 'Annual rent paid — 20% relief, max ₦500k (₦)', false],
  ['nhisContribution', 'NHIS contribution (₦)', false],
  ['housingLoanInterest', 'Housing loan interest (₦)', false],
];

const EMPTY_VALUES = {
  filingYear: String(CURRENT_YEAR),
  grossIncome: '',
  employmentIncome: '',
  businessIncome: '',
  pensionContribution: '',
  lifeAssurance: '',
  nhfContribution: '',
  rentPaidAnnual: '',
  nhisContribution: '',
  housingLoanInterest: '',
};

export default function DeclarationForm() {
  const navigate = useNavigate();
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const isNTA = Number(values.filingYear) >= 2026;
  const fields = isNTA ? NTA_FIELDS : LEGACY_FIELDS;

  function set(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const next = {};
    const gross = Number(values.grossIncome);
    if (!gross || gross <= 0) next.grossIncome = 'Enter your gross income.';
    fields.forEach(([key]) => {
      const v = values[key];
      if (v !== '' && Number(v) < 0) next[key] = 'Amount cannot be negative.';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const response = await submitIncomeDeclaration(values);
      navigate('/computation', { state: response });
    } catch (err) {
      if (err.errors && Object.keys(err.errors).length) {
        setErrors(err.errors);
        setSubmitError('Please correct the highlighted fields.');
      } else {
        setSubmitError(err.message || 'Submission failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <PageTitle
        title="Income declaration"
        detail="Enter your annual income and allowable deductions. Tax is computed server-side."
      />

      <Card className="form-card">
        <form onSubmit={onSubmit} className="form-grid two-col" noValidate>

          {/* Filing year */}
          <Field label="Filing year">
            <select value={values.filingYear} onChange={(e) => set('filingYear', e.target.value)}>
              {FILING_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y} — {y >= 2026 ? 'NTA 2025 regime' : 'Legacy PITA'}
                </option>
              ))}
            </select>
          </Field>

          {/* Regime notice */}
          <div className={`regime-notice span-two ${isNTA ? 'nta' : 'legacy'}`}>
            <Info size={16} />
            <span>
              {isNTA
                ? 'NTA 2025 regime: CRA of ₦800k + 20% of gross income applies. Rent relief, NHIS, and housing loan interest are additional deductions.'
                : 'Legacy PITA regime: CRA of ₦200k + 20% of gross income applies. Pension, life assurance, and NHF contributions are deductible.'}
            </span>
          </div>

          {/* Income & deduction fields */}
          {fields.map(([key, label, required]) => (
            <Field key={key} label={label + (required ? ' *' : '')} error={errors[key]}>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={values[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </Field>
          ))}

          {submitError && <p className="form-error span-two">{submitError}</p>}

          <Button className="span-two" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Calculating…' : 'Calculate tax'}
          </Button>
        </form>
      </Card>
    </Shell>
  );
}
