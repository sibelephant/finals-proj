import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import { Button } from './ui.jsx';

export function Shell({ children }) {
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
