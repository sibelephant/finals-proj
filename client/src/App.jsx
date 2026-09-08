import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CreditCard,
  Download,
  FileText,
  LogOut,
  Search,
  ShieldCheck,
  Upload,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useAuth } from './auth/AuthContext.jsx';
import { Badge, Button, Card, EmptyState, Field, LinkButton, LoadingState } from './components/ui.jsx';
import {
  confirmPayment,
  deleteBankTransaction,
  getAdminStats,
  getBankTransactions,
  getTaxpayerDetails,
  getTaxpayers,
  getTaxReturnById,
  getAuthHeaders,
  getDocumentUrl,
  getTaxReturns,
  loginUser,
  registerUser,
  submitIncomeDeclaration,
  uploadBankStatement,
} from './services/api.js';
import { formatCurrency, formatDate } from './utils/format.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Shell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <header className="topbar">
        <Link className="brand" to="/">
          <ShieldCheck size={26} />
          <span>E-Tax Filing</span>
        </Link>
        <nav>
          {user?.role === 'taxpayer' ? <Link to="/dashboard">Dashboard</Link> : null}
          {user?.role === 'admin' ? <Link to="/admin">Admin</Link> : null}
          {user ? (
            <Button
              variant="ghost"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              <LogOut size={18} /> Logout
            </Button>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

function RequireRole({ role, children }) {
  const { role: currentRole } = useAuth();
  const location = useLocation();
  if (!currentRole) {
    return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace state={{ from: location }} />;
  }
  if (currentRole !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function Landing() {
  return (
    <Shell>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Nigeria Personal Income Tax Filing</p>
          <h1>File, track, and clear your PIT return in one guided portal.</h1>
          <p>
            A final-year project simulation for taxpayers and revenue administrators, built around clear filing
            steps, status tracking, and server-ready service contracts.
          </p>
          <div className="actions">
            <LinkButton to="/register">
              <UserPlus size={18} /> Register
            </LinkButton>
            <LinkButton to="/login" variant="secondary">
              Login <ArrowRight size={18} />
            </LinkButton>
          </div>
        </div>
        <div className="hero-panel">
          <div>
            <span>Current filing year</span>
            <strong>2026</strong>
          </div>
          <div>
            <span>API status</span>
            <strong>Live server</strong>
          </div>
          <div>
            <span>Portal access</span>
            <strong>Taxpayer + Admin</strong>
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Register() {
  const [values, setValues] = useState({ fullName: '', email: '', password: '', phone: '', address: '' });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const strength = Math.min(100, values.password.length * 12 + (/[A-Z]/.test(values.password) ? 20 : 0) + (/\d/.test(values.password) ? 20 : 0));

  function validate() {
    const next = {};
    if (!values.fullName.trim()) next.fullName = 'Enter your full name.';
    if (!emailPattern.test(values.email)) next.email = 'Enter a valid email address.';
    if (values.password.length < 8) next.password = 'Use at least 8 characters.';
    if (!values.phone.trim()) next.phone = 'Enter a phone number.';
    if (!values.address.trim()) next.address = 'Enter a contact address.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const response = await registerUser(values);
    setSuccess(response.user);
    setLoading(false);
  }

  return (
    <Shell>
      <AuthPanel title="Create taxpayer account" detail="Your details are validated before a TIN is issued by the server.">
        {success ? (
          <div className="success-box">
            <BadgeCheck size={28} />
            <h2>Registration saved</h2>
            <p>Your Tax Identification Number is <strong>{success.tin}</strong>.</p>
            <LinkButton to="/login">Continue to Login</LinkButton>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="form-grid">
            <Field label="Full name" error={errors.fullName}>
              <input value={values.fullName} onChange={(e) => setValues({ ...values, fullName: e.target.value })} />
            </Field>
            <Field label="Email address" error={errors.email}>
              <input value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />
            </Field>
            <Field label="Password" error={errors.password}>
              <input type="password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} />
              <span className="meter"><i style={{ width: `${strength}%` }} /></span>
            </Field>
            <Field label="Phone number" error={errors.phone}>
              <input value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} />
            </Field>
            <Field label="Address" error={errors.address}>
              <textarea value={values.address} onChange={(e) => setValues({ ...values, address: e.target.value })} />
            </Field>
            <Button disabled={loading}>{loading ? 'Creating account...' : 'Register'}</Button>
          </form>
        )}
      </AuthPanel>
    </Shell>
  );
}

function Login({ admin = false }) {
  const [values, setValues] = useState({ email: admin ? 'admin@etax.test' : 'amina.yusuf@example.com', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(event) {
    event.preventDefault();
    if (!emailPattern.test(values.email) || !values.password) {
      setError('Enter a valid email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await loginUser(values.email, values.password, admin ? 'admin' : 'taxpayer');
      setSession(response);
      navigate(admin ? '/admin' : '/dashboard');
    } catch (caught) {
      setError(caught.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <AuthPanel title={admin ? 'Administrator login' : 'Taxpayer login'} detail="Seeded test accounts use Password123 after database seeding.">
        <form onSubmit={onSubmit} className="form-grid">
          <Field label="Email address">
            <input value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />
          </Field>
          <Field label="Password">
            <input type="password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} />
          </Field>
          {error ? <p className="form-error">{error}</p> : null}
          <Button disabled={loading}>{loading ? 'Checking...' : 'Login'}</Button>
        </form>
      </AuthPanel>
    </Shell>
  );
}

function AuthPanel({ title, detail, children }) {
  return (
    <section className="auth-layout">
      <Card className="auth-card">
        <p className="eyebrow">Secure portal</p>
        <h1>{title}</h1>
        <p>{detail}</p>
        {children}
      </Card>
    </section>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [returns, setReturns] = useState(null);
  useEffect(() => {
    getTaxReturns(user.id).then(setReturns);
  }, [user.id]);

  return (
    <Shell>
      <PageTitle title="Taxpayer dashboard" detail="Track filings, continue drafts, or start a new annual return." action={<><LinkButton to="/bank-statements" variant="secondary"><Upload size={18} /> Upload Statement</LinkButton><LinkButton to="/declare"><FileText size={18} /> File New Return</LinkButton></>} />
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
          {!returns ? <LoadingState /> : returns.length === 0 ? <EmptyState title="No filings yet" detail="Start a new return when you are ready." /> : <ReturnsTable returns={returns} />}
        </Card>
      </section>
    </Shell>
  );
}

function ReturnsTable({ returns, admin = false }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Year</th>
            <th>Status</th>
            <th>Gross income</th>
            <th>Tax payable</th>
            <th>Submitted</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {returns.map((item) => (
            <tr key={item.id}>
              <td>{item.filingYear}</td>
              <td><Badge status={item.filingStatus} /></td>
              <td>{formatCurrency(item.grossIncome)}</td>
              <td>{formatCurrency(item.taxPayable)}</td>
              <td>{formatDate(item.submittedAt)}</td>
              <td><Link to={admin ? `/admin/taxpayers/${item.userId}` : `/returns/${item.id}`}>View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeclarationForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({
    grossIncome: '',
    employmentIncome: '',
    businessIncome: '',
    pensionContribution: '',
    lifeAssurance: '',
    nhfContribution: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next = {};
    const gross = Number(values.grossIncome);
    Object.entries(values).forEach(([key, value]) => {
      if (value !== '' && Number(value) < 0) next[key] = 'Amount cannot be negative.';
    });
    if (!gross || gross <= 0) next.grossIncome = 'Enter your gross income.';
    if (Number(values.employmentIncome || 0) + Number(values.businessIncome || 0) > gross) {
      next.businessIncome = 'Income parts cannot exceed gross income.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const response = await submitIncomeDeclaration({ ...values, userId: user.id });
    navigate('/computation', { state: response });
  }

  return (
    <Shell>
      <PageTitle title="Income declaration" detail="Enter annual income and deductions. The server computes the tax result." />
      <Card className="form-card">
        <form onSubmit={onSubmit} className="form-grid two-col">
          {[
            ['grossIncome', 'Gross income'],
            ['employmentIncome', 'Employment income'],
            ['businessIncome', 'Business income'],
            ['pensionContribution', 'Pension contribution'],
            ['lifeAssurance', 'Life assurance'],
            ['nhfContribution', 'NHF contribution'],
          ].map(([key, label]) => (
            <Field key={key} label={label} error={errors[key]}>
              <input type="number" min="0" value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
            </Field>
          ))}
          <Button className="span-two" disabled={loading}>{loading ? 'Calculating...' : 'Calculate'}</Button>
        </form>
      </Card>
    </Shell>
  );
}

function ComputationResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state ?? {};
  const result = data.computedResult;

  if (!result) return <Navigate to="/declare" replace />;

  return (
    <Shell>
      <PageTitle title="Computation result" detail="Returned by the API. No tax calculation runs in the browser." />
      <section className="content-grid">
        <Metric label="CRA" value={formatCurrency(result.cra)} />
        <Metric label="Deductions" value={formatCurrency(result.totalDeductions)} />
        <Metric label="Taxable income" value={formatCurrency(result.taxableIncome)} />
        <Metric label="Effective rate" value={`${result.effectiveRate}%`} />
        <Card className="wide">
          <h2>Graduated band breakdown</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Band</th><th>Rate</th><th>Amount taxed</th><th>Tax</th></tr></thead>
              <tbody>
                {result.bandBreakdown.map((band) => (
                  <tr key={band.band}>
                    <td>{band.band}</td>
                    <td>{band.rate}%</td>
                    <td>{formatCurrency(band.amountTaxedInBand)}</td>
                    <td>{formatCurrency(band.taxForBand)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="total-row">
            <span>Net tax payable</span>
            <strong>{formatCurrency(result.taxPayable)}</strong>
          </div>
          <Button onClick={() => navigate('/payment', { state: { taxReturn: data.taxReturn, amount: result.taxPayable } })}>
            <CreditCard size={18} /> Proceed to Payment
          </Button>
        </Card>
      </section>
    </Shell>
  );
}

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState(null);
  const amount = location.state?.amount;
  const taxReturn = location.state?.taxReturn;
  if (!amount) return <Navigate to="/dashboard" replace />;

  async function pay() {
    setLoading(true);
    const response = await confirmPayment({ taxReturnId: taxReturn?.id, amount });
    setPayment(response);
    setLoading(false);
  }

  return (
    <Shell>
      <PageTitle title="Payment simulation" detail="This screen confirms a simulated payment without connecting to a payment gateway." />
      <Card className="payment-card">
        {payment ? (
          <div className="success-box">
            <BadgeCheck size={34} />
            <h2>Payment confirmed</h2>
            <p>Reference: <strong>{payment.paymentReference}</strong></p>
            <Button onClick={() => navigate('/documents', { state: { payment, taxReturn, amount } })}>View Receipt and TCC</Button>
          </div>
        ) : (
          <>
            <span className="amount-label">Amount due</span>
            <strong className="amount">{formatCurrency(amount)}</strong>
            <Button onClick={pay} disabled={loading}>{loading ? 'Confirming...' : 'Confirm Payment'}</Button>
          </>
        )}
      </Card>
    </Shell>
  );
}

function Documents() {
  const location = useLocation();
  const returnId = location.state?.taxReturn?.id;
  async function download(type) {
    const response = await fetch(getDocumentUrl(returnId, type), { headers: getAuthHeaders() });
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}-${returnId}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Shell>
      <PageTitle title="Receipt and TCC" detail="Download generated PDF documents for this paid tax return." />
      <section className="content-grid">
        <Card>
          <Download size={26} />
          <h2>Receipt ready</h2>
          <p>Payment reference: {location.state?.payment?.paymentReference ?? 'Pending payment'}</p>
          <Button disabled={!returnId} onClick={() => download('receipt')}>Download Receipt</Button>
        </Card>
        <Card>
          <FileText size={26} />
          <h2>TCC ready</h2>
          <p>Tax Clearance Certificate generated from the paid return.</p>
          <Button disabled={!returnId} onClick={() => download('tcc')}>Download TCC</Button>
        </Card>
      </section>
    </Shell>
  );
}

function ReturnDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  useEffect(() => {
    getTaxReturnById(id).then(setDetail);
  }, [id]);
  if (!detail) return <Shell><LoadingState /></Shell>;
  const { taxReturn, declaration, payment } = detail;
  if (!taxReturn) return <Shell><EmptyState title="Return not found" detail="Choose another filing from the dashboard." /></Shell>;
  return (
    <Shell>
      <PageTitle title={`Filing detail - ${taxReturn.filingYear}`} detail="Read-only filing record." />
      <section className="content-grid">
        <Metric label="Status" value={<Badge status={taxReturn.filingStatus} />} />
        <Metric label="Gross income" value={formatCurrency(taxReturn.grossIncome)} />
        <Metric label="Tax payable" value={formatCurrency(taxReturn.taxPayable)} />
        <Metric label="Paid on" value={formatDate(payment?.paidAt)} />
        <Card className="wide">
          <h2>Declaration</h2>
          <dl className="detail-list columns">
            {Object.entries(declaration ?? {}).filter(([key]) => !['id', 'taxReturnId'].includes(key)).map(([key, value]) => (
              <Fragment key={key}><dt>{key.replace(/([A-Z])/g, ' $1')}</dt><dd>{formatCurrency(value)}</dd></Fragment>
            ))}
          </dl>
        </Card>
      </section>
    </Shell>
  );
}

function AdminOverview() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    getAdminStats().then(setStats);
  }, []);
  return (
    <Shell>
      <PageTitle title="Administrator overview" detail="Monitor compliance, revenue, and taxpayer activity." />
      {!stats ? <LoadingState /> : (
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

function TaxpayerList() {
  const [taxpayers, setTaxpayers] = useState(null);
  const [query, setQuery] = useState('');
  useEffect(() => {
    getTaxpayers().then(setTaxpayers);
  }, []);
  const filtered = useMemo(() => (taxpayers ?? []).filter((item) => `${item.fullName} ${item.email} ${item.tin}`.toLowerCase().includes(query.toLowerCase())), [query, taxpayers]);
  return (
    <Shell>
      <PageTitle title="Taxpayer list" detail="Search and inspect registered taxpayers." />
      <Card>
        <div className="search-box"><Search size={18} /><input placeholder="Search by name, email, or TIN" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        {!taxpayers ? <LoadingState /> : filtered.length === 0 ? <EmptyState title="No taxpayers found" detail="Adjust the search term." /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>TIN</th><th>Email</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{filtered.map((user) => (
                <tr key={user.id}>
                  <td>{user.fullName}</td><td>{user.tin}</td><td>{user.email}</td><td><Badge status={user.complianceStatus} /></td><td><Link to={`/admin/taxpayers/${user.id}`}>View</Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>
    </Shell>
  );
}

function AdminTaxpayerDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  useEffect(() => {
    getTaxpayerDetails(id).then(setDetail);
  }, [id]);
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
          {detail.returns.length ? <ReturnsTable returns={detail.returns} admin /> : <EmptyState title="No filings" detail="This taxpayer has no returns yet." />}
        </Card>
      </section>
    </Shell>
  );
}

function RevenueReport() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    getAdminStats().then(setStats);
  }, []);
  const max = Math.max(...(stats?.revenueByPeriod ?? [{ amount: 1 }]).map((item) => item.amount), 1);
  return (
    <Shell>
      <PageTitle title="Revenue report" detail="Mock monthly payment totals." />
      <Card>
        {!stats ? <LoadingState /> : (
          <div className="bar-chart">
            {stats.revenueByPeriod.map((item) => (
              <div className="bar-item" key={item.period}>
                <div className="bar" style={{ height: `${Math.max(8, (item.amount / max) * 180)}px` }}><span>{formatCurrency(item.amount)}</span></div>
                <strong>{item.period}</strong>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Shell>
  );
}

function BankStatementUpload() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState(null);

  useEffect(() => {
    getBankTransactions().then(setTransactions);
  }, []);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const data = await uploadBankStatement(file);
      setResult(data);
      setTransactions(await getBankTransactions());
      setFile(null);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    await deleteBankTransaction(id);
    setTransactions(await getBankTransactions());
  }

  return (
    <Shell>
      <PageTitle title="Bank statement upload" detail="Upload a CSV bank statement to extract and categorise your income for filing." />
      <section className="content-grid">
        <Card>
          <h2>Upload CSV</h2>
          <div className="upload-area">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <Button disabled={!file || uploading} onClick={handleUpload}>
              {uploading ? 'Processing...' : <><Upload size={18} /> Upload & Parse</>}
            </Button>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          {result ? (
            <div className="success-box">
              <strong>{result.summary.totalTransactions} transactions parsed</strong>
              <span>Total credits: {formatCurrency(result.summary.totalCredits)}</span>
              <span>Total debits: {formatCurrency(result.summary.totalDebits)}</span>
              {Object.entries(result.summary.categorizedIncome).length > 0 ? (
                <div className="category-breakdown">
                  <strong>Categorised income:</strong>
                  {Object.entries(result.summary.categorizedIncome).map(([cat, amount]) => (
                    <span key={cat}>{cat}: {formatCurrency(amount)}</span>
                  ))}
                </div>
              ) : null}
              {result.errors ? <small className="parse-errors">{result.errors.length} row(s) skipped due to parse errors.</small> : null}
            </div>
          ) : null}
        </Card>
        <Card className="wide">
          <h2>Imported transactions</h2>
          {!transactions ? <LoadingState /> : transactions.length === 0 ? (
            <EmptyState title="No transactions yet" detail="Upload a CSV bank statement to get started." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Narration</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Category</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td>{formatDate(t.transactionDate)}</td>
                      <td className="narration-cell">{t.narration}</td>
                      <td>{t.debit ? formatCurrency(t.debit) : '-'}</td>
                      <td>{t.credit ? formatCurrency(t.credit) : '-'}</td>
                      <td>{t.category ? <Badge status={t.category} /> : '-'}</td>
                      <td>
                        <Button variant="ghost" onClick={() => handleDelete(t.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </Shell>
  );
}

function Metric({ label, value }) {
  return <Card className="metric"><span>{label}</span><strong>{value}</strong></Card>;
}

function PageTitle({ title, detail, action }) {
  return (
    <section className="page-title">
      <div><h1>{title}</h1><p>{detail}</p></div>
      {action}
    </section>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<Login admin />} />
      <Route path="/dashboard" element={<RequireRole role="taxpayer"><Dashboard /></RequireRole>} />
      <Route path="/declare" element={<RequireRole role="taxpayer"><DeclarationForm /></RequireRole>} />
      <Route path="/bank-statements" element={<RequireRole role="taxpayer"><BankStatementUpload /></RequireRole>} />
      <Route path="/computation" element={<RequireRole role="taxpayer"><ComputationResult /></RequireRole>} />
      <Route path="/payment" element={<RequireRole role="taxpayer"><Payment /></RequireRole>} />
      <Route path="/documents" element={<RequireRole role="taxpayer"><Documents /></RequireRole>} />
      <Route path="/returns/:id" element={<RequireRole role="taxpayer"><ReturnDetail /></RequireRole>} />
      <Route path="/admin" element={<RequireRole role="admin"><AdminOverview /></RequireRole>} />
      <Route path="/admin/taxpayers" element={<RequireRole role="admin"><TaxpayerList /></RequireRole>} />
      <Route path="/admin/taxpayers/:id" element={<RequireRole role="admin"><AdminTaxpayerDetail /></RequireRole>} />
      <Route path="/admin/reports" element={<RequireRole role="admin"><RevenueReport /></RequireRole>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
