import { useEffect, useState } from 'react';
import { supabase, Quote, QuoteItem, Client, ServiceCategory } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  FileText,
  Download,
  Filter,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Hash,
  Loader2,
  ChevronDown,
  Package,
  Wrench,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  Send,
  ArrowRight,
} from 'lucide-react';

const statusConfig = {
  draft: { label: 'Rascunho', color: 'bg-slate-500', icon: FileText },
  pending: { label: 'Pendente', color: 'bg-amber-500', icon: Clock },
  approved: { label: 'Aprovado', color: 'bg-emerald-500', icon: CheckCircle },
  negotiation: { label: 'Negociação', color: 'bg-blue-500', icon: RefreshCw },
  cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: XCircle },
  expired: { label: 'Expirado', color: 'bg-orange-600', icon: AlertCircle },
};

const categories = [
  'Box',
  'Sacada',
  'Janela',
  'Espelho',
  'Porta',
  'Projeto Especial',
];

const paymentMethods = [
  { value: 'pix', label: 'PIX' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'debit', label: 'Débito' },
  { value: 'credit', label: 'Crédito' },
  { value: 'installment', label: 'Parcelado' },
];

const defaultNotes = `Condições:
- Orçamento válido por 15 dias
- Pagamento: Entrada + saldo na entrega
- Prazo de execução: conforme disponibilidade
- Garantia: 5 anos nos materiais, 1 ano na instalação`;

interface QuotesProps {
  onPageChange?: (page: string) => void;
}

