import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { Shell } from '../components/Shell.jsx';
import { AuthPanel } from '../components/Layout.jsx';
import { Button, Field, LinkButton } from '../components/ui.jsx';
import { registerUser } from '../services/api.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
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