import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import { Button } from './ui.jsx';

export function Shell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function navLink(to, label) {
    const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
    return (
      <Link to={to} className={isActive ? 'active' : ''}>
        {label}
      </Link>
    );
  }

  return (
    <div>
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-icon" aria-hidden="true">
            <ShieldCheck size={18} />
          </span>
          <span>E-Tax Filing</span>
        </Link>

        <nav aria-label="Main navigation">
          {user?.role === 'taxpayer' && (
            <>
              {navLink('/dashboard', 'Dashboard')}
              {navLink('/declare', 'File Return')}
              {navLink('/bank-statements', 'Bank Statements')}
              {navLink('/documents', 'Documents')}
            </>
          )}
          {user?.role === 'admin' && (
            <>
              {navLink('/admin', 'Overview')}
              {navLink('/admin/taxpayers', 'Taxpayers')}
              {navLink('/admin/reports', 'Reports')}
            </>
          )}
          {user ? (
            <Button
              variant="ghost"
              onClick={() => {
                logout();
                navigate('/');
              }}
              style={{ marginLeft: 4 }}
            >
              <LogOut size={16} /> Sign out
            </Button>
          ) : (
            <>
              {navLink('/login', 'Sign in')}
              <Link
                to="/register"
                className={`btn btn-primary ${location.pathname === '/register' ? 'active' : ''}`}
                style={{ minHeight: 36, padding: '0 14px', fontSize: '0.88rem' }}
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

export function RequireRole({ role, children }) {
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
