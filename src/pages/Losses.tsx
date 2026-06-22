import { useEffect, useState } from 'react';
import { supabase, Loss } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  TrendingDown,
  AlertTriangle,
  Calendar,
  Loader2,
  PieChart,
  Target,
} from 'lucide-react';

interface WorkOrderPartial {
  id: string;
  number: string;
  title: string;
}

const categoryConfig = {
  broken: { label: 'Vidro Quebrado', color: 'bg-red-500/20', textColor: 'text-red-400' },
  cut_error: { label: 'Erro de Corte', color: 'bg-orange-500/20', textColor: 'text-orange-400' },
  transport: { label: 'Transporte', color: 'bg-amber-500/20', textColor: 'text-amber-400' },
  rework: { label: 'Retrabalho', color: 'bg-blue-500/20', textColor: 'text-blue-400' },
  theft: { label: 'Furto', color: 'bg-purple-500/20', textColor: 'text-purple-400' },
  other: { label: 'Outros', color: 'bg-slate-500/20', textColor: 'text-slate-400' },
};

export function Losses() {
  const { user } = useAuth();
  const [losses, setLosses] = useState<Loss[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrderPartial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLoss, setEditingLoss] = useState<Loss | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    work_order_id: '',
    description: '',
    category: 'broken' as Loss['category'],
    material: '',
    quantity: 1,
    unit: 'un',
    unit_cost: 0,
    cause: '',
    responsible: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const { data: lossesData } = await supabase
        .from('losses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      setLosses(lossesData || []);

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

  const filteredLosses = losses.filter(loss => {
    const matchesSearch = loss.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loss.material?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || loss.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totals = {
    total: losses.reduce((sum, l) => sum + l.total_loss, 0),
    byCategory: Object.keys(categoryConfig).map(cat => ({
      category: cat,
      label: categoryConfig[cat as keyof typeof categoryConfig].label,
      total: losses
        .filter(l => l.category === cat)
        .reduce((sum, l) => sum + l.total_loss, 0),
      count: losses.filter(l => l.category === cat).length,
    })),
  };

  const openModal = (loss?: Loss) => {
    if (loss) {
      setEditingLoss(loss);
      setFormData({
        work_order_id: loss.work_order_id || '',
        description: loss.description,
        category: loss.category,
        material: loss.material || '',
        quantity: loss.quantity || 1,
        unit: loss.unit,
        unit_cost: loss.unit_cost,
        cause: loss.cause || '',
        responsible: loss.responsible || '',
        notes: loss.notes || '',
        date: loss.date,
      });
    } else {
      setEditingLoss(null);
      setFormData({
        work_order_id: '',
        description: '',
        category: 'broken',
        material: '',
        quantity: 1,
        unit: 'un',
        unit_cost: 0,
        cause: '',
        responsible: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLoss(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const lossData = {
        ...formData,
        user_id: user.id,
      };

      if (editingLoss) {
        const { error } = await supabase
          .from('losses')
          .update(lossData)
          .eq('id', editingLoss.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('losses')
          .insert([lossData]);

        if (error) throw error;
      }

      await fetchData();
      closeModal();
    } catch (error) {
      console.error('Error saving loss:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (loss: Loss) => {
    if (!user || !confirm(`Deseja realmente excluir este registro de perda?`)) return;

    try {
      const { error } = await supabase
        .from('losses')
        .delete()
        .eq('id', loss.id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting loss:', error);
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
          <h1 className="text-2xl font-bold text-white">Perdas e Desperdício</h1>
          <p className="text-slate-400 mt-1">Controle de desperdícios e prejuízos</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-cyan-500/30"
        >
          <Plus className="w-5 h-5" />
          Nova Perda
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Total de Perdas</p>
              <p className="text-3xl font-bold text-red-400 mt-1">{formatCurrency(totals.total)}</p>
            </div>
            <div className="w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-7 h-7 text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Ocorrências</p>
              <p className="text-3xl font-bold text-white mt-1">{losses.length}</p>
              <p className="text-slate-500 text-sm">Média {formatCurrency(totals.total / Math.max(losses.length, 1))} por ocorrência</p>
            </div>
            <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Loss by Category */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-cyan-400" />
          Perdas por Categoria
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {totals.byCategory.map((cat) => (
            <div
              key={cat.category}
              className="bg-slate-700/30 rounded-lg p-4"
            >
              <p className="text-slate-500 text-xs truncate">{cat.label}</p>
              <p className="text-lg font-bold text-white mt-1">{formatCurrency(cat.total)}</p>
              <p className="text-xs text-slate-500">{cat.count} ocorrências</p>
            </div>
          ))}
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
            placeholder="Buscar perdas..."
            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">Todas categorias</option>
          {Object.entries(categoryConfig).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Losses List */}
      {filteredLosses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Target className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">Nenhuma perda registrada</p>
          <p className="text-sm mt-1">Registre perdas para controlar desperdícios</p>
        </div>
      ) : (
        <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800">
                <tr>
                  <th className="text-left p-4 text-slate-400 font-medium">Data</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Descrição</th>
                  <th className="text-center p-4 text-slate-400 font-medium">Categoria</th>
                  <th className="text-right p-4 text-slate-400 font-medium">Qtd</th>
                  <th className="text-right p-4 text-slate-400 font-medium">Valor</th>
                  <th className="text-center p-4 text-slate-400 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredLosses.map((loss) => (
                  <tr key={loss.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="w-4 h-4" />
                        {formatDate(loss.date)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-white font-medium">{loss.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {loss.material && (
                            <span className="text-sm text-slate-500">{loss.material}</span>
                          )}
                          {loss.work_order_id && (
                            <span className="text-xs text-cyan-400">
                              O.S: {getWorkOrderNumber(loss.work_order_id)}
                            </span>
                          )}
                        </div>
                        {loss.cause && (
                          <p className="text-xs text-slate-500 mt-1">Causa: {loss.cause}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${categoryConfig[loss.category].color} ${categoryConfig[loss.category].textColor}`}>
                        {categoryConfig[loss.category].label}
                      </span>
                    </td>
                    <td className="p-4 text-right text-slate-400">
                      {loss.quantity} {loss.unit}
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-red-400 font-medium">{formatCurrency(loss.total_loss)}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openModal(loss)}
                          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(loss)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">
                {editingLoss ? 'Editar Perda' : 'Registrar Nova Perda'}
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
                  placeholder="Ex: Vidro 4mm quebrado durante corte"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Loss['category'] })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {Object.entries(categoryConfig).map(([value, { label }]) => (
                      <option key={value} value={value}>{label}</option>
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

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Material
                  </label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Ex: Vidro 4mm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Unidade
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="un">Un</option>
                    <option value="m">m</option>
                    <option value="m²">m²</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Custo Unitário
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Total da Perda
                  </label>
                  <input
                    type="text"
                    value={formatCurrency(formData.quantity * formData.unit_cost)}
                    readOnly
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-red-400 font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Responsável
                  </label>
                  <input
                    type="text"
                    value={formData.responsible}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Causa
                </label>
                <input
                  type="text"
                  value={formData.cause}
                  onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Ex: Manuseio incorreto"
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
