import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Shell } from '../components/Shell.jsx';
import { AuthPanel } from '../components/Layout.jsx';
import { Button, Field } from '../components/ui.jsx';
import { loginUser } from '../services/api.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login({ admin = false }) {
  const [values, setValues] = useState({
    email: admin ? 'admin@etax.test' : 'amina.yusuf@example.com',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
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
      <AuthPanel
        title={admin ? 'Administrator login' : 'Taxpayer login'}
        detail={
          admin
            ? 'Access the administrative dashboard to monitor filings and revenue.'
            : 'Welcome back. Sign in to manage your tax filings.'
        }
        hint="Test accounts use Password123 after database seeding."
      >
        <form onSubmit={onSubmit} className="form-grid" noValidate>
          <Field label="Email address">
            <input
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
            />
          </Field>

          <Field label="Password">
            <div className="password-wrapper">
              <input
                aria-label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={values.password}
                onChange={(e) => setValues({ ...values, password: e.target.value })}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          {error && <p className="form-error">{error}</p>}

          <Button disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Signing in…' : admin ? 'Sign in as Admin' : 'Sign in'}
          </Button>
        </form>
      </AuthPanel>
    </Shell>
  );
}
