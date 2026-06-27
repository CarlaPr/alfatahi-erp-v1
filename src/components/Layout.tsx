import { useState, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Truck,
  ClipboardList,
  CreditCard,
  Wallet,
  TrendingDown,
  BarChart3,
  PiggyBank,
  Banknote,
  LogOut,
  Menu,
  Building2,
  ChevronRight,
  Settings,
  FileText,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const allMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { id: 'dashboard-comercial', label: 'Dashboard Comercial', icon: TrendingDown, module: 'dashboard-comercial' },
  { id: 'work-orders', label: 'Ordens de Serviço', icon: ClipboardList, module: 'work-orders' },
  { id: 'clients', label: 'Clientes', icon: Users, module: 'clients' },
  { id: 'suppliers', label: 'Fornecedores', icon: Truck, module: 'suppliers' },
  { id: 'quotes', label: 'Orçamentos', icon: FileText, module: 'quotes' },
  { id: 'accounts-payable', label: 'Contas a Pagar', icon: CreditCard, module: 'accounts-payable' },
  { id: 'accounts-receivable', label: 'Contas a Receber', icon: Wallet, module: 'accounts-receivable' },
  { id: 'cash-flow', label: 'Fluxo de Caixa', icon: Banknote, module: 'cash-flow' },
  { id: 'losses', label: 'Perdas/Desperdício', icon: TrendingDown, module: 'losses' },
  { id: 'dre', label: 'DRE', icon: BarChart3, module: 'dre' },
  { id: 'bank-accounts', label: 'Contas Bancárias', icon: PiggyBank, module: 'bank-accounts' },
];

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const { profile, signOut, canAccess } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = allMenuItems.filter(item => canAccess(item.module));

  const handleNavClick = (pageId: string) => {
    onPageChange(pageId);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-slate-800 border-r border-slate-700 z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Vidraçaria</h1>
                <p className="text-xs text-slate-400">Alfa Tahi ERP</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : ''}`} />
                      <span className="font-medium">{item.label}</span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-slate-700/50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {profile?.company_name?.charAt(0) || 'V'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.company_name || 'Vidraçaria'}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-400 truncate">
                    {profile?.owner_name || 'Administrador'}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    profile?.role === 'gestao'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {profile?.role === 'gestao' ? 'GESTÃO' : 'VENDAS'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onPageChange('settings')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={signOut}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 hidden lg:block" />

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500">Hoje</p>
                <p className="text-sm font-medium text-white">
                  {new Date().toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
