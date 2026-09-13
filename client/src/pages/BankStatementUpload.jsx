import { useEffect, useState } from 'react';
import { Trash2, Upload } from 'lucide-react';
import { Shell } from '../components/Shell.jsx';
import { PageTitle } from '../components/Layout.jsx';
import { Badge, Button, Card, EmptyState, LoadingState } from '../components/ui.jsx';
import { deleteBankTransaction, getBankTransactions, uploadBankStatement } from '../services/api.js';
import { formatCurrency, formatDate } from '../utils/format.js';

export default function BankStatementUpload() {
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