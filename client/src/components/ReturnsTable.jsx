import { Link } from 'react-router-dom';
import { Badge } from './ui.jsx';
import { formatCurrency, formatDate } from '../utils/format.js';

export default function ReturnsTable({ returns, admin = false }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Year</th>
            <th>Status</th>
            <th>Gross income</th>
            <th>Tax payable</th>
            <th>Submitted</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {returns.map((item) => (
            <tr key={item.id}>
              <td>{item.filingYear}</td>
              <td><Badge status={item.filingStatus} /></td>
              <td>{formatCurrency(item.grossIncome)}</td>
              <td>{formatCurrency(item.taxPayable)}</td>
              <td>{formatDate(item.submittedAt)}</td>
              <td><Link to={admin ? `/admin/taxpayers/${item.userId}` : `/returns/${item.id}`}>View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}