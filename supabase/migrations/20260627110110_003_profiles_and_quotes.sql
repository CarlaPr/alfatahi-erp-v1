-- FASE 2: PERFIS DE ACESSO
-- Adicionar sistema de roles (GESTAO, VENDAS)

-- Adicionar coluna role na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'gestao' 
CHECK (role IN ('gestao', 'vendas'));

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Criar tabela de orçamentos para FASE 4
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  client_document TEXT,
  client_address TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'negotiation', 'cancelled', 'expired')),
  total_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  valid_until DATE,
  notes TEXT,
  payment_method TEXT CHECK (payment_method IN ('pix', 'cash', 'debit', 'credit', 'installment')),
  installment_count INT DEFAULT 1,
  card_fee_percent DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  expires_at DATE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  company_data JSONB,
  location TEXT,
  photos TEXT[],
  created_by_name TEXT
);

-- Itens do orçamento
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('product', 'service')),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  width DECIMAL(8,2),
  height DECIMAL(8,2),
  area DECIMAL(10,2),
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'un',
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  subtotal DECIMAL(12,2) GENERATED ALWAYS AS (
    (quantity * unit_price) - discount
  ) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Adicionar coluna quote_id na work_orders para rastreabilidade
ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;

-- Adicionar coluna role na tabela users do auth (via trigger)
-- Criar função para criar profile automaticamente com role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'company_name', 'gestao');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar profile automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS para quotes
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_quotes" ON quotes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_quotes" ON quotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_quotes" ON quotes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_quotes" ON quotes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "select_own_quote_items" ON quote_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_quote_items" ON quote_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_quote_items" ON quote_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_quote_items" ON quote_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_quotes_user ON quotes(user_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_client ON quotes(client_id);
CREATE INDEX idx_quote_items_quote ON quote_items(quote_id);
CREATE INDEX idx_work_orders_quote ON work_orders(quote_id);