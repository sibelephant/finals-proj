import { ArrowRight, UserPlus } from 'lucide-react';
import { Shell } from '../components/Shell.jsx';
import { LinkButton } from '../components/ui.jsx';

export default function Landing() {
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