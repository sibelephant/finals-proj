import { useLocation } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';
import { Shell } from '../components/Shell.jsx';
import { PageTitle } from '../components/Layout.jsx';
import { Button, Card } from '../components/ui.jsx';
import { getAuthHeaders, getDocumentUrl } from '../services/api.js';

export default function Documents() {
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