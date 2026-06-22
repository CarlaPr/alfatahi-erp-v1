import { useEffect, useState } from 'react';
import { supabase, BankAccount } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Edit,
  Trash2,
  X,
  PiggyBank,
  Loader2,
  Building2,
  CreditCard,
  Wallet,
  TrendingUp,
} from 'lucide-react';

const accountTypes = [
  { value: 'checking', label: 'Conta Corrente', icon: Building2 },
  { value: 'savings', label: 'Poupança', icon: PiggyBank },
  { value: 'cash', label: 'Caixa', icon: Wallet },
  { value: 'investment', label: 'Investimento', icon: TrendingUp },
];

export function BankAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    bank_name: '',
    agency: '',
    account_number: '',
    type: 'checking' as BankAccount['type'],
    initial_balance: 0,
    current_balance: 0,
    notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  const fetchAccounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const totals = {
    balance: accounts.reduce((sum, a) => sum + a.current_balance, 0),
    active: accounts.filter(a => a.is_active).length,
  };

  const openModal = (account?: BankAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        bank_name: account.bank_name || '',
        agency: account.agency || '',
        account_number: account.account_number || '',
        type: account.type || 'checking',
        initial_balance: account.initial_balance,
        current_balance: account.current_balance,
        notes: account.notes || '',
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: '',
        bank_name: '',
        agency: '',
        account_number: '',
        type: 'checking',
        initial_balance: 0,
        current_balance: 0,
        notes: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAccount(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const accountData = {
        ...formData,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (editingAccount) {
        const { error } = await supabase
          .from('bank_accounts')
          .update(accountData)
          .eq('id', editingAccount.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('bank_accounts')
          .insert([accountData]);

        if (error) throw error;
      }

      await fetchAccounts();
      closeModal();
    } catch (error) {
      console.error('Error saving account:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (account: BankAccount) => {
    if (!user || !confirm(`Deseja realmente excluir a conta "${account.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', account.id);

      if (error) throw error;
      await fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const toggleActive = async (account: BankAccount) => {
    if (!user) return;

    try {
      await supabase
        .from('bank_accounts')
        .update({ is_active: !account.is_active, updated_at: new Date().toISOString() })
        .eq('id', account.id);

      await fetchAccounts();
    } catch (error) {
      console.error('Error toggling account:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTypeInfo = (type: BankAccount['type']) => {
    const found = accountTypes.find(t => t.value === type);
    return found || { label: 'Conta', icon: Building2 };
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
          <h1 className="text-2xl font-bold text-white">Contas Bancárias</h1>
          <p className="text-slate-400 mt-1">{accounts.length} contas cadastradas</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-cyan-500/30"
        >
          <Plus className="w-5 h-5" />
          Nova Conta
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Saldo Total</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totals.balance)}</p>
            </div>
            <div className="w-14 h-14 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <PiggyBank className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Contas Ativas</p>
              <p className="text-2xl font-bold text-white mt-1">{totals.active}</p>
              <p className="text-slate-500 text-sm">de {accounts.length} cadastradas</p>
            </div>
            <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <PiggyBank className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">Nenhuma conta cadastrada</p>
          <p className="text-sm mt-1">Adicione uma conta para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const typeInfo = getTypeInfo(account.type);
            const Icon = typeInfo.icon;

            return (
              <div
                key={account.id}
                className={`bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700 ${!account.is_active ? 'opacity-60' : ''} transition-all`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      !account.is_active ? 'bg-slate-600' : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                    }`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{account.name}</h3>
                      <p className="text-slate-500 text-sm">{typeInfo.label}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openModal(account)}
                      className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(account)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {account.bank_name && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Building2 className="w-4 h-4" />
                      <span>{account.bank_name}</span>
                    </div>
                  )}
                  {(account.agency || account.account_number) && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <CreditCard className="w-4 h-4" />
                      <span>{[account.agency, account.account_number].filter(Boolean).join(' / ')}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-slate-500 text-sm">Saldo Atual</p>
                  <p className={`text-xl font-bold ${account.current_balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(account.current_balance)}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    account.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600 text-slate-400'
                  }`}>
                    {account.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                  <button
                    onClick={() => toggleActive(account)}
                    className="text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    {account.is_active ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">
                {editingAccount ? 'Editar Conta' : 'Nova Conta'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome da Conta *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Ex: Caixa, Banco do Brasil..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo
                  </label>
                  <select
                    value={formData.type || 'checking'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as BankAccount['type'] })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {accountTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Banco
                  </label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Agência
                  </label>
                  <input
                    type="text"
                    value={formData.agency}
                    onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Número da Conta
                  </label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Saldo Inicial
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.initial_balance}
                    onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Saldo Atual
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.current_balance}
                    onChange={(e) => setFormData({ ...formData, current_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
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
                  onClick={closeModal}
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
