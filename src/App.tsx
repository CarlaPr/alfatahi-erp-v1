import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DashboardComercial } from './pages/DashboardComercial';
import { Clients } from './pages/Clients';
import { Suppliers } from './pages/Suppliers';
import { WorkOrders } from './pages/WorkOrders';
import { AccountsPayable } from './pages/AccountsPayable';
import { AccountsReceivable } from './pages/AccountsReceivable';
import { CashFlow } from './pages/CashFlow';
import { DRE } from './pages/DRE';
import { Losses } from './pages/Losses';
import { BankAccounts } from './pages/BankAccounts';
import { Settings } from './pages/Settings';
import { Quotes } from './pages/Quotes';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading, isGestao } = useAuth();
  const [currentPage, setCurrentPage] = useState<string | null>(null);

  useEffect(() => {
    if (user && !currentPage) {
      setCurrentPage(isGestao ? 'dashboard' : 'dashboard-comercial');
    }
  }, [user, currentPage, isGestao]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!currentPage) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'dashboard-comercial':
        return <DashboardComercial onPageChange={setCurrentPage} />;
      case 'clients':
        return <Clients />;
      case 'suppliers':
        return <Suppliers />;
      case 'work-orders':
        return <WorkOrders onPageChange={setCurrentPage} />;
      case 'quotes':
        return <Quotes onPageChange={setCurrentPage} />;
      case 'accounts-payable':
        return <AccountsPayable />;
      case 'accounts-receivable':
        return <AccountsReceivable />;
      case 'cash-flow':
        return <CashFlow />;
      case 'dre':
        return <DRE />;
      case 'losses':
        return <Losses />;
      case 'bank-accounts':
        return <BankAccounts />;
      case 'settings':
        return <Settings />;
      default:
        return isGestao ? <Dashboard /> : <DashboardComercial onPageChange={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
