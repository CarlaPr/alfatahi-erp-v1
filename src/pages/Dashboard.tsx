import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target,
  Percent,
  PiggyBank,
  CreditCard,
  Wallet,
  Loader2,
} from 'lucide-react';

interface DashboardData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingReceivables: number;
  pendingPayables: number;
  overdueReceivables: number;
  overduePayables: number;
  totalClients: number;
  activeWorkOrders: number;
  completedWorkOrders: number;
  totalLosses: number;
  monthlyRevenue: { month: string; revenue: number; expenses: number }[];
  receivableByCategory: { category: string; amount: number }[];
  payableByCategory: { category: string; amount: number }[];
  workOrdersByStatus: { status: string; count: number }[];
  topServices: { service: string; revenue: number; profit: number; margin: number }[];
}

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Fetch accounts receivable totals
      const { data: receivables } = await supabase
        .from('accounts_receivable')
        .select('total_amount, received_amount, status, due_date')
        .eq('user_id', user.id);

      const totalReceivable = receivables?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;
      const totalReceived = receivables?.reduce((sum, r) => sum + Number(r.received_amount), 0) || 0;
      const pendingReceivables = totalReceivable - totalReceived;
      const overdueReceivables = receivables
        ?.filter(r => r.status === 'pending' || r.status === 'partial')
        .filter(r => new Date(r.due_date) < now)
        .reduce((sum, r) => sum + (Number(r.total_amount) - Number(r.received_amount)), 0) || 0;

      // Fetch accounts payable totals
      const { data: payables } = await supabase
        .from('accounts_payable')
        .select('total_amount, paid_amount, status, due_date, category')
        .eq('user_id', user.id);

      const totalPayable = payables?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;
      const totalPaid = payables?.reduce((sum, p) => sum + Number(p.paid_amount), 0) || 0;
      const pendingPayables = totalPayable - totalPaid;
      const overduePayables = payables
        ?.filter(p => p.status === 'pending' || p.status === 'partial')
        .filter(p => new Date(p.due_date) < now)
        .reduce((sum, p) => sum + (Number(p.total_amount) - Number(p.paid_amount)), 0) || 0;

      // Payable by category
      const payableCategories: Record<string, number> = {};
      payables?.forEach(p => {
        const cat = p.category === 'variable' ? 'Variáveis' : p.category === 'fixed' ? 'Fixas' : 'Provisões';
        payableCategories[cat] = (payableCategories[cat] || 0) + Number(p.total_amount);
      });
      const payableByCategory = Object.entries(payableCategories).map(([category, amount]) => ({ category, amount }));

      // Fetch cash transactions for revenue/expense calculation
      const { data: transactions } = await supabase
        .from('cash_transactions')
        .select('type, amount, date, category')
        .eq('user_id', user.id)
        .gte('date', startOfYear.toISOString().split('T')[0]);

      const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      // Initialize all months
      for (let i = 0; i <= now.getMonth(); i++) {
        monthlyData[months[i]] = { revenue: 0, expenses: 0 };
      }

      transactions?.forEach(t => {
        const date = new Date(t.date);
        if (date.getFullYear() === now.getFullYear()) {
          const monthKey = months[date.getMonth()];
          if (t.type === 'income') {
            monthlyData[monthKey].revenue += Number(t.amount);
          } else if (t.type === 'expense') {
            monthlyData[monthKey].expenses += Number(t.amount);
          }
        }
      });

      const monthlyRevenue = Object.entries(monthlyData).map(([month, values]) => ({
        month,
        revenue: values.revenue,
        expenses: values.expenses,
      }));

      // Calculate totals for current month
      const currentMonthKey = months[now.getMonth()];
      const totalRevenue = monthlyData[currentMonthKey]?.revenue || 0;
      const totalExpenses = monthlyData[currentMonthKey]?.expenses || 0;

      // Fetch clients count
      const { count: totalClients } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch work orders
      const { data: workOrders } = await supabase
        .from('work_orders')
        .select('id, status, category_id, total_value, discount')
        .eq('user_id', user.id);

      const activeWorkOrders = workOrders?.filter(wo =>
        ['approved', 'in_progress'].includes(wo.status)
      ).length || 0;

      const completedWorkOrders = workOrders?.filter(wo =>
        wo.status === 'completed' || wo.status === 'delivered'
      ).length || 0;

      // Work orders by status
      const statusMap: Record<string, string> = {
        budget: 'Orçamento',
        approved: 'Aprovado',
        in_progress: 'Em Andamento',
        completed: 'Concluído',
        delivered: 'Entregue',
        cancelled: 'Cancelado',
      };
      const woStatus: Record<string, number> = {};
      workOrders?.forEach(wo => {
        const status = statusMap[wo.status] || wo.status;
        woStatus[status] = (woStatus[status] || 0) + 1;
      });
      const workOrdersByStatus = Object.entries(woStatus).map(([status, count]) => ({ status, count }));

      // Fetch losses
      const { data: losses } = await supabase
        .from('losses')
        .select('total_loss')
        .eq('user_id', user.id)
        .gte('date', startOfMonth.toISOString().split('T')[0]);

      const totalLosses = losses?.reduce((sum, l) => sum + Number(l.total_loss), 0) || 0;

      // Fetch service categories for top services
      const { data: categories } = await supabase
        .from('service_categories')
        .select('id, name')
        .eq('user_id', user.id);

      const { data: woWithItems } = await supabase
        .from('work_orders')
        .select(`
          id,
          total_value,
          discount,
          category_id,
          work_order_items(total_cost),
          work_order_costs(amount)
        `)
        .eq('user_id', user.id)
        .in('status', ['completed', 'delivered']);

      const serviceStats: Record<string, { revenue: number; profit: number; count: number }> = {};
      woWithItems?.forEach(wo => {
        if (wo.category_id) {
          const category = categories?.find(c => c.id === wo.category_id);
          const categoryName = category?.name || 'Outros';
          const revenue = Number(wo.total_value) - Number(wo.discount || 0);
          const materialCost = (wo.work_order_items as { total_cost: number }[])?.reduce((sum: number, item: { total_cost: number }) => sum + item.total_cost, 0) || 0;
          const operationalCost = (wo.work_order_costs as { amount: number }[])?.reduce((sum: number, c: { amount: number }) => sum + c.amount, 0) || 0;
          const profit = revenue - materialCost - operationalCost;

          if (!serviceStats[categoryName]) {
            serviceStats[categoryName] = { revenue: 0, profit: 0, count: 0 };
          }
          serviceStats[categoryName].revenue += revenue;
          serviceStats[categoryName].profit += profit;
          serviceStats[categoryName].count += 1;
        }
      });

      const topServices = Object.entries(serviceStats)
        .map(([service, stats]) => ({
          service,
          revenue: stats.revenue,
          profit: stats.profit,
          margin: stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setData({
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        pendingReceivables,
        pendingPayables,
        overdueReceivables,
        overduePayables,
        totalClients: totalClients || 0,
        activeWorkOrders,
        completedWorkOrders,
        totalLosses,
        monthlyRevenue,
        receivableByCategory: [],
        payableByCategory,
        workOrdersByStatus,
        topServices,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        Nenhum dado disponível
      </div>
    );
  }

  const maxChartValue = Math.max(
    ...data.monthlyRevenue.map(m => Math.max(m.revenue, m.expenses)),
    1
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Visão geral do seu negócio</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Profit */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${data.netProfit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              {data.netProfit >= 0 ? (
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-400" />
              )}
            </div>
            <div className={`flex items-center gap-1 text-sm ${data.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {data.netProfit >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              Lucro Líquido
            </div>
          </div>
          <p className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(data.netProfit)}
          </p>
          <p className="text-slate-500 text-sm mt-1">Este mês</p>
        </div>

        {/* Revenue */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-cyan-500/20">
              <DollarSign className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="text-sm text-cyan-400">Receitas</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(data.totalRevenue)}</p>
          <p className="text-slate-500 text-sm mt-1">Este mês</p>
        </div>

        {/* Expenses */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-orange-500/20">
              <CreditCard className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-sm text-orange-400">Despesas</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(data.totalExpenses)}</p>
          <p className="text-slate-500 text-sm mt-1">Este mês</p>
        </div>

        {/* Pending Receivables */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Wallet className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-sm text-blue-400">A Receber</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(data.pendingReceivables)}</p>
          <p className="text-slate-500 text-sm mt-1">
            {data.overdueReceivables > 0 && (
              <span className="text-red-400">{formatCurrency(data.overdueReceivables)} vencido</span>
            )}
            {data.overdueReceivables === 0 && 'Nenhum vencido'}
          </p>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-500 text-sm">Clientes</p>
          <p className="text-xl font-bold text-white mt-1">{data.totalClients}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-500 text-sm">O.S. Ativas</p>
          <p className="text-xl font-bold text-white mt-1">{data.activeWorkOrders}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-500 text-sm">O.S. Concluídas</p>
          <p className="text-xl font-bold text-white mt-1">{data.completedWorkOrders}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-500 text-sm">A Pagar</p>
          <p className="text-xl font-bold text-orange-400 mt-1">{formatCurrency(data.pendingPayables)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-500 text-sm">Perdas</p>
          <p className="text-xl font-bold text-red-400 mt-1">{formatCurrency(data.totalLosses)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-500 text-sm">Margem Média</p>
          <p className="text-xl font-bold text-cyan-400 mt-1">
            {data.totalRevenue > 0
              ? formatPercent(((data.totalRevenue - data.totalExpenses) / data.totalRevenue) * 100)
              : '0%'}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue vs Expenses Chart */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-6">Receitas x Despesas</h3>
          <div className="space-y-4">
            {data.monthlyRevenue.map((item) => (
              <div key={item.month} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{item.month}</span>
                  <div className="flex gap-4">
                    <span className="text-cyan-400">{formatCurrency(item.revenue)}</span>
                    <span className="text-orange-400">{formatCurrency(item.expenses)}</span>
                  </div>
                </div>
                <div className="flex gap-1 h-6">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-l"
                    style={{ width: `${(item.revenue / maxChartValue) * 100}%`, minWidth: item.revenue > 0 ? '4px' : '0' }}
                  />
                  <div
                    className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-r"
                    style={{ width: `${(item.expenses / maxChartValue) * 100}%`, minWidth: item.expenses > 0 ? '4px' : '0' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-cyan-500 rounded" />
              <span className="text-slate-400">Receitas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded" />
              <span className="text-slate-400">Despesas</span>
            </div>
          </div>
        </div>

        {/* Work Orders by Status */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-6">O.S. por Status</h3>
          {data.workOrdersByStatus.length > 0 ? (
            <div className="space-y-4">
              {data.workOrdersByStatus.map((item, index) => {
                const total = data.workOrdersByStatus.reduce((sum, i) => sum + i.count, 0);
                const percentage = total > 0 ? (item.count / total) * 100 : 0;
                const colors = [
                  'bg-slate-500',
                  'bg-cyan-500',
                  'bg-blue-500',
                  'bg-emerald-500',
                  'bg-green-500',
                  'bg-red-500',
                ];
                return (
                  <div key={item.status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white font-medium">{item.status}</span>
                      <span className="text-slate-400">{item.count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[index % colors.length]} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-500">
              Nenhuma ordem de serviço cadastrada
            </div>
          )}
        </div>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Alertas</h3>
          </div>
          <div className="space-y-3">
            {data.overdueReceivables > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Contas vencidas a receber</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatCurrency(data.overdueReceivables)} em atraso
                  </p>
                </div>
              </div>
            )}
            {data.overduePayables > 0 && (
              <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-400">Contas vencidas a pagar</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatCurrency(data.overduePayables)} em atraso
                  </p>
                </div>
              </div>
            )}
            {data.totalLosses > 0 && (
              <div className="flex items-start gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                <TrendingDown className="w-5 h-5 text-orange-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-400">Perdas registradas</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatCurrency(data.totalLosses)} este mês
                  </p>
                </div>
              </div>
            )}
            {data.overdueReceivables === 0 && data.overduePayables === 0 && data.totalLosses === 0 && (
              <div className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <Target className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">Tudo em dia!</p>
                  <p className="text-xs text-slate-400 mt-1">Nenhum	alerta pendente</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Services */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Serviços Mais Rentáveis</h3>
          </div>
          {data.topServices.length > 0 ? (
            <div className="space-y-4">
              {data.topServices.map((item, index) => (
                <div key={item.service} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-amber-500/20 text-amber-400' :
                    index === 1 ? 'bg-slate-400/20 text-slate-300' :
                    index === 2 ? 'bg-orange-700/20 text-orange-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{item.service}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-cyan-400">{formatCurrency(item.revenue)}</span>
                        <span className={item.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {formatCurrency(item.profit)}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Percent className="w-3 h-3" />
                          {formatPercent(item.margin)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${item.margin}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-500">
              Nenhum serviço finalizado ainda
            </div>
          )}
        </div>
      </div>

      {/* Payables Summary */}
      {data.payableByCategory.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <PiggyBank className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Despesas por Categoria</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.payableByCategory.map((item) => (
              <div key={item.category} className="p-4 bg-slate-700/30 rounded-xl">
                <p className="text-slate-400 text-sm mb-1">{item.category}</p>
                <p className="text-xl font-bold text-white">{formatCurrency(item.amount)}</p>
                <div className="mt-2 h-2 bg-slate-600/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      item.category === 'Variáveis' ? 'bg-orange-500' :
                      item.category === 'Fixas' ? 'bg-blue-500' :
                      'bg-purple-500'
                    }`}
                    style={{
                      width: `${(item.amount / data.payableByCategory.reduce((sum, i) => sum + i.amount, 0)) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
