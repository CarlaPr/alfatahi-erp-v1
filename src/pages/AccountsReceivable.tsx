import { useEffect, useState } from 'react';
import { supabase, AccountReceivable } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Wallet,
  AlertTriangle,
  Loader2,
  DollarSign,
  Percent,
} from 'lucide-react';

interface ClientPartial {
  id: string;
  name: string;
}

interface WorkOrderPartial {
  id: string;
  number: string;
  title: string;
}

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-slate-500', textColor: 'text-slate-400' },
  partial: { label: 'Parcial', color: 'bg-amber-500', textColor: 'text-amber-400' },
  received: { label: 'Recebido', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
  overdue: { label: 'Vencido', color: 'bg-red-500', textColor: 'text-red-400' },
  cancelled: { label: 'Cancelado', color: 'bg-slate-700', textColor: 'text-slate-500' },
};

const paymentMethods = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'debit', label: 'Débito' },
  { value: 'credit', label: 'Crédito' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'boleto', label: 'Boleto' },
];

export function AccountsReceivable() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AccountReceivable[]>([]);
  const [clients, setClients] = useState<ClientPartial[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrderPartial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountReceivable | null>(null);
  const [payingAccount, setPayingAccount] = useState<AccountReceivable | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    client_id: '',
    work_order_id: '',
    description: '',
    total_amount: 0,
    due_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    payment_method: null as AccountReceivable['payment_method'],
    document_number: '',
    installment_number: null as number | null,
    total_installments: null as number | null,
    card_fee_percent: 0,
    notes: '',
  });

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_method: 'pix' as AccountReceivable['payment_method'],
    receipt_date: new Date().toISOString().split('T')[0],
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
        .from('accounts_receivable')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      const now = new Date();
      const updated = accountsData?.map(acc => {
        const dueDate = new Date(acc.due_date);
        if ((acc.status === 'pending' || acc.status === 'partial') && dueDate < now) {
          return { ...acc, status: 'overdue' as const };
        }
        return acc;
      });
      setAccounts(updated || []);

      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');
      setClients(clientsData || []);

      const { data: workOrdersData } = await supabase
        .from('work_orders')
        .select('id, number, title')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setWorkOrders(workOrdersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch =
      account.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.document_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || account.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totals = {
    total: accounts.reduce((sum, a) => sum + a.total_amount, 0),
    received: accounts.reduce((sum, a) => sum + a.received_amount, 0),
    pending: accounts
      .filter(a => a.status === 'pending' || a.status === 'partial' || a.status === 'overdue')
      .reduce((sum, a) => sum + (a.total_amount - a.received_amount), 0),
    overdue: accounts
      .filter(a => a.status === 'overdue')
      .reduce((sum, a) => sum + (a.total_amount - a.received_amount), 0),
    fees: accounts
      .filter(a => a.payment_method === 'credit' && a.card_fee_percent)
      .reduce((sum, a) => sum + (a.total_amount * (a.card_fee_percent || 0) / 100), 0),
  };

  const openModal = (account?: AccountReceivable) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        client_id: account.client_id || '',
        work_order_id: account.work_order_id || '',
        description: account.description,
        total_amount: account.total_amount,
        due_date: account.due_date,
        expected_date: account.expected_date || '',
        payment_method: account.payment_method,
        document_number: account.document_number || '',
        installment_number: account.installment_number,
        total_installments: account.total_installments,
        card_fee_percent: account.card_fee_percent,
        notes: account.notes || '',
      });
    } else {
      setEditingAccount(null);
      setFormData({
        client_id: '',
        work_order_id: '',
        description: '',
        total_amount: 0,
        due_date: new Date().toISOString().split('T')[0],
        expected_date: '',
        payment_method: null,
        document_number: '',
        installment_number: null,
        total_installments: null,
        card_fee_percent: 0,
        notes: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAccount(null);
  };

  const openPaymentModal = (account: AccountReceivable) => {
    setPayingAccount(account);
    setPaymentData({
      amount: account.total_amount - account.received_amount,
      payment_method: account.payment_method || 'pix',
      receipt_date: new Date().toISOString().split('T')[0],
    });
    setShowPaymentModal(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !payingAccount) return;

    setSaving(true);
    try {
      const newReceivedAmount = payingAccount.received_amount + paymentData.amount;
      const isFullyReceived = newReceivedAmount >= payingAccount.total_amount;

      await supabase
        .from('accounts_receivable')
        .update({
          received_amount: newReceivedAmount,
          status: isFullyReceived ? 'received' : 'partial',
          receipt_date: paymentData.receipt_date,
          payment_method: paymentData.payment_method,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payingAccount.id);

      const { data: bankAccounts } = await supabase
        .from('bank_accounts')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1);

      if (bankAccounts && bankAccounts.length > 0) {
        await supabase.from('cash_transactions').insert([{
          bank_account_id: bankAccounts[0].id,
          type: 'income',
          category: 'receivable',
          description: payingAccount.description,
          amount: paymentData.amount,
          date: paymentData.receipt_date,
          account_receivable_id: payingAccount.id,
          work_order_id: payingAccount.work_order_id,
          user_id: user.id,
        }]);
      }

      await fetchData();
      setShowPaymentModal(false);
      setPayingAccount(null);
    } catch (error) {
      console.error('Error processing receipt:', error);
    } finally {
      setSaving(false);
    }
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
          .from('accounts_receivable')
          .update(accountData)
          .eq('id', editingAccount.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('accounts_receivable')
          .insert([accountData]);

        if (error) throw error;
      }

      await fetchData();
      closeModal();
    } catch (error) {
      console.error('Error saving account:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (account: AccountReceivable) => {
    if (!user || !confirm(`Deseja realmente excluir "${account.description}"?`)) return;

    try {
      const { error } = await supabase
        .from('accounts_receivable')
        .delete()
        .eq('id', account.id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting account:', error);
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

  const getClientName = (id: string | null) => {
    if (!id) return '-';
    const client = clients.find(c => c.id === id);
    return client?.name || '-';
  };

  const getWorkOrderNumber = (id: string | null) => {
    if (!id) return '-';
    const wo = workOrders.find(w => w.id === id);
    return wo ? `${wo.number}` : '-';
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
          <h1 className="text-2xl font-bold text-white">Contas a Receber</h1>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-500 text-sm">Total</p>
          <p className="text-xl font-bold text-white mt-1">{formatCurrency(totals.total)}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-500 text-sm">Recebido</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(totals.received)}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-500 text-sm">Pendente</p>
          <p className="text-xl font-bold text-cyan-400 mt-1">{formatCurrency(totals.pending)}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-500 text-sm">Vencido</p>
          <p className="text-xl font-bold text-red-400 mt-1">{formatCurrency(totals.overdue)}</p>
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
            placeholder="Buscar contas..."
            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">Todos os status</option>
          {Object.entries(statusConfig).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Accounts List */}
      {filteredAccounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Wallet className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">Nenhuma conta encontrada</p>
        </div>
      ) : (
        <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800">
                <tr>
                  <th className="text-left p-4 text-slate-400 font-medium">Descrição</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Cliente</th>
                  <th className="text-center p-4 text-slate-400 font-medium">Vencimento</th>
                  <th className="text-right p-4 text-slate-400 font-medium">Valor</th>
                  <th className="text-right p-4 text-slate-400 font-medium">Recebido</th>
                  <th className="text-center p-4 text-slate-400 font-medium">Status</th>
                  <th className="text-center p-4 text-slate-400 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => {
                  const isOverdue = account.status === 'overdue';
                  const statusInfo = statusConfig[account.status];

                  return (
                    <tr key={account.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">{account.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {account.work_order_id && (
                              <span className="text-xs text-cyan-400">
                                O.S: {getWorkOrderNumber(account.work_order_id)}
                              </span>
                            )}
                            {account.payment_method === 'credit' && account.card_fee_percent && (
                              <span className="text-xs text-orange-400 flex items-center gap-1">
                                <Percent className="w-3 h-3" />
                                {account.card_fee_percent}% taxa
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">{getClientName(account.client_id)}</td>
                      <td className="p-4 text-center">
                        <div className={`flex items-center justify-center gap-1 ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                          {isOverdue && <AlertTriangle className="w-4 h-4" />}
                          {formatDate(account.due_date)}
                        </div>
                      </td>
                      <td className="p-4 text-right text-white font-medium">{formatCurrency(account.total_amount)}</td>
                      <td className="p-4 text-right text-emerald-400">{formatCurrency(account.received_amount)}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs text-white ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          {account.status !== 'received' && account.status !== 'cancelled' && (
                            <button
                              onClick={() => openPaymentModal(account)}
                              className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                              title="Registrar recebimento"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openModal(account)}
                            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(account)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">
                {editingAccount ? 'Editar Conta' : 'Nova Conta a Receber'}
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
                    Cliente
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Selecione...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    O.S. Relacionada
                  </label>
                  <select
                    value={formData.work_order_id}
                    onChange={(e) => setFormData({ ...formData, work_order_id: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Nenhuma</option>
                    {workOrders.map((wo) => (
                      <option key={wo.id} value={wo.id}>{wo.number} - {wo.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Valor Total *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data Vencimento *
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data Prevista
                  </label>
                  <input
                    type="date"
                    value={formData.expected_date}
                    onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Forma de Pagamento
                  </label>
                  <select
                    value={formData.payment_method || ''}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as AccountReceivable['payment_method'] })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Selecione...</option>
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.payment_method === 'credit' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Taxa do Cartão (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.card_fee_percent}
                    onChange={(e) => setFormData({ ...formData, card_fee_percent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Ex: 3.5"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Parcela Nº
                  </label>
                  <input
                    type="number"
                    value={formData.installment_number || ''}
                    onChange={(e) => setFormData({ ...formData, installment_number: parseInt(e.target.value) || null })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Total Parcelas
                  </label>
                  <input
                    type="number"
                    value={formData.total_installments || ''}
                    onChange={(e) => setFormData({ ...formData, total_installments: parseInt(e.target.value) || null })}
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

      {/* Payment Modal */}
      {showPaymentModal && payingAccount && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">Registrar Recebimento</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPayingAccount(null);
                }}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 border-b border-slate-700">
              <p className="text-slate-400">{payingAccount.description}</p>
              <p className="text-xl font-bold text-white mt-1">{formatCurrency(payingAccount.total_amount - payingAccount.received_amount)} restante</p>
            </div>

            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Valor do Recebimento *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                  max={payingAccount.total_amount - payingAccount.received_amount}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentData.payment_method || ''}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value as AccountReceivable['payment_method'] })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>{method.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Data do Recebimento
                </label>
                <input
                  type="date"
                  value={paymentData.receipt_date}
                  onChange={(e) => setPaymentData({ ...paymentData, receipt_date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPayingAccount(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5" />
                      Registrar Recebimento
                    </>
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
