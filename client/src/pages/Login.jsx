import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Shell } from '../components/Shell.jsx';
import { AuthPanel } from '../components/Layout.jsx';
import { Button, Field } from '../components/ui.jsx';
import { loginUser } from '../services/api.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login({ admin = false }) {
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