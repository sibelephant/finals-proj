import { useState } from 'react';
import { BadgeCheck, Eye, EyeOff } from 'lucide-react';
import { Shell } from '../components/Shell.jsx';
import { AuthPanel } from '../components/Layout.jsx';
import { Button, Field, LinkButton } from '../components/ui.jsx';
import { registerUser } from '../services/api.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 30;
  if (password.length >= 12) score += 20;
  if (/[A-Z]/.test(password)) score += 20;
  if (/\d/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 10;
  return Math.min(100, score);
}

function strengthLabel(pct) {
  if (pct >= 90) return { text: 'Strong', color: '#2d6a4f' };
  if (pct >= 60) return { text: 'Good', color: '#52b788' };
  if (pct >= 30) return { text: 'Weak', color: '#9f6b1d' };
  return { text: '', color: 'transparent' };
}

export default function Register() {
  const [values, setValues] = useState({ fullName: '', email: '', password: '', phone: '', address: '' });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const strength = getStrength(values.password);
  const { text: strengthText, color: strengthColor } = strengthLabel(strength);

  function set(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

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
    try {
      const response = await registerUser(values);
      setSuccess(response.user);
    } catch (err) {
      setErrors({ _form: err.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <AuthPanel
        title="Create taxpayer account"
        detail="Your details are validated and a unique Tax Identification Number (TIN) is issued upon registration."
      >
        {success ? (
          <div className="success-box animate-in" style={{ marginTop: 24 }}>
            <BadgeCheck size={32} />
            <h2 style={{ margin: 0 }}>Account created!</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Your Tax Identification Number is{' '}
              <strong style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>{success.tin}</strong>.
              Keep this safe — you'll need it for all future filings.
            </p>
            <LinkButton to="/login" style={{ marginTop: 4 }}>Continue to sign in</LinkButton>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="form-grid" noValidate>
            <Field label="Full name" error={errors.fullName}>
              <input
                autoComplete="name"
                value={values.fullName}
                onChange={(e) => set('fullName', e.target.value)}
              />
            </Field>

            <Field label="Email address" error={errors.email}>
              <input
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </Field>

            <Field label="Password" error={errors.password}>
              <div className="password-wrapper">
                <input
                  aria-label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={values.password}
                  onChange={(e) => set('password', e.target.value)}
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
              {values.password && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="meter" style={{ flex: 1 }}>
                    <i style={{ width: `${strength}%`, background: strengthColor }} />
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: strengthColor, minWidth: 44 }}>
                    {strengthText}
                  </span>
                </div>
              )}
            </Field>

            <Field label="Phone number" error={errors.phone}>
              <input
                type="tel"
                autoComplete="tel"
                value={values.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </Field>

            <Field label="Contact address" error={errors.address}>
              <textarea
                autoComplete="street-address"
                value={values.address}
                onChange={(e) => set('address', e.target.value)}
              />
            </Field>

            {errors._form && <p className="form-error">{errors._form}</p>}

            <Button disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        )}
      </AuthPanel>
    </Shell>
  );
}