export function Quotes({ onPageChange }: QuotesProps) {
  const { user, profile } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'new'>('list');
  const [action, setAction] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    client_phone: '',
    client_email: '',
    client_document: '',
    client_address: '',
    title: '',
    description: '',
    status: 'draft' as Quote['status'],
    valid_until: '',
    notes: defaultNotes,
    payment_method: 'pix' as Quote['payment_method'],
    installment_count: 1,
    card_fee_percent: 0,
    location: '',
  });

  const [items, setItems] = useState<Partial<QuoteItem>[]>([]);
  const [clientSearch, setClientSearch] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (action === 'new') {
      handleNewQuote();
      setAction(null);
    }
  }, [action]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const { data: quotesData } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setQuotes(quotesData || []);

      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');
      setClients(clientsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch =
      quote.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || quote.status === statusFilter;
    const matchesDate = (!dateFilter.start || quote.created_at >= dateFilter.start) &&
                        (!dateFilter.end || quote.created_at <= dateFilter.end + 'T23:59:59');
    return matchesSearch && matchesStatus && matchesDate;
  });

  const generateNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const count = quotes.length + 1;
    return `OR-${year}${month}-${count.toString().padStart(4, '0')}`;
  };

  const handleNewQuote = () => {
    setEditingQuote(null);
    setFormData({
      client_id: '',
      client_name: '',
      client_phone: '',
      client_email: '',
      client_document: '',
      client_address: '',
      title: '',
      description: '',
      status: 'draft',
      valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: defaultNotes,
      payment_method: 'pix',
      installment_count: 1,
      card_fee_percent: 0,
      location: '',
    });
    setItems([]);
    setShowModal(true);
  };

  const handleEditQuote = async (quote: Quote) => {
    if (quote.status === 'approved') {
      alert('Orçamentos aprovados não podem ser editados. Crie uma nova versão.');
      return;
    }

    setEditingQuote(quote);
    setFormData({
      client_id: quote.client_id || '',
      client_name: quote.client_name,
      client_phone: quote.client_phone || '',
      client_email: quote.client_email || '',
      client_document: quote.client_document || '',
      client_address: quote.client_address || '',
      title: quote.title,
      description: quote.description || '',
      status: quote.status,
      valid_until: quote.valid_until || '',
      notes: quote.notes || '',
      payment_method: quote.payment_method || 'pix',
      installment_count: quote.installment_count,
      card_fee_percent: quote.card_fee_percent,
      location: quote.location || '',
    });

    // Fetch items
    const { data: itemsData } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quote.id);

    setItems(itemsData || []);
    setShowModal(true);
  };

  const handleViewQuote = async (quote: Quote) => {
    setSelectedQuote(quote);
    setShowViewModal(true);
  };

  const selectClient = (client: Client) => {
    setFormData({
      ...formData,
      client_id: client.id,
      client_name: client.name,
      client_phone: client.phone || '',
      client_email: client.email || '',
      client_document: client.document || '',
      client_address: [client.address, client.city].filter(Boolean).join(', ') || '',
    });
    setShowClientModal(false);
    setClientSearch('');
  };

  const addItem = () => {
    setItems([...items, {
      type: 'product',
      category: 'Box',
      description: '',
      width: 0,
      height: 0,
      quantity: 1,
      unit: 'un',
      unit_price: 0,
      discount: 0,
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: unknown) => {
    const newItems = [...items];
    (newItems[index] as Record<string, unknown>)[field] = value;

    // Auto-calculate area
    if (field === 'width' || field === 'height') {
      const width = field === 'width' ? Number(value) : Number(newItems[index].width) || 0;
      const height = field === 'height' ? Number(value) : Number(newItems[index].height) || 0;
      newItems[index].area = width * height;
    }

    setItems(newItems);
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    return subtotal;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const totalValue = calculateTotal();
      const quoteData = {
        ...formData,
        number: editingQuote?.number || generateNumber(),
        total_value: totalValue,
        user_id: user.id,
        created_by_name: profile?.owner_name || profile?.company_name || 'Vendedor',
        updated_at: new Date().toISOString(),
      };

      let quoteId: string;

      if (editingQuote) {
        const { error } = await supabase
          .from('quotes')
          .update(quoteData)
          .eq('id', editingQuote.id);

        if (error) throw error;
        quoteId = editingQuote.id;

        // Delete existing items
        await supabase.from('quote_items').delete().eq('quote_id', quoteId);
      } else {
        const { data, error } = await supabase
          .from('quotes')
          .insert([quoteData])
          .select('id')
          .single();

        if (error) throw error;
        quoteId = data.id;
      }

      // Insert items
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          ...item,
          quote_id: quoteId,
          user_id: user.id,
        }));
        await supabase.from('quote_items').insert(itemsToInsert);
      }

      await fetchData();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving quote:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleApproveQuote = async (quote: Quote) => {
    if (!user || !confirm('Aprovar este orçamento? Isso criará automaticamente uma Ordem de Serviço.')) return;

    try {
      // Update quote status
      await supabase
        .from('quotes')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', quote.id);

      // Fetch quote items
      const { data: itemsData } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quote.id);

      // Create Work Order
      const woNumber = `OS-${quote.number.replace('OR-', '')}`;
      const { data: workOrder, error: woError } = await supabase
        .from('work_orders')
        .insert([{
          number: woNumber,
          client_id: quote.client_id,
          title: quote.title,
          description: quote.description,
          status: 'approved',
          total_value: quote.total_value,
          discount: 0,
          install_address: quote.client_address,
          notes: `Criado automaticamente a partir do orçamento ${quote.number}\n\nCliente: ${quote.client_name}\nTelefone: ${quote.client_phone}\nEmail: ${quote.client_email}`,
          user_id: user.id,
          quote_id: quote.id,
        }])
        .select('id')
        .single();

      if (woError) throw woError;

      // Convert quote items to work order items
      if (itemsData && itemsData.length > 0) {
        const woItems = itemsData.map(item => ({
          work_order_id: workOrder.id,
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          unit_cost: 0, // Will be filled by management
          unit_price: item.unit_price,
          user_id: user.id,
        }));
        await supabase.from('work_order_items').insert(woItems);
      }

      // Create accounts receivable
      const installmentAmount = quote.total_value / quote.installment_count;
      const receivables = [];
      for (let i = 1; i <= quote.installment_count; i++) {
        receivables.push({
          client_id: quote.client_id,
          work_order_id: workOrder.id,
          description: `${quote.title} - Parcela ${i}/${quote.installment_count}`,
          total_amount: installmentAmount,
          received_amount: 0,
          due_date: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending',
          payment_method: quote.payment_method === 'installment' ? 'credit' : quote.payment_method,
          installment_number: i,
          total_installments: quote.installment_count,
          card_fee_percent: quote.card_fee_percent,
          user_id: user.id,
        });
      }
      await supabase.from('accounts_receivable').insert(receivables);

      // Update quote with work_order_id
      await supabase
        .from('quotes')
        .update({ work_order_id: workOrder.id })
        .eq('id', quote.id);

      alert(`Orçamento aprovado!\n\nOrdem de Serviço ${woNumber} criada automaticamente.`);
      await fetchData();
    } catch (error) {
      console.error('Error approving quote:', error);
      alert('Erro ao aprovar orçamento. Tente novamente.');
    }
  };

  const handleCancelQuote = async (quote: Quote) => {
    const motivo = prompt('Motivo do cancelamento:');
    if (!user || !motivo) return;

    try {
      await supabase
        .from('quotes')
        .update({
          status: 'cancelled',
          notes: `${quote.notes}\n\nCANCELADO: ${motivo}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', quote.id);

      // If has work order, cancel it too
      if (quote.work_order_id) {
        await supabase
          .from('work_orders')
          .update({ status: 'cancelled' })
          .eq('id', quote.work_order_id);

        // Cancel receivables
        await supabase
          .from('accounts_receivable')
          .update({ status: 'cancelled' })
          .eq('work_order_id', quote.work_order_id);
      }

      await fetchData();
    } catch (error) {
      console.error('Error cancelling quote:', error);
    }
  };

  const handleDelete = async (quote: Quote) => {
    if (!user || !confirm(`Excluir orçamento ${quote.number}?`)) return;

    try {
      await supabase.from('quote_items').delete().eq('quote_id', quote.id);
      await supabase.from('quotes').delete().eq('id', quote.id);
      await fetchData();
    } catch (error) {
      console.error('Error deleting quote:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const total = calculateTotal();
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone?.includes(clientSearch) ||
    c.email?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Orçamentos</h1>
          <p className="text-slate-400 mt-1">{quotes.length} orçamentos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {/* Export logic */}}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
          >
            <Download className="w-5 h-5" />
            Exportar
          </button>
          <button
            onClick={handleNewQuote}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-cyan-500/30"
          >
            <Plus className="w-5 h-5" />
            Novo Orçamento
          </button>
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
            placeholder="Buscar orçamentos..."
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
        <input
          type="date"
          value={dateFilter.start}
          onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
          className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          placeholder="Data início"
        />
        <input
          type="date"
          value={dateFilter.end}
          onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
          className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          placeholder="Data fim"
        />
      </div>

      {/* Quotes List */}
      {filteredQuotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <FileText className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">Nenhum orçamento encontrado</p>
          <button
            onClick={handleNewQuote}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30"
          >
            <Plus className="w-4 h-4" />
            Criar primeiro orçamento
          </button>
        </div>
      ) : (
        <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800">
                <tr>
                  <th className="text-left p-4 text-slate-400 font-medium">Cliente</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Número</th>
                  <th className="text-center p-4 text-slate-400 font-medium">Status</th>
                  <th className="text-center p-4 text-slate-400 font-medium">Data</th>
                  <th className="text-right p-4 text-slate-400 font-medium">Qtd.</th>
                  <th className="text-right p-4 text-slate-400 font-medium">Valor</th>
                  <th className="text-center p-4 text-slate-400 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((quote) => {
                  const status = statusConfig[quote.status];
                  const StatusIcon = status.icon;

                  return (
                    <tr key={quote.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">{quote.client_name}</p>
                          <p className="text-slate-500 text-xs">{quote.title}</p>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">{quote.number}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-center text-slate-400">{formatDate(quote.created_at)}</td>
                      <td className="p-4 text-right text-slate-400">-</td>
                      <td className="p-4 text-right text-white font-medium">{formatCurrency(quote.total_value)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewQuote(quote)}
                            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {quote.status !== 'approved' && quote.status !== 'cancelled' && (
                            <>
                              <button
                                onClick={() => handleEditQuote(quote)}
                                className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {(quote.status === 'pending' || quote.status === 'negotiation') && (
                                <button
                                  onClick={() => handleApproveQuote(quote)}
                                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                  title="Aprovar"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                          {quote.status === 'approved' && quote.work_order_id && (
                            <button
                              onClick={() => onPageChange?.('work-orders')}
                              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Ver OS"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                          {quote.status !== 'approved' && (
                            <button
                              onClick={() => handleDelete(quote)}
                              className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl w-full max-w-4xl border border-slate-700 shadow-2xl my-8">
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800">
              <h2 className="text-xl font-semibold text-white">
                {editingQuote ? `Editar ${editingQuote.number}` : 'Novo Orçamento'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* CLIENTE */}
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-400" />
                    Cliente
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowClientModal(true)}
                    className="flex items-center gap-1 px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 text-sm"
                  >
                    <Search className="w-4 h-4" />
                    Selecionar
                  </button>
                </div>

                {formData.client_name ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500">Nome</label>
                      <p className="text-white">{formData.client_name}</p>
                    </div>
                    {formData.client_phone && (
                      <div>
                        <label className="text-xs text-slate-500">Telefone</label>
                        <p className="text-white flex items-center gap-1"><Phone className="w-3 h-3" />{formData.client_phone}</p>
                      </div>
                    )}
                    {formData.client_email && (
                      <div>
                        <label className="text-xs text-slate-500">Email</label>
                        <p className="text-white flex items-center gap-1"><Mail className="w-3 h-3" />{formData.client_email}</p>
                      </div>
                    )}
                    {formData.client_address && (
                      <div>
                        <label className="text-xs text-slate-500">Endereço</label>
                        <p className="text-white flex items-center gap-1"><MapPin className="w-3 h-3" />{formData.client_address}</p>
                      </div>
                    )}
                    {formData.client_document && (
                      <div>
                        <label className="text-xs text-slate-500">Documento</label>
                        <p className="text-white">{formData.client_document}</p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, client_id: '', client_name: '', client_phone: '', client_email: '', client_document: '', client_address: '' })}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Limpar cliente
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">
                    Selecione um cliente existente ou preencha os dados abaixo
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {!formData.client_name && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nome *</label>
                        <input
                          type="text"
                          value={formData.client_name}
                          onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Telefone</label>
                        <input
                          type="text"
                          value={formData.client_phone}
                          onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* TÍTULO E DESCRIÇÃO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Título *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Ex: Box Banheiro Master"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Local</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Local de instalação"
                  />
                </div>
              </div>

              {/* PRODUTOS E SERVIÇOS */}
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-400" />
                    Produtos e Serviços
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>

                {items.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">Nenhum item adicionado</p>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="bg-slate-800 rounded-lg p-3">
                        <div className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-2">
                            <label className="text-xs text-slate-500 mb-1 block">Tipo</label>
                            <select
                              value={item.type}
                              onChange={(e) => updateItem(index, 'type', e.target.value)}
                              className="w-full px-2 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm"
                            >
                              <option value="product">Produto</option>
                              <option value="service">Serviço</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="text-xs text-slate-500 mb-1 block">Categoria</label>
                            <select
                              value={item.category}
                              onChange={(e) => updateItem(index, 'category', e.target.value)}
                              className="w-full px-2 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm"
                            >
                              {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-3">
                            <label className="text-xs text-slate-500 mb-1 block">Descrição</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              className="w-full px-2 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm"
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="text-xs text-slate-500 mb-1 block">Larg.</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.width}
                              onChange={(e) => updateItem(index, 'width', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm"
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="text-xs text-slate-500 mb-1 block">Alt.</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.height}
                              onChange={(e) => updateItem(index, 'height', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm"
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="text-xs text-slate-500 mb-1 block">Qtd</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm"
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="text-xs text-slate-500 mb-1 block">Valor Un.</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm"
                            />
                          </div>
                          <div className="col-span-1 flex items-end justify-center">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {item.width && item.height && (
                          <p className="text-xs text-slate-400 mt-1">Área: {((item.width || 0) * (item.height || 0)).toFixed(2)} m²</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-600">
                  <div className="flex justify-between text-lg">
                    <span className="text-slate-400">Total:</span>
                    <span className="text-white font-bold">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* PAGAMENTO */}
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-emerald-400" />
                  Pagamento
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Forma de Pagamento</label>
                    <select
                      value={formData.payment_method || 'pix'}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as Quote['payment_method'] })}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {paymentMethods.map((method) => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </select>
                  </div>
                  {formData.payment_method === 'installment' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Parcelas</label>
                      <input
                        type="number"
                        min="2"
                        max="12"
                        value={formData.installment_count}
                        onChange={(e) => setFormData({ ...formData, installment_count: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  )}
                  {(formData.payment_method === 'credit' || formData.payment_method === 'installment') && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Taxa (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.card_fee_percent}
                        onChange={(e) => setFormData({ ...formData, card_fee_percent: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* OBSERVAÇÕES */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>

              {/* CONFIGURAÇÃO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Válido até</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Quote['status'] })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="pending">Pendente</option>
                    <option value="negotiation">Negociação</option>
                  </select>
                </div>
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
                    'Salvar Orçamento'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Select Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">Selecionar Cliente</h2>
              <button
                onClick={() => setShowClientModal(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Buscar clientes..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => selectClient(client)}
                    className="w-full text-left p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <p className="text-white font-medium">{client.name}</p>
                    <p className="text-slate-400 text-sm">{client.phone || client.email}</p>
                  </button>
                ))}
                {filteredClients.length === 0 && (
                  <p className="text-slate-500 text-center py-4">Nenhum cliente encontrado</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedQuote && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800">
              <h2 className="text-xl font-semibold text-white">Orçamento {selectedQuote.number}</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-white ${statusConfig[selectedQuote.status].color}`}>
                  {(() => {
                    const Icon = statusConfig[selectedQuote.status].icon;
                    return <Icon className="w-4 h-4" />;
                  })()}
                  {statusConfig[selectedQuote.status].label}
                </span>
                <span className="text-slate-400 text-sm">{formatDate(selectedQuote.created_at)}</span>
              </div>

              {/* Client Info */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <h4 className="text-sm text-slate-500 mb-2">Cliente</h4>
                <p className="text-white font-medium">{selectedQuote.client_name}</p>
                {selectedQuote.client_phone && <p className="text-slate-400 text-sm">{selectedQuote.client_phone}</p>}
                {selectedQuote.client_email && <p className="text-slate-400 text-sm">{selectedQuote.client_email}</p>}
                {selectedQuote.client_address && <p className="text-slate-400 text-sm">{selectedQuote.client_address}</p>}
              </div>

              {/* Title */}
              <div>
                <h4 className="text-sm text-slate-500 mb-1">Título</h4>
                <p className="text-white">{selectedQuote.title}</p>
              </div>

              {/* Items */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <h4 className="text-sm text-slate-500 mb-3">Itens</h4>
                {/* Would need to fetch items */}
                <p className="text-slate-400">Carregando itens...</p>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/30">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total</span>
                  <span className="text-2xl font-bold text-white">{formatCurrency(selectedQuote.total_value)}</span>
                </div>
              </div>

              {/* Payment Info */}
              {(selectedQuote.payment_method || selectedQuote.valid_until) && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedQuote.payment_method && (
                    <div>
                      <span className="text-slate-500">Pagamento: </span>
                      <span className="text-white">{paymentMethods.find(m => m.value === selectedQuote.payment_method)?.label}</span>
                    </div>
                  )}
                  {selectedQuote.valid_until && (
                    <div>
                      <span className="text-slate-500">Válido até: </span>
                      <span className="text-white">{formatDate(selectedQuote.valid_until)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedQuote.notes && (
                <div>
                  <h4 className="text-sm text-slate-500 mb-2">Observações</h4>
                  <p className="text-slate-300 whitespace-pre-wrap text-sm">{selectedQuote.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                {selectedQuote.status !== 'approved' && selectedQuote.status !== 'cancelled' && (
                  <>
                    <button
                      onClick={() => { setShowViewModal(false); handleEditQuote(selectedQuote); }}
                      className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                    {(selectedQuote.status === 'pending' || selectedQuote.status === 'negotiation') && (
                      <button
                        onClick={() => { setShowViewModal(false); handleApproveQuote(selectedQuote); }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aprovar
                      </button>
                    )}
                  </>
                )}
                {selectedQuote.status === 'approved' && selectedQuote.work_order_id && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      onPageChange?.('work-orders');
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Ver Ordem de Serviço
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
