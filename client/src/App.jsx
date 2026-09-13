import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireRole } from './components/Shell.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DeclarationForm from './pages/DeclarationForm.jsx';
import ComputationResult from './pages/ComputationResult.jsx';
import Payment from './pages/Payment.jsx';
import Documents from './pages/Documents.jsx';
import ReturnDetail from './pages/ReturnDetail.jsx';
import BankStatementUpload from './pages/BankStatementUpload.jsx';
import AdminOverview from './pages/admin/AdminOverview.jsx';
import TaxpayerList from './pages/admin/TaxpayerList.jsx';
import AdminTaxpayerDetail from './pages/admin/AdminTaxpayerDetail.jsx';
import RevenueReport from './pages/admin/RevenueReport.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<Login admin />} />
      <Route path="/dashboard" element={<RequireRole role="taxpayer"><Dashboard /></RequireRole>} />
      <Route path="/declare" element={<RequireRole role="taxpayer"><DeclarationForm /></RequireRole>} />
      <Route path="/bank-statements" element={<RequireRole role="taxpayer"><BankStatementUpload /></RequireRole>} />
      <Route path="/computation" element={<RequireRole role="taxpayer"><ComputationResult /></RequireRole>} />
      <Route path="/payment" element={<RequireRole role="taxpayer"><Payment /></RequireRole>} />
      <Route path="/documents" element={<RequireRole role="taxpayer"><Documents /></RequireRole>} />
      <Route path="/returns/:id" element={<RequireRole role="taxpayer"><ReturnDetail /></RequireRole>} />
      <Route path="/admin" element={<RequireRole role="admin"><AdminOverview /></RequireRole>} />
      <Route path="/admin/taxpayers" element={<RequireRole role="admin"><TaxpayerList /></RequireRole>} />
      <Route path="/admin/taxpayers/:id" element={<RequireRole role="admin"><AdminTaxpayerDetail /></RequireRole>} />
      <Route path="/admin/reports" element={<RequireRole role="admin"><RevenueReport /></RequireRole>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}