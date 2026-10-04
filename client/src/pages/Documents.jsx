import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, FileCheck, FileText, Info } from 'lucide-react';
import { Shell } from '../components/Shell.jsx';
import { PageTitle } from '../components/Layout.jsx';
import { Button, Card } from '../components/ui.jsx';
import { getAuthHeaders, getDocumentUrl } from '../services/api.js';

async function downloadFile(returnId, type) {
  const response = await fetch(getDocumentUrl(returnId, type), { headers: getAuthHeaders() });
  if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${type}-${returnId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function DocCard({ icon, title, description, disabled, onDownload }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      await onDownload();
    } catch (err) {
      setError(err.message || 'Download failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="doc-card">
      <div className="doc-card-icon">{icon}</div>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
        {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}
        <Button disabled={disabled || loading} onClick={handleClick}>
          <Download size={16} /> {loading ? 'Generating…' : 'Download PDF'}
        </Button>
      </div>
    </Card>
  );
}

export default function Documents() {
  const location = useLocation();
  const returnId = location.state?.taxReturn?.id;
  const paymentRef = location.state?.payment?.paymentReference;

  return (
    <Shell>
      <PageTitle
        title="Your documents"
        detail="Download your Tax Payment Receipt and Tax Clearance Certificate for this return."
      />

      <section className="content-grid">
        {!returnId && (
          <div className="notice-box span-two">
            <Info size={16} />
            <span>
              Documents are generated after payment. File a return and confirm your payment to
              unlock your receipt and TCC.
            </span>
          </div>
        )}
        <DocCard
          icon={<FileCheck size={24} />}
          title="Tax Payment Receipt"
          description={
            paymentRef
              ? `Payment reference: ${paymentRef}`
              : 'Generated after a confirmed payment.'
          }
          disabled={!returnId}
          onDownload={() => downloadFile(returnId, 'receipt')}
        />
        <DocCard
          icon={<FileText size={24} />}
          title="Tax Clearance Certificate"
          description="Confirms your tax obligations are settled for the filing year. Valid for 3 years."
          disabled={!returnId}
          onDownload={() => downloadFile(returnId, 'tcc')}
        />
      </section>
    </Shell>
  );
}
