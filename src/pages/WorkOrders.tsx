import { useEffect, useState } from 'react';
import { supabase, WorkOrder, WorkOrderItem, WorkOrderCost, ServiceCategory } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  ClipboardList,
  Calendar,
  MapPin,
  DollarSign,
  Package,
  Wrench,
  Loader2,
  Eye,
} from 'lucide-react';

interface ClientPartial {
  id: string;
  name: string;
}

const statusConfig = {
  budget: { label: 'Orçamento', color: 'bg-slate-500' },
  approved: { label: 'Aprovado', color: 'bg-cyan-500' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-500' },
  completed: { label: 'Concluído', color: 'bg-emerald-500' },
  delivered: { label: 'Entregue', color: 'bg-green-500' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500' },
};

const costCategories = [
  { value: 'labor', label: 'Mão de Obra' },
  { value: 'fuel', label: 'Combustível' },
  { value: 'transport', label: 'Transporte' },
  { value: 'installation', label: 'Instalação' },
  { value: 'equipment', label: 'Equipamento' },
  { value: 'other', label: 'Outros' },
];

interface WorkOrderWithDetails extends WorkOrder {
  items?: WorkOrderItem[];
  costs?: WorkOrderCost[];
  client_name?: string;
  category_name?: string;
}

export function WorkOrders() {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrderWithDetails[]>([]);
  const [clients, setClients] = useState<ClientPartial[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderWithDetails | null>(null);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrderWithDetails | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    number: '',
    client_id: '',
    category_id: '',
    title: '',
    description: '',
    status: 'budget' as WorkOrder['status'],
    total_value: 0,
    discount: 0,
    install_address: '',
    install_city: '',
    install_date: '',
    width: 0,
    height: 0,
    notes: '',
  });

  const [items, setItems] = useState<Partial<WorkOrderItem>[]>([]);
  const [costs, setCosts] = useState<Partial<WorkOrderCost>[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch work orders with related data
      const { data: ordersData } = await supabase
        .from('work_orders')
        .select(`
          *,
          clients(name),
          service_categories(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch items and costs for each order
      const ordersWithDetails: WorkOrderWithDetails[] = [];
      for (const order of ordersData || []) {
        const { data: itemsData } = await supabase
          .from('work_order_items')
          .select('*')
          .eq('work_order_id', order.id);

        const { data: costsData } = await supabase
          .from('work_order_costs')
          .select('*')
          .eq('work_order_id', order.id);

        ordersWithDetails.push({
          ...order,
          items: itemsData || [],
          costs: costsData || [],
          client_name: (order.clients as { name: string })?.name,
          category_name: (order.service_categories as { name: string })?.name,
        });
      }
      setWorkOrders(ordersWithDetails);

      // Fetch clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');
      setClients(clientsData || []);

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('service_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      setCategories(categoriesData || []);

      // If no categories, create default ones
      if (!categoriesData || categoriesData.length === 0) {
        const defaultCategories = [
          'Box Banheiro',
          'Fechamento de Sacada',
          'Janelas',
          'Espelhos',
          'Portas de Vidro',
          'Projetos Especiais',
        ];
        for (const cat of defaultCategories) {
          await supabase.from('service_categories').insert([{
            name: cat,
            user_id: user.id,
          }]);
        }
        const { data: newCategories } = await supabase
          .from('service_categories')
          .select('*')
          .eq('user_id', user.id)
          .order('name');
        setCategories(newCategories || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const count = workOrders.length + 1;
    return `OS-${year}${month}-${count.toString().padStart(4, '0')}`;
  };

  const filteredWorkOrders = workOrders.filter(order => {
    const matchesSearch =
      order.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openModal = (workOrder?: WorkOrderWithDetails) => {
    if (workOrder) {
      setEditingWorkOrder(workOrder);
      setFormData({
        number: workOrder.number,
        client_id: workOrder.client_id || '',
        category_id: workOrder.category_id || '',
        title: workOrder.title,
        description: workOrder.description || '',
        status: workOrder.status,
        total_value: workOrder.total_value,
        discount: workOrder.discount,
        install_address: workOrder.install_address || '',
        install_city: workOrder.install_city || '',
        install_date: workOrder.install_date || '',
        width: workOrder.width || 0,
        height: workOrder.height || 0,
        notes: workOrder.notes || '',
      });
      setItems(workOrder.items?.map(i => ({
        id: i.id,
        description: i.description,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
        unit_cost: i.unit_cost,
        unit_price: i.unit_price,
        notes: i.notes,
      })) || []);
      setCosts(workOrder.costs?.map(c => ({
        id: c.id,
        description: c.description,
        category: c.category,
        amount: c.amount,
        notes: c.notes,
        date: c.date,
      })) || []);
    } else {
      setEditingWorkOrder(null);
      setFormData({
        number: generateNumber(),
        client_id: '',
        category_id: '',
        title: '',
        description: '',
        status: 'budget',
        total_value: 0,
        discount: 0,
        install_address: '',
        install_city: '',
        install_date: '',
        width: 0,
        height: 0,
        notes: '',
      });
      setItems([]);
      setCosts([]);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingWorkOrder(null);
    setItems([]);
    setCosts([]);
  };

  const addItem = () => {
    setItems([...items, {
      description: '',
      category: '',
      quantity: 1,
      unit: 'un',
      unit_cost: 0,
      unit_price: 0,
      notes: '',
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof WorkOrderItem, value: unknown) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addCost = () => {
    setCosts([...costs, {
      description: '',
      category: 'labor',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
    }]);
  };

  const removeCost = (index: number) => {
    setCosts(costs.filter((_, i) => i !== index));
  };

  const updateCost = (index: number, field: keyof WorkOrderCost, value: unknown) => {
    const newCosts = [...costs];
    newCosts[index] = { ...newCosts[index], [field]: value };
    setCosts(newCosts);
  };

  const calculateTotals = () => {
    const materialCost = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_cost || 0)), 0);
    const materialPrice = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
    const operationalCost = costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);
    const totalCost = materialCost + operationalCost;
    const revenue = (formData.total_value || materialPrice) - formData.discount;
    const profit = revenue - totalCost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return { materialCost, materialPrice, operationalCost, totalCost, revenue, profit, margin };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const orderData = {
        ...formData,
        user_id: user.id,
        area: formData.width && formData.height ? formData.width * formData.height : null,
        updated_at: new Date().toISOString(),
        completed_at: ['completed', 'delivered'].includes(formData.status)
          ? new Date().toISOString()
          : null,
      };

      let workOrderId: string;

      if (editingWorkOrder) {
        const { error } = await supabase
          .from('work_orders')
          .update(orderData)
          .eq('id', editingWorkOrder.id);

        if (error) throw error;
        workOrderId = editingWorkOrder.id;

        // Delete existing items and costs
        await supabase.from('work_order_items').delete().eq('work_order_id', workOrderId);
        await supabase.from('work_order_costs').delete().eq('work_order_id', workOrderId);
      } else {
        const { data, error } = await supabase
          .from('work_orders')
          .insert([orderData])
          .select('id')
          .single();

        if (error) throw error;
        workOrderId = data.id;
      }

      // Insert items
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          ...item,
          work_order_id: workOrderId,
          user_id: user.id,
        }));
        await supabase.from('work_order_items').insert(itemsToInsert);
      }

      // Insert costs
      if (costs.length > 0) {
        const costsToInsert = costs.map(cost => ({
          ...cost,
          work_order_id: workOrderId,
          user_id: user.id,
        }));
        await supabase.from('work_order_costs').insert(costsToInsert);
      }

      await fetchData();
      closeModal();
    } catch (error) {
      console.error('Error saving work order:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (workOrder: WorkOrder) => {
    if (!user || !confirm(`Deseja realmente excluir a OS "${workOrder.number}"?`)) return;

    try {
      const { error } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', workOrder.id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting work order:', error);
    }
  };

  const openDetails = async (workOrder: WorkOrderWithDetails) => {
    setSelectedWorkOrder(workOrder);
    setShowDetailsModal(true);
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

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ordens de Serviço</h1>
          <p className="text-slate-400 mt-1">{workOrders.length} ordens cadastradas</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-cyan-500/30"
        >
          <Plus className="w-5 h-5" />
          Nova O.S.
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar O.S."
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

      {/* Work Orders List */}
      {filteredWorkOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <ClipboardList className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">Nenhuma ordem de serviço encontrada</p>
          <p className="text-sm mt-1">Crie sua primeira O.S. clicando no botão acima</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWorkOrders.map((order) => {
            const orderItems = order.items || [];
            const orderCosts = order.costs || [];
            const materialCost = orderItems.reduce((sum, i) => sum + i.total_cost, 0);
            const operationalCost = orderCosts.reduce((sum, c) => sum + c.amount, 0);
            const totalCost = materialCost + operationalCost;
            const revenue = order.total_value - order.discount;
            const profit = revenue - totalCost;
            const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

            return (
              <div
                key={order.id}
                className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl border border-slate-700 hover:border-slate-600 transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <ClipboardList className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{order.number}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs text-white ${statusConfig[order.status].color}`}>
                            {statusConfig[order.status].label}
                          </span>
                        </div>
                        <p className="text-white font-medium">{order.title}</p>
                        {order.client_name && (
                          <p className="text-slate-400 text-sm">{order.client_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDetails(order)}
                        className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal(order)}
                        className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(order)}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Receita</p>
                      <p className="text-white font-semibold">{formatCurrency(revenue)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Custos</p>
                      <p className="text-orange-400 font-semibold">{formatCurrency(totalCost)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Lucro</p>
                      <p className={`font-semibold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(profit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Margem</p>
                      <p className={`font-semibold ${margin >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                        {margin.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {(order.install_date || order.category_name) && (
                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-400">
                      {order.category_name && (
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {order.category_name}
                        </span>
                      )}
                      {order.install_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(order.install_date)}
                        </span>
                      )}
                      {order.install_address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {order.install_address}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-4xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800">
              <h2 className="text-xl font-semibold text-white">
                {editingWorkOrder ? 'Editar O.S.' : 'Nova Ordem de Serviço'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Número da O.S.
                  </label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as WorkOrder['status'] })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {Object.entries(statusConfig).map(([value, { label }]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Tipo de Serviço
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Selecione...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Ex: Box banheiro master 1.80x2.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Largura (m)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Altura (m)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Área (m²)
                  </label>
                  <input
                    type="text"
                    value={formData.width && formData.height ? (formData.width * formData.height).toFixed(2) : ''}
                    readOnly
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Valor Total
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_value}
                    onChange={(e) => setFormData({ ...formData, total_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Desconto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Installation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data Instalação
                  </label>
                  <input
                    type="date"
                    value={formData.install_date}
                    onChange={(e) => setFormData({ ...formData, install_date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.install_city}
                    onChange={(e) => setFormData({ ...formData, install_city: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Endereço de Instalação
                </label>
                <input
                  type="text"
                  value={formData.install_address}
                  onChange={(e) => setFormData({ ...formData, install_address: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Materials Section */}
              <div className="border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-cyan-400" />
                    Materiais / Produtos
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>

                {items.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">Nenhum material adicionado</p>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4">
                          <label className="text-xs text-slate-400 mb-1 block">Descrição</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="text-xs text-slate-400 mb-1 block">Qtd</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="text-xs text-slate-400 mb-1 block">Un.</label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-slate-400 mb-1 block">Custo Un.</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unit_cost}
                            onChange={(e) => updateItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-slate-400 mb-1 block">Venda Un.</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="text-xs text-slate-400 mb-1 block">Total</label>
                          <p className="px-3 py-2 text-sm text-slate-400">
                            {formatCurrency((item.quantity || 0) * (item.unit_cost || 0))}
                          </p>
                        </div>
                        <div className="col-span-1">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Total Materiais (custo):</span>
                      <span className="text-white font-medium">{formatCurrency(totals.materialCost)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Operational Costs Section */}
              <div className="border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-orange-400" />
                    Custos Operacionais
                  </h3>
                  <button
                    type="button"
                    onClick={addCost}
                    className="flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>

                {costs.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">Nenhum custo operacional adicionado</p>
                ) : (
                  <div className="space-y-3">
                    {costs.map((cost, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-3">
                          <label className="text-xs text-slate-400 mb-1 block">Descrição</label>
                          <input
                            type="text"
                            value={cost.description}
                            onChange={(e) => updateCost(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-slate-400 mb-1 block">Categoria</label>
                          <select
                            value={cost.category}
                            onChange={(e) => updateCost(index, 'category', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm"
                          >
                            {costCategories.map((cat) => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-slate-400 mb-1 block">Valor</label>
                          <input
                            type="number"
                            step="0.01"
                            value={cost.amount}
                            onChange={(e) => updateCost(index, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-slate-400 mb-1 block">Data</label>
                          <input
                            type="date"
                            value={cost.date ?? ''}
                            onChange={(e) => updateCost(index, 'date', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-slate-400 mb-1 block">Obs</label>
                          <input
                            type="text"
                            value={cost.notes ?? ''}
                            onChange={(e) => updateCost(index, 'notes', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm"
                          />
                        </div>
                        <div className="col-span-1">
                          <button
                            type="button"
                            onClick={() => removeCost(index)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {costs.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Total Custos Operacionais:</span>
                      <span className="text-white font-medium">{formatCurrency(totals.operationalCost)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-cyan-400" />
                  Resumo Financeiro
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Receita</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(totals.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Custo Total</p>
                    <p className="text-xl font-bold text-orange-400">{formatCurrency(totals.totalCost)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Lucro Bruto</p>
                    <p className={`text-xl font-bold ${totals.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(totals.profit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Margem</p>
                    <p className={`text-xl font-bold ${totals.margin >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                      {totals.margin.toFixed(1)}%
                    </p>
                  </div>
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

      {/* Details Modal */}
      {showDetailsModal && selectedWorkOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-3xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800">
              <h2 className="text-xl font-semibold text-white">
                Detalhes - {selectedWorkOrder.number}
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 text-sm">Título</p>
                  <p className="text-white">{selectedWorkOrder.title}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Cliente</p>
                  <p className="text-white">{selectedWorkOrder.client_name || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Tipo de Serviço</p>
                  <p className="text-white">{selectedWorkOrder.category_name || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Status</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs text-white ${statusConfig[selectedWorkOrder.status].color}`}>
                    {statusConfig[selectedWorkOrder.status].label}
                  </span>
                </div>
              </div>

              {/* Materials */}
              {selectedWorkOrder.items && selectedWorkOrder.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Materiais</h3>
                  <div className="bg-slate-700/30 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-700/50">
                        <tr>
                          <th className="text-left p-3 text-slate-300">Descrição</th>
                          <th className="text-right p-3 text-slate-300">Qtd</th>
                          <th className="text-right p-3 text-slate-300">Custo Un.</th>
                          <th className="text-right p-3 text-slate-300">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedWorkOrder.items.map((item) => (
                          <tr key={item.id} className="border-t border-slate-700">
                            <td className="p-3 text-white">{item.description}</td>
                            <td className="p-3 text-right text-slate-400">{item.quantity} {item.unit}</td>
                            <td className="p-3 text-right text-slate-400">{formatCurrency(item.unit_cost)}</td>
                            <td className="p-3 text-right text-white">{formatCurrency(item.total_cost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Operational Costs */}
              {selectedWorkOrder.costs && selectedWorkOrder.costs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Custos Operacionais</h3>
                  <div className="bg-slate-700/30 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-700/50">
                        <tr>
                          <th className="text-left p-3 text-slate-300">Descrição</th>
                          <th className="text-left p-3 text-slate-300">Categoria</th>
                          <th className="text-left p-3 text-slate-300">Data</th>
                          <th className="text-right p-3 text-slate-300">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedWorkOrder.costs.map((cost) => (
                          <tr key={cost.id} className="border-t border-slate-700">
                            <td className="p-3 text-white">{cost.description}</td>
                            <td className="p-3 text-slate-400">
                              {costCategories.find(c => c.value === cost.category)?.label || cost.category}
                            </td>
                            <td className="p-3 text-slate-400">{formatDate(cost.date)}</td>
                            <td className="p-3 text-right text-white">{formatCurrency(cost.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
