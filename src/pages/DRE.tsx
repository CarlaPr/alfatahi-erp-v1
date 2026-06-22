import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Loader2,
  Download,
} from 'lucide-react';

interface DREData {
  revenue: {
    gross: number;
    taxes: number;
    net: number;
  };
  costs: {
    materials: number;
    labor: number;
    operational: number;
    total: number;
  };
  grossProfit: number;
  expenses: {
    fixed: number;
    variable: number;
    provision: number;
    total: number;
  };
  operatingProfit: number;
  loss: {
    total: number;
    percentage: number;
  };
  netProfit: number;
  margin: number;
}

const CURRENT_YEAR = new Date().getFullYear();
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const QUARTERS = [
  { label: '1º Trimestre', months: [0, 1, 2] },
  { label: '2º Trimestre', months: [3, 4, 5] },
  { label: '3º Trimestre', months: [6, 7, 8] },
  { label: '4º Trimestre', months: [9, 10, 11] },
];

export function DRE() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [dreData, setDreData] = useState<DREData | null>(null);

  useEffect(() => {
    if (user) {
      fetchDREData();
    }
  }, [user, viewMode, selectedPeriod, selectedYear]);

  const fetchDREData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let startDate: Date;
      let endDate: Date;

      if (viewMode === 'monthly') {
        startDate = new Date(selectedYear, selectedPeriod, 1);
        endDate = new Date(selectedYear, selectedPeriod + 1, 0);
      } else if (viewMode === 'quarterly') {
        const quarter = QUARTERS[selectedPeriod];
        startDate = new Date(selectedYear, quarter.months[0], 1);
        endDate = new Date(selectedYear, quarter.months[2] + 1, 0);
      } else {
        startDate = new Date(selectedYear, 0, 1);
        endDate = new Date(selectedYear, 11, 31);
      }

      // Fetch completed/delivered work orders for the period
      const { data: workOrders } = await supabase
        .from('work_orders')
        .select(`
          id,
          total_value,
          discount,
          category_id,
          work_order_items(total_cost),
          work_order_costs(amount, category)
        `)
        .eq('user_id', user.id)
        .in('status', ['completed', 'delivered'])
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString());

      // Calculate revenue
      let grossRevenue = 0;
      let materialsCost = 0;
      let laborCost = 0;
      let operationalCost = 0;

      for (const wo of workOrders || []) {
        const revenue = Number(wo.total_value) - Number(wo.discount || 0);
        grossRevenue += revenue;

        const items = wo.work_order_items as { total_cost: number }[];
        if (items) {
          materialsCost += items.reduce((sum: number, i: { total_cost: number }) => sum + i.total_cost, 0);
        }

        const costs = wo.work_order_costs as { amount: number; category: string }[];
        if (costs) {
          for (const cost of costs) {
            if (cost.category === 'labor') {
              laborCost += cost.amount;
            } else {
              operationalCost += cost.amount;
            }
          }
        }
      }

      // Apply estimated taxes (simplified)
      const taxes = grossRevenue * 0.06; // 6% estimated tax
      const netRevenue = grossRevenue - taxes;

      // Fetch expenses from accounts payable
      const { data: expenses } = await supabase
        .from('accounts_payable')
        .select('total_amount, category')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .gte('payment_date', startDate.toISOString().split('T')[0])
        .lte('payment_date', endDate.toISOString().split('T')[0]);

      let fixedExpenses = 0;
      let variableExpenses = 0;
      let provisionExpenses = 0;

      for (const exp of expenses || []) {
        if (exp.category === 'fixed') {
          fixedExpenses += Number(exp.total_amount);
        } else if (exp.category === 'variable') {
          variableExpenses += Number(exp.total_amount);
        } else if (exp.category === 'provision') {
          provisionExpenses += Number(exp.total_amount);
        }
      }

      // Fetch losses
      const { data: losses } = await supabase
        .from('losses')
        .select('total_loss')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      const totalLoss = losses?.reduce((sum, l) => sum + Number(l.total_loss), 0) || 0;
      const lossPercentage = grossRevenue > 0 ? (totalLoss / grossRevenue) * 100 : 0;

      // Calculate totals
      const totalCosts = materialsCost + laborCost + operationalCost;
      const grossProfit = netRevenue - materialsCost;
      const totalExpenses = fixedExpenses + variableExpenses + provisionExpenses;
      const operatingProfit = grossProfit - laborCost - operationalCost - totalExpenses;
      const netProfit = operatingProfit - totalLoss;
      const margin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

      setDreData({
        revenue: { gross: grossRevenue, taxes, net: netRevenue },
        costs: { materials: materialsCost, labor: laborCost, operational: operationalCost, total: totalCosts },
        grossProfit,
        expenses: { fixed: fixedExpenses, variable: variableExpenses, provision: provisionExpenses, total: totalExpenses },
        operatingProfit,
        loss: { total: totalLoss, percentage: lossPercentage },
        netProfit,
        margin,
      });
    } catch (error) {
      console.error('Error fetching DRE data:', error);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">DRE - Demonstrativo do Resultado</h1>
          <p className="text-slate-400 mt-1">Análise financeira do exercício</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
        >
          <Download className="w-5 h-5" />
          Exportar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-400" />
          <select
            value={viewMode}
            onChange={(e) => {
              setViewMode(e.target.value as 'monthly' | 'quarterly' | 'annual');
              setSelectedPeriod(0);
            }}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="monthly">Mensal</option>
            <option value="quarterly">Trimestral</option>
            <option value="annual">Anual</option>
          </select>
        </div>

        {viewMode !== 'annual' && (
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {(viewMode === 'monthly' ? MONTHS : QUARTERS).map((item, index) => (
              <option key={index} value={index}>
                {typeof item === 'string' ? item : item.label}
              </option>
            ))}
          </select>
        )}

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {dreData && (
        <div className="space-y-6">
          {/* Revenue Section */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="bg-cyan-500/10 px-6 py-4 border-b border-cyan-500/30">
              <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Receitas
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Receita Bruta</span>
                <span className="text-xl text-white font-semibold">{formatCurrency(dreData.revenue.gross)}</span>
              </div>
              <div className="flex justify-between items-center pl-6">
                <span className="text-slate-500">(-) Impostos estimados (6%)</span>
                <span className="text-orange-400">{formatCurrency(dreData.revenue.taxes)}</span>
              </div>
              <div className="border-t border-slate-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Receita Líquida</span>
                  <span className="text-xl text-emerald-400 font-bold">{formatCurrency(dreData.revenue.net)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Costs Section */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="bg-orange-500/10 px-6 py-4 border-b border-orange-500/30">
              <h3 className="text-lg font-semibold text-orange-400 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Custos dos Serviços Prestados (CMV)
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Materiais</span>
                <span className="text-white">{formatCurrency(dreData.costs.materials)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Mão de Obra</span>
                <span className="text-white">{formatCurrency(dreData.costs.labor)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Custos Operacionais</span>
                <span className="text-white">{formatCurrency(dreData.costs.operational)}</span>
              </div>
              <div className="border-t border-slate-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Total dos Custos</span>
                  <span className="text-orange-400 font-bold">{formatCurrency(dreData.costs.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gross Profit */}
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/30 p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-slate-400 text-sm">Lucro Bruto</p>
                <p className="text-xs text-slate-500">Receita Líquida - Materiais</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${dreData.grossProfit >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                  {formatCurrency(dreData.grossProfit)}
                </p>
                <p className="text-sm text-slate-400">
                  Margem: {dreData.revenue.net > 0 ? formatPercent((dreData.grossProfit / dreData.revenue.net) * 100) : '0%'}
                </p>
              </div>
            </div>
          </div>

          {/* Operating Expenses */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="bg-red-500/10 px-6 py-4 border-b border-red-500/30">
              <h3 className="text-lg font-semibold text-red-400">Despesas Operacionais</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Despesas Fixas</span>
                <span className="text-white">{formatCurrency(dreData.expenses.fixed)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Despesas Variáveis</span>
                <span className="text-white">{formatCurrency(dreData.expenses.variable)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Provisões</span>
                <span className="text-white">{formatCurrency(dreData.expenses.provision)}</span>
              </div>
              <div className="border-t border-slate-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Total Despesas</span>
                  <span className="text-red-400 font-bold">{formatCurrency(dreData.expenses.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Loss Section */}
          {dreData.loss.total > 0 && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="bg-amber-500/10 px-6 py-4 border-b border-amber-500/30">
                <h3 className="text-lg font-semibold text-amber-400">Perdas / Desperdícios</h3>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-400">Total de Perdas</p>
                    <p className="text-xs text-slate-500">Vidro quebrado, retrabalho, etc.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-400 font-bold">{formatCurrency(dreData.loss.total)}</p>
                    <p className="text-sm text-slate-400">Impacto: {formatPercent(dreData.loss.percentage)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Net Profit */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-2xl border border-emerald-500/30 p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white text-lg font-medium">LUCRO LÍQUIDO</p>
                <p className="text-slate-500 text-sm">Resultado Final do Exercício</p>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${dreData.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(dreData.netProfit)}
                </p>
                <p className="text-sm text-slate-400">
                  Margem Líquida: {formatPercent(dreData.margin)}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-500 text-sm">Receitas Totais</p>
              <p className="text-xl font-bold text-white mt-1">{formatCurrency(dreData.revenue.net)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-500 text-sm">Custos Totais</p>
              <p className="text-xl font-bold text-white mt-1">{formatCurrency(dreData.costs.total)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-500 text-sm">Despesas Totais</p>
              <p className="text-xl font-bold text-white mt-1">{formatCurrency(dreData.expenses.total)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-500 text-sm">Margem Líquida</p>
              <p className={`text-xl font-bold mt-1 ${dreData.margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatPercent(dreData.margin)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
