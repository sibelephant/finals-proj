import { useEffect, useRef, useState } from 'react';
import { FileSpreadsheet, Trash2, Upload, X } from 'lucide-react';
import { Shell } from '../components/Shell.jsx';
import { PageTitle } from '../components/Layout.jsx';
import { Badge, Button, Card, EmptyState, LoadingState } from '../components/ui.jsx';
import { deleteBankTransaction, getBankTransactions, uploadBankStatement } from '../services/api.js';
import { formatCurrency, formatDate } from '../utils/format.js';

export default function BankStatementUpload() {
  const [file, setFile] = useState(null);
  const [dragover, setDragover] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState(null);
  const [loadError, setLoadError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    getBankTransactions()
      .then(setTransactions)
      .catch((err) => setLoadError(err.message || 'Failed to load transactions.'));
  }, []);

  function onFileSelect(selected) {
    if (selected && selected.name.endsWith('.csv')) {
      setFile(selected);
      setError('');
    } else if (selected) {
      setError('Only CSV files are supported.');
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragover(false);
    onFileSelect(e.dataTransfer.files[0]);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError('');
    setResult(null);
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
    try {
      await deleteBankTransaction(id);
      setTransactions(await getBankTransactions());
    } catch (err) {
      setLoadError(err.message || 'Failed to load transactions.');
    }
  }

  return (
    <Shell>
      <PageTitle
        title="Bank statement upload"
        detail="Upload a CSV bank statement to extract and categorise your income for filing."
      />

      <section className="content-grid">
        <Card>
          <h2>Upload CSV</h2>

          {/* Drop zone */}
          <div
            className={`upload-zone ${dragover ? 'dragover' : ''}`}
            style={{ marginBottom: 14 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
            onDragLeave={() => setDragover(false)}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            aria-label="Upload CSV file"
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          >
            <FileSpreadsheet size={32} />
            {file ? (
              <p><strong>{file.name}</strong></p>
            ) : (
              <>
                <p><strong>Click to browse</strong> or drag and drop</p>
                <p>CSV files only</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={(e) => onFileSelect(e.target.files[0])}
            />
          </div>

          {file && (
            <div className="upload-file-name" style={{ marginBottom: 14 }}>
              <FileSpreadsheet size={14} />
              {file.name}
              <button
                type="button"
                onClick={() => setFile(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 2 }}
                aria-label="Remove file"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <Button disabled={!file || uploading} onClick={handleUpload} style={{ width: '100%' }}>
            {uploading ? 'Processing…' : <><Upload size={16} /> Upload &amp; parse</>}
          </Button>

          {error && <p className="form-error" style={{ marginTop: 12 }}>{error}</p>}

          {result && (
            <div className="success-box animate-in" style={{ marginTop: 16 }}>
              <strong>{result.summary.totalTransactions} transactions parsed</strong>
              <span>Credits: {formatCurrency(result.summary.totalCredits)}</span>
              <span>Debits: {formatCurrency(result.summary.totalDebits)}</span>
              {Object.entries(result.summary.categorizedIncome).length > 0 && (
                <div className="category-breakdown">
                  <strong>Categorised income:</strong>
                  {Object.entries(result.summary.categorizedIncome).map(([cat, amount]) => (
                    <span key={cat}>{cat}: {formatCurrency(amount)}</span>
                  ))}
                </div>
              )}
              {result.errors?.length > 0 && (
                <small className="parse-errors">{result.errors.length} row(s) skipped due to parse errors.</small>
              )}
            </div>
          )}
        </Card>

        <Card className="wide">
          <h2>Imported transactions</h2>
          {loadError ? (
            <p className="form-error">{loadError}</p>
          ) : !transactions ? (
            <LoadingState />
          ) : transactions.length === 0 ? (
            <EmptyState
              title="No transactions yet"
              detail="Upload a CSV bank statement to extract and view your transactions here."
            />
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
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(t.transactionDate)}</td>
                      <td className="narration-cell">{t.narration}</td>
                      <td>{t.debit ? formatCurrency(t.debit) : '—'}</td>
                      <td style={{ fontWeight: t.credit ? 600 : 400 }}>
                        {t.credit ? formatCurrency(t.credit) : '—'}
                      </td>
                      <td>{t.category ? <Badge status={t.category} /> : '—'}</td>
                      <td>
                        <Button
                          variant="ghost"
                          className="btn-danger"
                          onClick={() => handleDelete(t.id)}
                          aria-label="Delete transaction"
                        >
                          <Trash2 size={15} />
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
