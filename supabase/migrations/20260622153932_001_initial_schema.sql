-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CLIENTS TABLE
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  document TEXT,
  type TEXT DEFAULT 'individual' CHECK (type IN ('individual', 'company')),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- SUPPLIERS TABLE
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  document TEXT,
  category TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- SERVICE CATEGORIES TABLE
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- WORK ORDERS (O.S.) TABLE
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'budget' CHECK (status IN ('budget', 'approved', 'in_progress', 'completed', 'cancelled', 'delivered')),
  total_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  install_address TEXT,
  install_city TEXT,
  install_date DATE,
  width DECIMAL(8,2),
  height DECIMAL(8,2),
  area DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- MATERIAL CATEGORIES TABLE
CREATE TABLE material_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('glass', 'aluminum', 'hardware', 'accessories', 'consumables', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- WORK ORDER ITEMS (MATERIALS/PRODUCTS)
CREATE TABLE work_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'un',
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- WORK ORDER OPERATIONAL COSTS
CREATE TABLE work_order_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('labor', 'fuel', 'transport', 'installation', 'equipment', 'other')),
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- ACCOUNTS PAYABLE
CREATE TABLE accounts_payable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('variable', 'fixed', 'provision')),
  subcategory TEXT,
  total_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'pix', 'debit', 'credit', 'transfer', 'boleto', 'check')),
  document_number TEXT,
  installment_number INT,
  total_installments INT,
  notes TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_frequency TEXT CHECK (recurrence_frequency IN ('monthly', 'weekly', 'yearly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- ACCOUNTS RECEIVABLE
CREATE TABLE accounts_receivable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  received_amount DECIMAL(12,2) DEFAULT 0,
  due_date DATE NOT NULL,
  expected_date DATE,
  receipt_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'received', 'overdue', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'pix', 'debit', 'credit', 'transfer', 'boleto')),
  document_number TEXT,
  installment_number INT,
  total_installments INT,
  card_fee_percent DECIMAL(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- LOSS/WASTE RECORDS
CREATE TABLE losses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('broken', 'cut_error', 'transport', 'rework', 'theft', 'other')),
  material TEXT,
  quantity DECIMAL(10,2),
  unit TEXT DEFAULT 'un',
  unit_cost DECIMAL(12,2) DEFAULT 0,
  total_loss DECIMAL(12,2) GENERATED ALWAYS AS (COALESCE(quantity, 0) * COALESCE(unit_cost, 0)) STORED,
  cause TEXT,
  responsible TEXT,
  notes TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- BANK ACCOUNTS
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  bank_name TEXT,
  agency TEXT,
  account_number TEXT,
  type TEXT CHECK (type IN ('checking', 'savings', 'cash', 'investment')),
  initial_balance DECIMAL(12,2) DEFAULT 0,
  current_balance DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- CASH FLOW TRANSACTIONS
CREATE TABLE cash_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category TEXT,
  subcategory TEXT,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  reference_date DATE,
  account_payable_id UUID REFERENCES accounts_payable(id) ON DELETE SET NULL,
  account_receivable_id UUID REFERENCES accounts_receivable(id) ON DELETE SET NULL,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  document_number TEXT,
  notes TEXT,
  is_reconciled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- INVENTORY/STOCK
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT,
  description TEXT NOT NULL,
  category_id UUID REFERENCES material_categories(id) ON DELETE SET NULL,
  unit TEXT DEFAULT 'un',
  current_quantity DECIMAL(10,2) DEFAULT 0,
  min_quantity DECIMAL(10,2) DEFAULT 0,
  unit_cost DECIMAL(12,2) DEFAULT 0,
  location TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- INVENTORY MOVEMENTS
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(12,2),
  total_value DECIMAL(12,2),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  reason TEXT,
  notes TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- PROFILES (User Data)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  owner_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  document TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS ON ALL TABLES
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE losses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR clients
CREATE POLICY "select_own_clients" ON clients FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_clients" ON clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_clients" ON clients FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_clients" ON clients FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS POLICIES FOR suppliers
CREATE POLICY "select_own_suppliers" ON suppliers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_suppliers" ON suppliers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_suppliers" ON suppliers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_suppliers" ON suppliers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS POLICIES FOR service_categories
CREATE POLICY "select_own_service_categories" ON service_categories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_service_categories" ON service_categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_service_categories" ON service_categories FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_service_categories" ON service_categories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS POLICIES FOR work_orders
CREATE POLICY "select_own_work_orders" ON work_orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_work_orders" ON work_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_work_orders" ON work_orders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_work_orders" ON work_orders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS POLICIES FOR material_categories
CREATE POLICY "select_own_material_categories" ON material_categories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_material_categories" ON material_categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_material_categories" ON material_categories FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_material_categories" ON material_categories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS POLICIES FOR work_order_items
CREATE POLICY "select_own_work_order_items" ON work_order_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_work_order_items" ON work_order_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_work_order_items" ON work_order_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_work_order_items" ON work_order_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS POLICIES FOR work_order_costs
CREATE POLICY "select_own_work_order_costs" ON work_order_costs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_work_order_costs" ON work_order_costs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_work_order_costs" ON work_order_costs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_work_order_costs" ON work_order_costs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS POLICIES FOR accounts_payable
CREATE POLICY "select_own_accounts_payable" ON accounts_payable FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_accounts_payable" ON accounts_payable FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_accounts_payable" ON accounts_payable FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_accounts_payable" ON accounts_payable FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS POLICIES FOR accounts_receivable
CREATE POLICY "select_own_accounts_receivable" ON accounts_receivable FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_accounts_receivable" ON accounts_receivable FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_accounts_receivable" ON accounts_receivable FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_accounts_receivable" ON accounts_receivable FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS POLICIES FOR losses
CREATE POLICY "select_own_losses" ON losses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_losses" ON losses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_losses" ON losses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_losses" ON losses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS POLICIES FOR bank_accounts
CREATE POLICY "select_own_bank_accounts" ON bank_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_bank_accounts" ON bank_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_bank_accounts" ON bank_accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_bank_accounts" ON bank_accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS POLICIES FOR cash_transactions
CREATE POLICY "select_own_cash_transactions" ON cash_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_cash_transactions" ON cash_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_cash_transactions" ON cash_transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_cash_transactions" ON cash_transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS POLICIES FOR inventory
CREATE POLICY "select_own_inventory" ON inventory FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_inventory" ON inventory FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_inventory" ON inventory FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_inventory" ON inventory FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS POLICIES FOR inventory_movements
CREATE POLICY "select_own_inventory_movements" ON inventory_movements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_inventory_movements" ON inventory_movements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_inventory_movements" ON inventory_movements FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_inventory_movements" ON inventory_movements FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS POLICIES FOR profiles
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_work_orders_user ON work_orders(user_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_client ON work_orders(client_id);
CREATE INDEX idx_accounts_payable_user ON accounts_payable(user_id);
CREATE INDEX idx_accounts_payable_status ON accounts_payable(status);
CREATE INDEX idx_accounts_payable_due ON accounts_payable(due_date);
CREATE INDEX idx_accounts_receivable_user ON accounts_receivable(user_id);
CREATE INDEX idx_accounts_receivable_status ON accounts_receivable(status);
CREATE INDEX idx_accounts_receivable_due ON accounts_receivable(due_date);
CREATE INDEX idx_cash_transactions_date ON cash_transactions(date);
CREATE INDEX idx_losses_date ON losses(date);
