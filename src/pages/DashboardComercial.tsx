import { useEffect, useState } from 'react';
import { supabase, Quote, Client } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  DollarSign,
  Users,
  FileText,
  Receipt,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Loader2,
  Plus,
  Eye,
} from 'lucide-react';

interface DashboardData {
  totalReceipts: number;
  totalQuotes: number;
  totalClients: number;
  totalValue: number;
  pendingCount: number;
  approvedCount: number;
  cancelledCount: number;
  expiredCount: number;
  recentQuotes: Quote[];
}

interface DashboardComercialProps {
  onPageChange: (page: string) => void;
}

export function DashboardComercial({ onPageChange }: DashboardComercialProps) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch quotes
      const { data: quotes } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch clients count
      const { count: totalClients } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch accounts receivable (receipts)
      const { data: receivables } = await supabase
        .from('accounts_receivable')
        .select('total_amount, received_amount, status')
        .eq('user_id', user.id);

      const totalReceipts = receivables?.reduce((sum, r) => sum + Number(r.received_amount), 0) || 0;

      // Calculate quote stats
      const pendingCount = quotes?.filter(q => q.status === 'pending').length || 0;
      const approvedCount = quotes?.filter(q => q.status === 'approved').length || 0;
      const cancelledCount = quotes?.filter(q => q.status === 'cancelled').length || 0;
      const expiredCount = quotes?.filter(q => q.status === 'expired').length || 0;

      const totalValue = quotes?.reduce((sum, q) => sum + Number(q.total_value), 0) || 0;

      setData({
        totalReceipts,
        totalQuotes: quotes?.length || 0,
        totalClients: totalClients || 0,
        totalValue,
        pendingCount,
        approvedCount,
        cancelledCount,
        expiredCount,
        recentQuotes: quotes?.slice(0, 5) || [],
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusConfig = (status: Quote['status']) => {
    const configs = {
      draft: { label: 'Rascunho', color: 'bg-slate-500', textColor: 'text-slate-400' },
      pending: { label: 'Pendente', color: 'bg-amber-500', textColor: 'text-amber-400' },
      approved: { label: 'Aprovado', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
      negotiation: { label: 'Negociação', color: 'bg-blue-500', textColor: 'text-blue-400' },
      cancelled: { label: 'Cancelado', color: 'bg-red-500', textColor: 'text-red-400' },
      expired: { label: 'Expirado', color: 'bg-orange-600', textColor: 'text-orange-400' },
    };
    return configs[status];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Comercial</h1>
          <p className="text-slate-400 mt-1">Visão geral de vendas e orçamentos</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 rounded-2xl p-6 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <Receipt className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <p className="text-emerald-300 text-sm">Total Recibos</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(data.totalReceipts)}</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-600/5 rounded-2xl p-6 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-cyan-500/20">
              <FileText className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <p className="text-cyan-300 text-sm">Total Orçamentos</p>
          <p className="text-2xl font-bold text-white mt-1">{data.totalQuotes}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600/20 to-blue-600/5 rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-blue-300 text-sm">Total Clientes</p>
          <p className="text-2xl font-bold text-white mt-1">{data.totalClients}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-600/20 to-amber-600/5 rounded-2xl p-6 border border-amber-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-amber-500/20">
              <DollarSign className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <p className="text-amber-300 text-sm">Valor Vendido</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(data.totalValue)}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Menu */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Menu Rápido</h3>
            <div className="space-y-3">
              <button
                onClick={() => onPageChange('quotes')}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/30 hover:border-cyan-500/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <FileText className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Orçamentos</p>
                    <p className="text-slate-400 text-sm">{data.totalQuotes} cadastrados</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onPageChange('accounts-receivable')}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-xl border border-emerald-500/30 hover:border-emerald-500/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Receipt className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Recibos</p>
                    <p className="text-slate-400 text-sm">{formatCurrency(data.totalReceipts)} recebido</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onPageChange('clients')}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-500/30 hover:border-blue-500/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Clientes</p>
                    <p className="text-slate-400 text-sm">{data.totalClients} cadastrados</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Quotes */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                Últimos Orçamentos
              </h3>
              <button
                onClick={() => onPageChange('quotes')}
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                Ver todos <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {data.recentQuotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mb-2 opacity-50" />
                <p>Nenhum orçamento ainda</p>
                <button
                  onClick={() => onPageChange('quotes')}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Criar primeiro orçamento
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentQuotes.map((quote) => {
                  const status = getStatusConfig(quote.status);
                  return (
                    <div
                      key={quote.id}
                      className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-10 rounded-full ${status.color}`} />
                        <div>
                          <p className="text-white font-medium">{quote.client_name}</p>
                          <p className="text-slate-400 text-sm">
                            {quote.number} • {formatDate(quote.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-white font-medium">{formatCurrency(quote.total_value)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${status.color} text-white`}>
                            {status.label}
                          </span>
                        </div>
                        <button
                          onClick={() => onPageChange('quotes')}
                          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Indicadores de Status
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 font-medium">Pendente</span>
            </div>
            <p className="text-3xl font-bold text-white">{data.pendingCount}</p>
          </div>

          <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Aprovado</span>
            </div>
            <p className="text-3xl font-bold text-white">{data.approvedCount}</p>
          </div>

          <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">Cancelado</span>
            </div>
            <p className="text-3xl font-bold text-white">{data.cancelledCount}</p>
          </div>

          <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              <span className="text-orange-400 font-medium">Expirado</span>
            </div>
            <p className="text-3xl font-bold text-white">{data.expiredCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
