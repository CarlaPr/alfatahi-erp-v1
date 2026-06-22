import { useEffect, useState } from 'react';
import { supabase, CashTransaction, BankAccount } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export function CashFlow() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bank_account_id: '',
    type: 'income' as 'income' | 'expense' | 'transfer',
    category: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const { data: accountsData } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');

      setBankAccounts(accountsData || []);

      if (accountsData && accountsData.length > 0 && !selectedAccount) {
        setSelectedAccount(accountsData[0].id);
      }

      const { data: transactionsData } = await supabase
        .from('cash_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !filterType || t.type === filterType;
    const matchesAccount = !selectedAccount || t.bank_account_id === selectedAccount;
    return matchesSearch && matchesType && matchesAccount;
  });

  const selectedBankAccount = bankAccounts.find(a => a.id === selectedAccount);

  const totals = {
    incomes: transactions
      .filter(t => t.type === 'income' && (!selectedAccount || t.bank_account_id === selectedAccount))
      .reduce((sum, t) => sum + t.amount, 0),
    expenses: transactions
      .filter(t => t.type === 'expense' && (!selectedAccount || t.bank_account_id === selectedAccount))
      .reduce((sum, t) => sum + t.amount, 0),
  };

  const projected = {
    incomes: totals.incomes * 1.2,
    expenses: totals.expenses * 1.1,
  };

  const openModal = () => {
    setFormData({
      bank_account_id: selectedAccount || bankAccounts[0]?.id || '',
      type: 'income',
      category: '',
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('cash_transactions')
        .insert([{
          ...formData,
          user_id: user.id,
        }]);

      if (error) throw error;

      // Update bank account balance
      const account = bankAccounts.find(a => a.id === formData.bank_account_id);
      if (account) {
        const newBalance = formData.type === 'income'
          ? account.current_balance + formData.amount
          : formData.type === 'expense'
            ? account.current_balance - formData.amount
            : account.current_balance;

        await supabase
          .from('bank_accounts')
          .update({ current_balance: newBalance, updated_at: new Date().toISOString() })
          .eq('id', formData.bank_account_id);
      }

      await fetchData();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
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
          <h1 className="text-2xl font-bold text-white">Fluxo de Caixa</h1>
          <p className="text-slate-400 mt-1">Controle de entradas e saídas</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-cyan-500/30"
        >
          <Plus className="w-5 h-5" />
          Nova Transação
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-500 text-sm">Saldo Atual</p>
          <p className="text-xl font-bold text-white mt-1">
            {formatCurrency(selectedBankAccount?.current_balance || 0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-500 text-sm">Entradas</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(totals.incomes)}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-500 text-sm">Saídas</p>
          <p className="text-xl font-bold text-orange-400 mt-1">{formatCurrency(totals.expenses)}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-500 text-sm">Saldo Projetado</p>
          <p className={`text-xl font-bold mt-1 ${totals.incomes - totals.expenses >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
            {formatCurrency((selectedBankAccount?.current_balance || 0) + projected.incomes - projected.expenses)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-6">Entradas x Saídas</h3>
        <div className="flex items-end justify-between gap-4 h-40">
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full bg-emerald-500/20 rounded-t-lg relative overflow-hidden" style={{ height: '100%' }}>
              <div className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg"
                style={{ height: `${Math.min((totals.incomes / Math.max(totals.incomes, totals.expenses, 1)) * 100, 100)}%` }} />
            </div>
            <span className="text-emerald-400 font-medium">{formatCurrency(totals.incomes)}</span>
            <span className="text-slate-500 text-sm">Entradas</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full bg-orange-500/20 rounded-t-lg relative overflow-hidden" style={{ height: '100%' }}>
              <div className="absolute bottom-0 w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg"
                style={{ height: `${Math.min((totals.expenses / Math.max(totals.incomes, totals.expenses, 1)) * 100, 100)}%` }} />
            </div>
            <span className="text-orange-400 font-medium">{formatCurrency(totals.expenses)}</span>
            <span className="text-slate-500 text-sm">Saídas</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar transações..."
            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {bankAccounts.map((account) => (
            <option key={account.id} value={account.id}>{account.name}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">Todos os tipos</option>
          <option value="income">Entradas</option>
          <option value="expense">Saídas</option>
          <option value="transfer">Transferências</option>
        </select>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <RefreshCw className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">Nenhuma transação encontrada</p>
        </div>
      ) : (
        <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800">
                <tr>
                  <th className="text-left p-4 text-slate-400 font-medium">Data</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Descrição</th>
                  <th className="text-center p-4 text-slate-400 font-medium">Tipo</th>
                  <th className="text-right p-4 text-slate-400 font-medium">Valor</th>
                  <th className="text-center p-4 text-slate-400 font-medium">Conciliado</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                    <td className="p-4 text-slate-400">{formatDate(transaction.date)}</td>
                    <td className="p-4">
                      <p className="text-white">{transaction.description}</p>
                      {transaction.category && (
                        <p className="text-slate-500 text-xs">{transaction.category}</p>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {transaction.type === 'income' ? (
                          <>
                            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">Entrada</span>
                          </>
                        ) : transaction.type === 'expense' ? (
                          <>
                            <ArrowDownRight className="w-4 h-4 text-orange-400" />
                            <span className="text-orange-400">Saída</span>
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-400">Transferência</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-medium ${
                        transaction.type === 'income' ? 'text-emerald-400' :
                        transaction.type === 'expense' ? 'text-orange-400' : 'text-blue-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        transaction.is_reconciled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600 text-slate-400'
                      }`}>
                        {transaction.is_reconciled ? 'Sim' : 'Não'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">Nova Transação</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                X
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tipo *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      checked={formData.type === 'income'}
                      onChange={() => setFormData({ ...formData, type: 'income' })}
                      className="w-4 h-4 text-cyan-500"
                    />
                    <span className="text-slate-300 flex items-center gap-1">
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      Entrada
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      checked={formData.type === 'expense'}
                      onChange={() => setFormData({ ...formData, type: 'expense' })}
                      className="w-4 h-4 text-cyan-500"
                    />
                    <span className="text-slate-300 flex items-center gap-1">
                      <ArrowDownRight className="w-4 h-4 text-orange-400" />
                      Saída
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Conta *
                </label>
                <select
                  value={formData.bank_account_id}
                  onChange={(e) => setFormData({ ...formData, bank_account_id: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                >
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Valor *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Categoria
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
